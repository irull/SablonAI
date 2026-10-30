import test from "node:test";
import assert from "node:assert/strict";
import { calculatePrice } from "../lib/pricing.js";
import { readOrders, writeOrders, ORDER_STORAGE_KEY, orderStatuses } from "../lib/orders.js";
test("Known example from owner: short-sleeve M, front A5, back A3", () => {
  assert.deepEqual(
    calculatePrice({
      productId: "kaos-pendek",
      size: "M",
      frontPrintId: "A5",
      backPrintId: "A3",
      quantity: 1,
    }),
    {
      productId: "kaos-pendek",
      product: "Kaos Lengan Pendek",
      size: "M",
      frontPrintId: "A5",
      frontPrintLabel: "15×20 cm (A5)",
      front: 20000,
      backPrintId: "A3",
      backPrintLabel: "32×42 cm (A3)",
      back: 40000,
      shirt: 50000,
      print: 60000,
      unit: 110000,
      total: 110000,
      quantity: 1,
    },
  );
});
test("One-sided print: back is zero, quantity multiplies the unit", () => {
  const p = calculatePrice({
    productId: "kaos-pendek",
    size: "L",
    frontPrintId: "A4",
    backPrintId: null,
    quantity: 2,
  });
  assert.equal(p.shirt, 50000);
  assert.equal(p.front, 30000);
  assert.equal(p.back, 0);
  assert.equal(p.unit, 80000);
  assert.equal(p.total, 160000);
});
test("Extra X pricing: kids XXL is 45.000, adult 4XL follows +10.000 per X", () => {
  assert.equal(
    calculatePrice({
      productId: "kaos-anak",
      size: "XXL",
      frontPrintId: "10x15",
      quantity: 1,
    }).unit,
    60000,
  );
  assert.equal(
    calculatePrice({
      productId: "kaos-panjang",
      size: "4XL",
      frontPrintId: "10x10",
      quantity: 1,
    }).unit,
    100000,
  );
  assert.equal(
    calculatePrice({
      productId: "hoodie",
      size: "All Size",
      frontPrintId: "A3",
      quantity: 1,
    }).unit,
    140000,
  );
});
test("All products and sizes stay valid", () => {
  for (const [productId, sizes] of [
    ["kaos-pendek", ["S", "M", "L", "XL", "2XL", "3XL", "4XL"]],
    ["kaos-panjang", ["S", "M", "L", "XL", "2XL", "3XL", "4XL"]],
    ["hoodie", ["All Size"]],
    ["totebag", ["1 Ukuran"]],
    ["kaos-anak", ["XS", "S", "M", "L", "XL", "XXL"]],
  ])
    for (const size of sizes)
      assert.ok(
        calculatePrice({
          productId,
          size,
          frontPrintId: "A5",
          quantity: 100,
        }).total > 0,
      );
});
test("Reject invalid products, sizes, print sizes and quantities", () => {
  const base = {
    productId: "kaos-pendek",
    size: "L",
    frontPrintId: "A5",
    quantity: 1,
  };
  for (const changes of [
    { productId: "kaos-tidak-ada" },
    { size: "5XL" },
    { size: "XXS" },
    { frontPrintId: "25x10" },
    { frontPrintId: null },
    { backPrintId: "25x10" },
    { quantity: 0 },
    { quantity: 1.5 },
    { quantity: 101 },
  ])
    assert.throws(() => calculatePrice({ ...base, ...changes }));
});
function storage(initial = null) {
  let raw = initial;
  return {
    getItem: (k) => raw,
    setItem: (k, v) => {
      assert.equal(k, ORDER_STORAGE_KEY);
      raw = v;
    },
  };
}
test("Order storage roundtrip and status survive reload", () => {
  const s = storage();
  assert.deepEqual(readOrders(s), []);
  const order = {
    id: "SA-TEST",
    customer: "Pelanggan Demo",
    quote: { total: 110000 },
    status: "Diproses",
  };
  writeOrders(s, [order]);
  assert.deepEqual(readOrders(s), [order]);
  writeOrders(s, [{ ...order, status: "Produksi" }]);
  assert.equal(readOrders(s)[0].status, "Produksi");
});
test("Corrupt orders are reported instead of silently erased", () => {
  assert.throws(() => readOrders(storage("not JSON")));
  assert.throws(() => readOrders(storage("{}")));
  assert.throws(() => readOrders(storage('[{"id":"bad"}]')));
});
test("Quota failure must not report success", () => {
  assert.throws(
    () =>
      writeOrders(
        {
          setItem: () => {
            throw new Error("QuotaExceededError");
          },
        },
        [],
      ),
    /belum tersimpan/,
  );
});

test("Landscape print swaps width and height, price stays the same", () => {
  const p = calculatePrice({
    productId: "kaos-pendek",
    size: "M",
    frontPrintId: "A5",
    backPrintId: "A3",
    frontOrientation: "landscape",
    backOrientation: "landscape",
    quantity: 1,
  });
  assert.equal(p.frontPrintLabel, "20×15 cm (A5, Lanskap)");
  assert.equal(p.backPrintLabel, "42×32 cm (A3, Lanskap)");
  assert.equal(p.front, 20000);
  assert.equal(p.back, 40000);
  assert.equal(p.unit, 110000);
  assert.equal(p.total, 110000);
});
test("Square print is unaffected by landscape", () => {
  const p = calculatePrice({
    productId: "kaos-pendek",
    size: "M",
    frontPrintId: "10x10",
    frontOrientation: "landscape",
    quantity: 1,
  });
  assert.equal(p.frontPrintLabel, "10×10 cm");
  assert.equal(p.front, 10000);
});
test("Invalid orientation is rejected", () => {
  const base = {
    productId: "kaos-pendek",
    size: "L",
    frontPrintId: "A5",
    quantity: 1,
  };
  assert.throws(() => calculatePrice({ ...base, frontOrientation: "diagonal" }));
  assert.throws(() => calculatePrice({ ...base, backOrientation: "miring" }));
});

test("Legacy order statuses migrate to the five tracking steps", () => {
  const legacy = [
    { id: "SA-1", customer: "A", quote: { total: 1 }, status: "Baru" },
    { id: "SA-2", customer: "B", quote: { total: 1 }, status: "Ditinjau" },
    { id: "SA-3", customer: "C", quote: { total: 1 }, status: "Selesai" },
    { id: "SA-4", customer: "D", quote: { total: 1 }, status: "Produksi" },
  ];
  const s = storage(JSON.stringify(legacy));
  assert.deepEqual(
    readOrders(s).map((o) => o.status),
    ["Diproses", "Dicek", "Diterima", "Produksi"],
  );
  assert.deepEqual(orderStatuses, [
    "Diproses",
    "Dicek",
    "Produksi",
    "Dikirim",
    "Diterima",
  ]);
});
