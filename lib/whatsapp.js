import { config, formatRupiah as rp } from "./config.js";

// Jalur cepat WhatsApp (konsep pemilik 2026-10-27): ringkasan order
// terkirim ke nomor toko sebagai pesan yang sudah terisi otomatis.
// Pembayaran manual via WhatsApp / transfer, dikonfirmasi admin —
// bukan payment gateway.
export function buildWhatsAppOrderLink(order) {
  const lines = [
    "Halo, saya mau pesan sablon (SablonAI).",
    "Order: " + order.id,
    "Nama: " + order.customer,
    "Produk: " + (order.product || "Kaos") + " ukuran " + order.size,
  ];
  if (order.color && order.color.name)
    lines.push("Warna: " + order.color.name);
  if (order.quote) {
    if (order.quote.frontPrintLabel)
      lines.push("Sablon depan: " + order.quote.frontPrintLabel);
    lines.push(
      "Sablon belakang: " + (order.quote.backPrintLabel || "tanpa sablon"),
    );
    lines.push("Jumlah: " + (order.quantity || 1) + " pcs");
    lines.push("Total: " + rp(order.quote.total));
  }
  lines.push("Terima kasih.");
  return (
    "https://wa.me/" +
    config.whatsappNumber +
    "?text=" +
    encodeURIComponent(lines.join("\n"))
  );
}

// Normalisasi nomor Indonesia ke format internasional untuk wa.me:
// 0812... / 812... / +62 812... semuanya menjadi 62812...
export function normalizePhoneId(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

export function isValidPhoneId(raw) {
  return /^62\d{8,13}$/.test(normalizePhoneId(raw));
}

// Tautan untuk admin menghubungi pelanggan dari dashboard order,
// dengan status order terkini sebagai pesan terisi otomatis.
export function buildWhatsAppCustomerLink(order) {
  const lines = [
    "Halo " + order.customer + ", ini dari toko sablon (SablonAI).",
    "Order kamu " + order.id + " statusnya: " + order.status + ".",
  ];
  if (order.quote) lines.push("Total: " + rp(order.quote.total) + ".");
  lines.push("Terima kasih sudah pesan.");
  return (
    "https://wa.me/" +
    normalizePhoneId(order.phone) +
    "?text=" +
    encodeURIComponent(lines.join("\n"))
  );
}
