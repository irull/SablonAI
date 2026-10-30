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
