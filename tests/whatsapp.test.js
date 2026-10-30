import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppOrderLink } from "../lib/whatsapp.js";

test("WhatsApp fast-track link carries the order summary to the shop number", () => {
  const link = buildWhatsAppOrderLink({
    id: "SA-TEST1",
    customer: "Pelanggan Demo",
    product: "Kaos Lengan Pendek",
    size: "M",
    color: { name: "Putih" },
    quantity: 2,
    quote: {
      total: 220000,
      frontPrintLabel: "15x20 cm (A5)",
      backPrintLabel: "32x42 cm (A3)",
    },
  });
  assert.ok(link.startsWith("https://wa.me/6281290000520?text="));
  const text = decodeURIComponent(link.split("?text=")[1]);
  assert.match(text, /SA-TEST1/);
  assert.match(text, /Pelanggan Demo/);
  assert.match(text, /220\.000/);
  assert.match(text, /Sablon belakang: 32x42 cm \(A3\)/);
});

test("WhatsApp link stays valid for a minimal one-sided order", () => {
  const link = buildWhatsAppOrderLink({
    id: "SA-TEST2",
    customer: "A",
    product: "Totebag",
    size: "1 Ukuran",
    quote: { total: 55000, frontPrintLabel: "21x28 cm (A4)", backPrintLabel: null },
  });
  const text = decodeURIComponent(link.split("?text=")[1]);
  assert.match(text, /Sablon belakang: tanpa sablon/);
  assert.match(text, /Jumlah: 1 pcs/);
});
