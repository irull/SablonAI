import test from "node:test";
import assert from "node:assert/strict";
import { buildReadyOrder, readOrders, writeOrders } from "../lib/orders.js";

const color = { name: "Hitam", hex: "#292b2b" };

test("Ready-product order: kids XXL plain, qty 2, totals 90.000", () => {
  const o = buildReadyOrder({
    customer: "Bima",
    phone: "0812 3456 7890",
    productId: "kaos-anak",
    size: "XXL",
    color,
    quantity: 2,
  });
  assert.equal(o.quote.total, 90000);
  assert.equal(o.quote.frontPrintLabel, null);
  assert.equal(o.status, "Diproses");
  assert.equal(o.source, "katalog");
  assert.equal(o.phone, "6281234567890");
  assert.match(o.id, /^SA-\d{6}-[0-9A-F]{6}$/);
});

test("Ready-product order: hoodie single size is 100.000", () => {
  const o = buildReadyOrder({
    customer: "Sari",
    phone: "+628123456789",
    productId: "hoodie",
    size: "All Size",
    color,
    quantity: 1,
  });
  assert.equal(o.quote.total, 100000);
});

test("Ready-product order rejects bad name and phone", () => {
  assert.throws(() =>
    buildReadyOrder({
      customer: " ",
      phone: "081234567890",
      productId: "hoodie",
      size: "All Size",
      color,
      quantity: 1,
    }),
  );
  assert.throws(() =>
    buildReadyOrder({
      customer: "Bima",
      phone: "123",
      productId: "hoodie",
      size: "All Size",
      color,
      quantity: 1,
    }),
  );
});

test("Catalog orders survive the storage roundtrip validation", () => {
  const store = {
    v: null,
    getItem() {
      return this.v;
    },
    setItem(k, val) {
      this.v = val;
    },
  };
  const o = buildReadyOrder({
    customer: "Bima",
    phone: "081234567890",
    productId: "totebag",
    size: "1 Ukuran",
    color,
    quantity: 3,
  });
  writeOrders(store, [o]);
  const back = readOrders(store);
  assert.equal(back.length, 1);
  assert.equal(back[0].quote.total, 75000);
});
