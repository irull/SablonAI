import OpenAI from "openai";

export const META_BASE_URL = "https://api.meta.ai/v1";
export const models = {
  spark: "muse-spark-1.3",
  image: "muse-image-1.0",
  sam: "sam-3.1",
};
export function getClient() {
  return new OpenAI({
    apiKey: process.env.META_API_KEY,
    baseURL: META_BASE_URL,
    timeout: 150000,
    maxRetries: 0,
  });
}
export function responseText(response) {
  return (
    response.output
      ?.filter((o) => o.type === "message")
      .flatMap((o) => o.content || [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text)
      .join("\n") || ""
  );
}
// Never send the upstream body to visitors: it can contain request details.
export function publicApiError(e) {
  const status = Number(e.status);
  const hints = {
    401: "API key ditolak. Periksa pengaturan server.",
    403: "Akun belum mendapat akses ke model ini.",
    429: "Batas pemakaian Meta tercapai. Tunggu sebelum mencoba lagi.",
  };
  if (hints[status]) return hints[status];
  if (e.name?.includes("Timeout") || e.name === "AbortError")
    return "Meta belum merespons tepat waktu. Desain sebelumnya tetap tersedia.";
  return "Layanan Meta belum berhasil memproses permintaan. Gunakan desain demo atau coba lagi.";
}
export function validateAction(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Permintaan tidak valid.");
  if (!["refine", "image", "segment"].includes(body.action))
    throw new Error("Aksi tidak dikenal.");
  if (
    body.action === "refine" &&
    (typeof body.brief !== "string" ||
      body.brief.trim().length < 5 ||
      body.brief.length > 1500)
  )
    throw new Error("Tuliskan brief 5–1.500 karakter.");
  if (
    body.action === "image" &&
    (typeof body.prompt !== "string" ||
      body.prompt.trim().length < 5 ||
      body.prompt.length > 4000)
  )
    throw new Error("Prompt desain tidak valid.");
  if (body.action === "segment") {
    if (
      typeof body.image !== "string" ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(
        body.image,
      ) ||
      body.image.length > 3000000
    )
      throw new Error(
        "Gunakan gambar PNG/JPG/WebP di bawah 2 MB setelah diproses.",
      );
    if (
      typeof body.subject !== "string" ||
      body.subject.trim().length < 2 ||
      body.subject.length > 120
    )
      throw new Error(
        "Sebutkan objek yang ingin dipertahankan (2–120 karakter).",
      );
  }
}
