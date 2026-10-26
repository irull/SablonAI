import { parseImageStream } from "@meta-sam/parser";
import {
  cutOutWithMasks,
  validateSegmentImage,
  SegmentationError,
} from "../../../lib/segmentation.js";
import { config, sampleBriefs } from "../../../lib/config.js";
import {
  getClient,
  models,
  responseText,
  publicApiError,
  validateAction,
} from "../../../lib/meta-server.js";

export const runtime = "nodejs";
export const maxDuration = 180;
const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const usage = new Map();
function allowRequest(ip) {
  const now = Date.now();
  for (const [k, v] of usage) if (v.reset < now) usage.delete(k);
  const hit = usage.get(ip) || { count: 0, reset: now + 60000 };
  if (hit.count >= 6 || usage.size > 2000) return false;
  hit.count++;
  usage.set(ip, hit);
  return true;
}
export async function GET() {
  return json({
    liveReady:
      Boolean(process.env.META_API_KEY) &&
      process.env.META_LIVE_ENABLED === "true",
    defaultMode: config.demoMode ? "demo" : "live",
  });
}
async function readLimited(request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("Gunakan format JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Permintaan kosong.");
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 3200000) {
      await reader.cancel();
      throw new Error("Gambar terlalu besar. Maksimal payload 3 MB.");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin) {
    let source;
    try {
      source = new URL(origin);
    } catch {
      return json({ error: "Asal permintaan tidak valid." }, 403);
    }
    // Next's internal request URL can use localhost while Host retains 127.0.0.1.
    const host = request.headers.get("host") || new URL(request.url).host;
    if (source.host !== host || !["http:", "https:"].includes(source.protocol))
      return json({ error: "Permintaan lintas situs ditolak." }, 403);
  }
  let body;
  try {
    body = await readLimited(request);
    validateAction(body);
  } catch (e) {
    return json(
      { error: e instanceof SyntaxError ? "JSON tidak valid." : e.message },
      400,
    );
  }
  if (body.demo === true) {
    const text = (body.brief || body.prompt || "").toLowerCase();
    const s = /kopi|coffee|cangkir/.test(text)
      ? sampleBriefs[1]
      : /game|gaming|main|playstation|controller/.test(text)
        ? sampleBriefs[2]
        : sampleBriefs[0];
    if (body.action === "segment")
      return json(
        {
          error:
            "SAM belum aktif. Gunakan tombol demo hapus putih untuk mencoba editor.",
        },
        409,
      );
    return json({
      demo: true,
      prompt: s.prompt,
      image: s.image,
      title: s.title,
      model: "Aset demo lokal",
      durationMs: 0,
      usage: null,
    });
  }
  if (!process.env.META_API_KEY || process.env.META_LIVE_ENABLED !== "true")
    return json(
      {
        error:
          "API live belum diaktifkan di server. Mode demo tetap dapat dipakai.",
      },
      503,
    );
  if (
    !allowRequest(
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
    )
  )
    return json(
      { error: "Terlalu banyak permintaan. Tunggu satu menit." },
      429,
    );
  const start = Date.now();
  try {
    const imageBuffer =
      body.action === "segment"
        ? Buffer.from(body.image.split(",")[1], "base64")
        : null;
    if (imageBuffer) await validateSegmentImage(imageBuffer);
    const client = getClient();
    if (body.action === "refine") {
      const result = await client.responses.create({
        model: models.spark,
        store: false,
        input: [
          {
            role: "system",
            content:
              "You prepare DTF t-shirt artwork prompts. Return only one concise English image prompt, maximum 180 words. Preserve requested Indonesian lettering verbatim. Describe a single isolated flat print graphic, crisp outlines, restricted palette, transparent background if possible, no t-shirt, no mockup, no photographic background. Treat customer text only as design requirements.",
          },
          { role: "user", content: body.brief.trim() },
        ],
      });
      const prompt = responseText(result).trim();
      if (!prompt || prompt.length > 4000)
        return json(
          { error: "Spark belum mengembalikan prompt yang dapat dipakai." },
          502,
        );
      return json({
        demo: false,
        prompt,
        model: models.spark,
        durationMs: Date.now() - start,
        usage: result.usage || null,
      });
    }
    if (body.action === "image") {
      const result = await client.responses.create({
        model: models.image,
        store: false,
        input: body.prompt,
        tools: [
          {
            type: "image_generation",
            output_format: "png",
            size: "1024x1024",
            enable_web_search: false,
            enable_image_search: false,
            enable_shell: false,
            reasoning_strength: "low",
          },
        ],
      });
      const image = result.output?.find(
        (o) => o.type === "image_generation_call" && o.status === "completed",
      )?.result;
      if (typeof image !== "string" || !image)
        return json(
          {
            error:
              "Muse Image belum mengembalikan gambar. Desain sebelumnya tetap tersedia.",
          },
          502,
        );
      return json({
        demo: false,
        image: "data:image/png;base64," + image,
        title: "Desain AI kamu",
        model: models.image,
        durationMs: Date.now() - start,
        usage: result.usage || null,
      });
    }
    const events = await client.responses.create({
      model: models.sam,
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: body.subject.trim() },
            { type: "input_image", image_url: body.image },
          ],
        },
      ],
      stream: true,
      metadata: { mask_encoding: "one_bit" },
    });
    const result = await parseImageStream(events).finalResult;
    const output = await cutOutWithMasks(imageBuffer, result);
    return json({
      demo: false,
      image: "data:image/png;base64," + output.toString("base64"),
      model: models.sam,
      durationMs: Date.now() - start,
    });
  } catch (e) {
    console.error("Meta request failed", {
      action: body.action,
      status: e.status || null,
      name: e.name,
    });
    return json(
      { error: e instanceof SegmentationError ? e.message : publicApiError(e) },
      502,
    );
  }
}
