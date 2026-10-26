import test from "node:test";
import assert from "node:assert/strict";
import { calculatePrice } from "../lib/pricing.js";
import { readOrders, writeOrders, ORDER_STORAGE_KEY } from "../lib/orders.js";
test("Known example: L, 24x30 cm, two shirts", () => {
  assert.deepEqual(
    calculatePrice({ size: "L", width: 24, height: 30, quantity: 2 }),
    {
      area: 720,
      shirt: 38000,
      print: 8640,
      extra: 3000,
      unit: 49640,
      total: 99280,
      quantity: 2,
    },
  );
});
test("Decimal print area rounds the cost, not the quantity", () => {
  const p = calculatePrice({
    size: "S",
    width: 10.5,
    height: 12.5,
    quantity: 3,
  });
  assert.equal(p.area, 131.25);
  assert.equal(p.print, 1575);
  assert.equal(p.total, 118725);
});
test("All sizes and boundary dimensions stay valid", () => {
  for (const size of ["S", "M", "L", "XL", "XXL"])
    for (const width of [1, 32])
      for (const height of [1, 45])
        assert.ok(
          calculatePrice({ size, width, height, quantity: 100 }).total > 0,
        );
});
test("Reject invalid sizes, dimensions and quantities", () => {
  for (const changes of [
    { size: "XXXL" },
    { width: NaN },
    { height: Infinity },
    { width: 0 },
    { height: 46 },
    { quantity: 0 },
    { quantity: 1.5 },
    { quantity: 101 },
  ])
    assert.throws(() =>
      calculatePrice({
        size: "L",
        width: 24,
        height: 30,
        quantity: 1,
        ...changes,
      }),
    );
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
    quote: { total: 49640 },
    status: "Baru",
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
