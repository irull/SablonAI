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
