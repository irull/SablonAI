// Keranjang belanja (Nov 2026): menampung item dari Koleksi kaos dan
// dari Studio DIY sebelum diubah menjadi order beneran di checkout.
// Item menyimpan konfigurasi lengkap (produk, ukuran, warna, sablon
// per sisi, artwork) supaya harga selalu dihitung ulang dari
// calculatePrice — tidak ada total basi yang tersimpan.
export const CART_STORAGE_KEY = "sablonai.cart.v1";

export function readCart(storage) {
  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => i && typeof i.id === "string" && typeof i.productId === "string",
    );
  } catch {
    return [];
  }
}

export function writeCart(storage, items) {
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Keranjang penuh/gagal simpan tidak boleh menjatuhkan halaman;
    // item tetap tampil selama sesi ini berjalan.
  }
}

export function newCartItemId() {
  return "CART-" + crypto.randomUUID().slice(0, 8).toUpperCase();
}
