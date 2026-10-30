import test from "node:test";
import assert from "node:assert/strict";
import { strings, translate, statusLabel } from "../lib/i18n.js";

test("Both languages expose exactly the same keys", () => {
  assert.deepEqual(Object.keys(strings.en).sort(), Object.keys(strings.id).sort());
});

test("Translate interpolates variables and falls back to Indonesian", () => {
  assert.equal(translate("id", "successSaved", { id: "SA-1" }), "Order SA-1 tersimpan di browser ini.");
  assert.equal(translate("en", "successSaved", { id: "SA-1" }), "Order SA-1 saved in this browser.");
  assert.equal(translate("xx", "help"), "Panduan");
  assert.equal(translate("en", "unknown-key"), "unknown-key");
});

test("Order status display labels follow the UI language, values stay Indonesian", () => {
  assert.equal(statusLabel("id", "Produksi"), "Produksi");
  assert.equal(statusLabel("en", "Produksi"), "In production");
  assert.equal(statusLabel("en", "Diterima"), "Delivered");
});
