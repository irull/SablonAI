import test from "node:test";
import assert from "node:assert/strict";
import { readOrders, writeOrders, buildReadyOrder } from "../lib/orders.js";

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  };
}

test("Studio order with a separate back artwork survives the storage roundtrip", () => {
  const storage = fakeStorage();
  const order = {
    id: "SA-261031-ABC123",
    customer: "Budi",
    status: "Diproses",
    quote: { total: 110000 },
    artwork: "data:image/png;base64,FRONT",
    backArtwork: "data:image/png;base64,BACK",
  };
  writeOrders(storage, [order]);
  const back = readOrders(storage);
  assert.equal(back[0].artwork, "data:image/png;base64,FRONT");
  assert.equal(back[0].backArtwork, "data:image/png;base64,BACK");
});

test("Catalog orders carry a null back artwork field", () => {
  const o = buildReadyOrder({
    customer: "Ani",
    phone: "081200001111",
    productId: "totebag",
    size: "1 Ukuran",
    color: { name: "Putih", hex: "#f2f0e8" },
    quantity: 1,
  });
  assert.equal(o.backArtwork, null);
  assert.equal(o.artwork, null);
});
