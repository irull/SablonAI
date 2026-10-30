export const config = {
  demoMode: true,
  // Harga di bawah ini adalah HARGA TOKO NYATA (Paket 1B, 28 Okt 2026),
  // menggantikan model contoh lama per-cm² (Rp12/cm² + Rp3.000).
  // Jangan kembali ke per-cm² tanpa persetujuan pemilik.
  pricingIsExample: false,
  colors: [
    { name: "Putih", hex: "#f2f0e8" },
    { name: "Hitam", hex: "#292b2b" },
    { name: "Navy", hex: "#28374c" },
    { name: "Merah", hex: "#ae413a" },
    { name: "Hijau Tua", hex: "#354e40" },
    { name: "Kuning", hex: "#e7bd51" },
  ],
  // Nomor WhatsApp toko (pemilik, 28 Okt 2026) dan metode pembayaran demo:
  // manual via WhatsApp / transfer dikonfirmasi admin, bukan payment gateway.
  whatsappNumber: "6281290000520",
  paymentMethod: "whatsapp",
  // Katalog produk. Aturan ukuran: XS,S,M,L,XL = harga dasar;
  // tiap tambahan X di atas XL = +extraPerX.
  // Pendek: S–XL 50.000, 2XL 60.000, 3XL 70.000, 4XL 80.000.
  // Panjang: S–XL 60.000, 2XL 70.000, 3XL 80.000, 4XL 90.000.
  // Anak: XS–XL 40.000, XXL 45.000 (dikonfirmasi pemilik 28 Okt 2026).
  products: [
    {
      id: "kaos-pendek",
      name: "Kaos Lengan Pendek",
      basePrice: 50000,
      sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      extraPerX: 10000,
    },
    {
      id: "kaos-panjang",
      name: "Kaos Lengan Panjang",
      basePrice: 60000,
      sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      extraPerX: 10000,
    },
    {
      id: "hoodie",
      name: "Hoodie",
      basePrice: 100000,
      sizes: ["All Size"],
      extraPerX: 0,
    },
    {
      id: "totebag",
      name: "Totebag",
      basePrice: 25000,
      sizes: ["1 Ukuran"],
      extraPerX: 0,
    },
    {
      id: "kaos-anak",
      name: "Kaos Anak",
      basePrice: 40000,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      extraPerX: 5000,
    },
  ],
  // Ukuran sablon TETAP, per sisi. Ukuran ini juga menentukan masking area di DYO.
  // Keputusan pemilik 28 Okt 2026: ukuran & harga ikut daftar pertama,
  // gambar masking hanya contoh POSISI (label cm di gambar A5 14×21 dan
  // A3 28×42 diabaikan untuk ukuran; 25×10 bukan varian yang dijual).
  // Posisi: 10×10 dada kiri; 10×15 dada atas; A5/A4/A3 tengah dada vertikal.
  // Gambar contoh masking akan disalin ke public/assets/masking/ di paket
  // terpisah; sampai itu ada, jangan pakai path masking di UI.
  printSizes: [
    { id: "10x10", label: "10×10 cm", wCm: 10, hCm: 10, price: 10000, position: "dada kiri" },
    { id: "10x15", label: "10×15 cm", wCm: 10, hCm: 15, price: 15000, position: "dada atas" },
    { id: "A5", label: "15×20 cm (A5)", wCm: 15, hCm: 20, price: 20000, position: "tengah dada, vertikal" },
    { id: "A4", label: "21×28 cm (A4)", wCm: 21, hCm: 28, price: 30000, position: "tengah dada, vertikal" },
    { id: "A3", label: "32×42 cm (A3)", wCm: 32, hCm: 42, price: 40000, position: "tengah dada, vertikal" },
  ],
  // Size chart (cm) dari gambar pemilik 28 Okt 2026. Tampilkan di halaman
  // produk di paket berikutnya; di Paket 1B data ini hanya disimpan di config.
  sizeCharts: {
    dewasa: {
      note: "Toleransi 1–2 cm",
      rows: [
        { size: "S", lebar: 47, panjang: 66, lengan: 21 },
        { size: "M", lebar: 49, panjang: 70, lengan: 22 },
        { size: "L", lebar: 52, panjang: 72, lengan: 23 },
        { size: "XL", lebar: 55, panjang: 75, lengan: 24 },
        { size: "2XL", lebar: 58, panjang: 77, lengan: 24 },
        { size: "3XL", lebar: 60, panjang: 79, lengan: 26 },
        { size: "4XL", lebar: 62, panjang: 81, lengan: 26 },
      ],
    },
    anak: {
      note: "Lebar × Panjang (cm)",
      rows: [
        { size: "XS", lebar: 33, panjang: 45 },
        { size: "S", lebar: 36, panjang: 48 },
        { size: "M", lebar: 38, panjang: 51 },
        { size: "L", lebar: 41, panjang: 54 },
        { size: "XL", lebar: 43, panjang: 58 },
      ],
    },
  },
};
export const sampleBriefs = [
  {
    id: "gowes",
    title: "Gowes Pagi",
    category: "KOMUNITAS",
    brief:
      "Kaos komunitas sepeda, gambar gunung sederhana, tulisan GOWES PAGI, warna hijau tua.",
    image: "/assets/design-gowes.png",
    prompt:
      "Vintage outdoor badge, simple mountain and bicycle, forest green and warm cream, bold readable typography GOWES PAGI, isolated graphic for DTF printing.",
  },
  {
    id: "kopi",
    title: "Kopi Dulu",
    category: "USAHA LOKAL",
    brief:
      "Desain kaos kedai kopi, gambar cangkir dengan matahari, gaya retro oranye, tulisan KOPI DULU.",
    image: "/assets/design-kopi.png",
    prompt:
      "Retro coffee shop graphic, warm burnt orange cup and rising sun, bold typography KOPI DULU, isolated graphic for DTF printing.",
  },
  {
    id: "main",
    title: "Main Bareng",
    category: "GAMING",
    brief:
      "Kaos rental PlayStation, controller dan bintang, tulisan MAIN BARENG, gaya playful biru.",
    image: "/assets/design-main.png",
    prompt:
      "Playful blue gaming controller with stars, bold typography MAIN BARENG, isolated graphic for DTF printing.",
  },
];
export const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
