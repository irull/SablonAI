"use client";

// Badge status order (Stage 1 draft, VM only).
// Warna mengikuti token yang sudah ada; status 5 langkah baru
// (Diproses/Dicek/Produksi/Dikirim/Diterima) ditambahkan saat
// paket tracking berjalan, bukan di Stage 1 ini.
const tones = {
  Baru: "bg-soft text-olive-dark",
  Ditinjau: "bg-soft text-olive-dark",
  Produksi: "bg-soft text-olive-dark",
  Selesai: "bg-olive text-white",
};
export default function Badge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status] || "bg-soft text-ink"} ${className}`}
    >
      {status}
    </span>
  );
}
