import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { parseImageStream } from "@meta-sam/parser";
import { cutOutWithMasks, validateSegmentImage } from "../lib/segmentation.js";
// Public fixture: https://dev.meta.ai/docs/sam/reading-segmentation
const text =
  "<0f>0<|box;x1=211;y1=228;x2=270;y2=254;w=320;h=334|><|mask;x=0;y=0;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7`e.ioeAf6-k/#Xd8%dX9x(|>";
async function* events() {
  for (const delta of [text.slice(0, 40), text.slice(40, 100), text.slice(100)])
    yield {
      type: "response.output_text.delta",
      item_id: "fixture",
      output_index: 0,
      content_index: 0,
      delta,
    };
  yield {
    type: "response.output_text.done",
    item_id: "fixture",
    output_index: 0,
    content_index: 0,
    text,
  };
  yield { type: "response.completed" };
}
test("Official SAM mask fixture survives chunked parsing and composites at box coordinates", async () => {
  const result = await parseImageStream(events()).finalResult;
  assert.equal(result.outcome.status, "completed");
  const image = await sharp({
    create: {
      width: 320,
      height: 334,
      channels: 4,
      background: { r: 230, g: 30, b: 15, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  const output = await cutOutWithMasks(image, result);
  const { data, info } = await sharp(output)
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 320);
  assert.equal(info.height, 334);
  assert.equal(info.channels, 4);
  assert.equal(data[3], 0);
  let opaque = 0;
  for (let y = 0; y < 334; y++)
    for (let x = 0; x < 320; x++) {
      const i = (y * 320 + x) * 4;
      if (data[i + 3]) {
        opaque++;
        assert.ok(x >= 211 && x <= 270 && y >= 228 && y <= 254);
        assert.equal(data[i], 230);
      }
    }
  assert.ok(opaque > 0 && opaque <= 1620);
});
test("Empty and incomplete SAM results cannot produce fake success", async () => {
  const image = await sharp({
    create: { width: 2, height: 2, channels: 4, background: "#ffffff" },
  })
    .png()
    .toBuffer();
  await assert.rejects(
    cutOutWithMasks(image, {
      outcome: { status: "completed" },
      diagnostics: [],
      records: [],
    }),
    /tidak ditemukan/,
  );
  await assert.rejects(
    cutOutWithMasks(image, {
      outcome: { status: "incomplete" },
      diagnostics: [],
      records: [],
    }),
    /tidak menyelesaikan/,
  );
});

test("Malformed uploaded bytes are rejected before a segmentation call", async () => {
  await assert.rejects(
    validateSegmentImage(Buffer.from("not an image")),
    /tidak dapat dibaca/,
  );
});
