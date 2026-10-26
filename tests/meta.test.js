import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/meta/route.js";
import { sampleBriefs } from "../lib/config.js";
const request = (body) =>
  new Request("http://localhost/api/meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
for (const s of sampleBriefs)
  test("Demo brief: " + s.title, async () => {
    const a = await POST(
      request({ action: "refine", brief: s.brief, demo: true }),
    );
    assert.equal(a.status, 200);
    const refined = await a.json();
    assert.equal(refined.demo, true);
    assert.equal(refined.prompt, s.prompt);
    const b = await POST(
      request({ action: "image", prompt: refined.prompt, demo: true }),
    );
    const result = await b.json();
    assert.equal(result.image, s.image);
  });
test("Invalid input is rejected before a model call", async () => {
  assert.equal((await POST(request({ action: "unknown" }))).status, 400);
  assert.equal(
    (await POST(request({ action: "refine", brief: "x" }))).status,
    400,
  );
  assert.equal(
    (
      await POST(
        request({
          action: "segment",
          image: "https://private",
          subject: "logo",
        }),
      )
    ).status,
    400,
  );
});
test("Cross-origin calls are rejected", async () => {
  const req = new Request("http://localhost/api/meta", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://other.example",
    },
    body: JSON.stringify({
      action: "refine",
      brief: "kaos gunung",
      demo: true,
    }),
  });
  assert.equal((await POST(req)).status, 403);
});
test("Unconfigured live API stays disabled", async () => {
  const old = process.env.META_LIVE_ENABLED;
  process.env.META_LIVE_ENABLED = "false";
  try {
    assert.equal(
      (await POST(request({ action: "refine", brief: "kaos gunung" }))).status,
      503,
    );
  } finally {
    if (old === undefined) delete process.env.META_LIVE_ENABLED;
    else process.env.META_LIVE_ENABLED = old;
  }
});

test("Internal localhost request URL accepts the original same-site Host header", async () => {
  const req = new Request("http://localhost/api/meta", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:3000",
      Host: "127.0.0.1:3000",
    },
    body: JSON.stringify({
      action: "refine",
      brief: "Kaos komunitas gunung",
      demo: true,
    }),
  });
  assert.equal((await POST(req)).status, 200);
});
