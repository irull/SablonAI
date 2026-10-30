import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReadyOrder,
  findTrackedOrder,
  trackingStepIndex,
} from "../lib/orders.js";

const color = { name: "Putih", hex: "#f2f0e8" };
const order = buildReadyOrder({
  customer: "Bima",
  phone: "0812 3456 7890",
  productId: "kaos-pendek",
  size: "M",
  color,
  quantity: 1,
});
const orders = [order];

test("Tracking finds the order by id and phone in any format", () => {
  assert.equal(findTrackedOrder(orders, order.id.toLowerCase(), "+62 812-3456-7890"), order);
  assert.equal(findTrackedOrder(orders, "  " + order.id + " ", "081234567890"), order);
});

test("Tracking rejects a wrong phone or unknown id", () => {
  assert.equal(findTrackedOrder(orders, order.id, "089999999999"), null);
  assert.equal(findTrackedOrder(orders, "SA-000000-XXXXXX", "081234567890"), null);
  assert.equal(findTrackedOrder(orders, "", ""), null);
});

test("Tracking step index follows the five statuses", () => {
  assert.equal(trackingStepIndex({ status: "Diproses" }), 0);
  assert.equal(trackingStepIndex({ status: "Produksi" }), 2);
  assert.equal(trackingStepIndex({ status: "Diterima" }), 4);
});
