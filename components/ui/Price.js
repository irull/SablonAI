"use client";
import { formatRupiah as rp } from "../../lib/config";

// Komponen harga seragam (Stage 1 draft, VM only).
// Satu-satunya tempat format Rp dipakai di UI baru, supaya tidak ada
// format harga yang berbeda-beda antar halaman.
export default function Price({ value, className = "" }) {
  return <strong className={className}>{rp(value)}</strong>;
}
