import { config } from "./config.js";
import { calculatePrice } from "./pricing.js";
import { isValidPhoneId, normalizePhoneId } from "./whatsapp.js";

export const ORDER_STORAGE_KEY = "sablonai.orders.v1";
// Status pelacakan order (disepakati pemilik 2026-10-27): lima langkah
// yang dilihat pelanggan, dari proses sampai diterima.
export const orderStatuses = [
  "Diproses",
  "Dicek",
  "Produksi",
  "Dikirim",
  "Diterima",
];
// Status lama (sebelum 2026-10-31) dipetakan ke langkah baru supaya
// order lama yang tersimpan di browser tetap terbaca, bukan ditolak.
export const legacyStatusMap = {
  Baru: "Diproses",
  Ditinjau: "Dicek",
  Produksi: "Produksi",
  Selesai: "Diterima",
};
export function normalizeOrderStatus(status) {
  return legacyStatusMap[status] || status;
}
export function readOrders(storage) {
  const raw = storage.getItem(ORDER_STORAGE_KEY);
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "Data order di browser tidak terbaca. Cadangkan data browser sebelum memperbaikinya.",
    );
  }
  if (!Array.isArray(parsed))
    throw new Error(
      "Format order di browser tidak sesuai. Data lama tidak ditimpa.",
    );
  const orders = parsed.map((o) =>
    o && typeof o.status === "string"
      ? { ...o, status: normalizeOrderStatus(o.status) }
      : o,
  );
  if (
    orders.some(
      (o) =>
        !o ||
        typeof o.id !== "string" ||
        typeof o.customer !== "string" ||
        !o.quote ||
        !Number.isFinite(o.quote.total) ||
        !orderStatuses.includes(o.status),
    )
  )
    throw new Error(
      "Format order di browser tidak sesuai. Data lama tidak ditimpa.",
    );
  return orders;
}
export function writeOrders(storage, orders) {
  try {
    storage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    throw new Error(
      "Penyimpanan browser penuh atau tidak diizinkan. Order belum tersimpan. Unduh cadangan order dari dashboard.",
    );
  }
}
export function downloadJSON(data, name) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function artworkDataURL(src) {
  if (src.startsWith("data:image/")) return src;
  if (!src.startsWith("/assets/"))
    throw new Error("Sumber artwork tidak valid.");
  const image = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("Artwork tidak dapat disimpan."));
    im.src = src;
  });
  const c = document.createElement("canvas");
  c.width = image.width;
  c.height = image.height;
  c.getContext("2d").drawImage(image, 0, 0);
  return c.toDataURL("image/png");
}

// ID order: SA-YYMMDD-XXXXXX (tanggal Asia/Jakarta), pola yang sama
// dengan order studio.
export function newOrderId() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");
  return "SA-" + date + "-" + crypto.randomUUID().slice(0, 6).toUpperCase();
}

// Order produk siap pakai dari Katalog (Stage 4): tanpa sablon dan tanpa
// artwork. Bentuknya sama dengan order studio supaya dashboard dan
// tautan WhatsApp bekerja tanpa cabang khusus.
export function buildReadyOrder({ customer, phone, productId, size, color, quantity }) {
  const name = String(customer || "").trim();
  if (!name) throw new Error("Nama pemesan wajib diisi.");
  if (!isValidPhoneId(phone)) throw new Error("Nomor WhatsApp tidak valid.");
  const quote = calculatePrice({
    productId,
    size,
    frontPrintId: null,
    backPrintId: null,
    quantity,
    allowNoPrint: true,
  });
  return {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    status: "Diproses",
    customer: name,
    phone: normalizePhoneId(phone),
    source: "katalog",
    product: quote.product,
    productId,
    size: quote.size,
    color,
    quantity: quote.quantity,
    frontPrintId: null,
    backPrintId: null,
    frontOrientation: "portrait",
    backOrientation: "portrait",
    quote,
    design: { title: quote.product, brief: "", prompt: "", demo: true, trace: null },
    preview: "",
    artwork: null,
    editorJSON: null,
    pricingIsExample: config.pricingIsExample,
  };
}

// Lacak order untuk pelanggan: cocokkan nomor order (tidak peka huruf
// besar/kecil) DAN nomor WhatsApp yang dipakai saat pesan.
export function findTrackedOrder(orders, id, phone) {
  const wanted = String(id || "").trim().toUpperCase();
  if (!wanted) return null;
  const normalized = normalizePhoneId(phone);
  if (!/^62\d{8,13}$/.test(normalized)) return null;
  return (
    orders.find(
      (o) =>
        o.id.toUpperCase() === wanted &&
        o.phone &&
        normalizePhoneId(o.phone) === normalized,
    ) || null
  );
}

export function trackingStepIndex(order) {
  return orderStatuses.indexOf(order.status);
}
