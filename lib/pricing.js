import { config } from "./config.js";

export function getProduct(productId) {
  const product = config.products.find((p) => p.id === productId);
  if (!product) throw new Error("Produk tidak valid.");
  return product;
}

export function getPrintSize(printSizeId) {
  if (!printSizeId) return null;
  const found = config.printSizes.find((p) => p.id === printSizeId);
  if (!found) throw new Error("Ukuran sablon tidak valid.");
  return found;
}

function normalizeSize(size) {
  if (size === "XXL") return "2XL";
  if (size === "XXXL") return "3XL";
  if (size === "XXXXL") return "4XL";
  return size;
}

export function productPrice(product, size) {
  if (product.sizes.length === 1) return product.basePrice;
  const order = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
  const normalized = normalizeSize(size);
  if (!product.sizes.includes(size) && !product.sizes.includes(normalized))
    throw new Error("Ukuran kaos tidak valid.");
  const idx = order.indexOf(normalized);
  const xlIdx = order.indexOf("XL");
  const extraSteps = idx > xlIdx ? idx - xlIdx : 0;
  return product.basePrice + extraSteps * (product.extraPerX || 0);
}

// Orientasi sablon (tambahan 28 Okt 2026, atas permintaan pemilik):
// ukuran dasar di config selalu portrait (lebar < tinggi, kecuali
// kotak), landscape hanya menukar lebar dan tinggi, HARGA TIDAK
// BERUBAH karena luasnya sama. Kotak 10x10 tidak terpengaruh.
export function orientedDimensions(printSize, orientation) {
  if (!printSize) return null;
  if (orientation === "landscape")
    return { wCm: printSize.hCm, hCm: printSize.wCm };
  return { wCm: printSize.wCm, hCm: printSize.hCm };
}

export function orientedLabel(printSize, orientation) {
  if (!printSize) return null;
  if (orientation !== "landscape" || printSize.wCm === printSize.hCm)
    return printSize.label;
  return `${printSize.hCm}×${printSize.wCm} cm (${printSize.id}, Lanskap)`;
}

function validateOrientation(orientation) {
  if (orientation !== "portrait" && orientation !== "landscape")
    throw new Error("Orientasi sablon tidak valid.");
}

export function printPrice(printSizeId) {
  const found = getPrintSize(printSizeId);
  return found ? found.price : 0;
}

// Rumus baru (Paket 1B): total per kaos = harga produk + sablon depan
// + sablon belakang. Sablon 2 sisi dijumlahkan per sisi, bukan dikali 2
// dari satu sisi yang sama. Contoh pemilik: pendek M (50.000) + depan A5
// (20.000) + belakang A3 (40.000) = 110.000 per kaos.
// quantity: jumlah kaos, 1–100, bilangan bulat.
export function calculatePrice({
  productId = "kaos-pendek",
  size,
  frontPrintId,
  backPrintId = null,
  frontOrientation = "portrait",
  backOrientation = "portrait",
  quantity = 1,
  allowNoPrint = false,
}) {
  validateOrientation(frontOrientation);
  validateOrientation(backOrientation);
  const product = getProduct(productId);
  if (!size) throw new Error("Ukuran kaos tidak valid.");
  const shirt = productPrice(product, size);
  const front = getPrintSize(frontPrintId);
  if (!front && !allowNoPrint)
    throw new Error("Ukuran sablon depan tidak valid.");
  const back = getPrintSize(backPrintId);
  if (
    !Number.isFinite(quantity) ||
    quantity < 1 ||
    quantity > 100 ||
    !Number.isInteger(quantity)
  )
    throw new Error("Jumlah kaos tidak valid.");
  const print = (front ? front.price : 0) + (back ? back.price : 0);
  const unit = shirt + print;
  return {
    productId,
    product: product.name,
    // Simpan ukuran seperti yang dipilih user (XXL tetap XXL, bukan 2XL),
    // supaya yang tampil di dashboard sama dengan yang dipilih.
    size,
    frontPrintId: front ? front.id : null,
    frontPrintLabel: front ? orientedLabel(front, frontOrientation) : null,
    front: front ? front.price : 0,
    backPrintId: back ? back.id : null,
    backPrintLabel: back ? orientedLabel(back, backOrientation) : null,
    back: back ? back.price : 0,
    shirt,
    print,
    unit,
    total: unit * quantity,
    quantity,
  };
}
