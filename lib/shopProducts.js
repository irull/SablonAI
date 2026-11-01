// Produk jadi (ready stock) dari folder public/products — mockup PNG
// transparan depan+belakang dari pemilik (Nov 2026) + harga dari
// "Note price.txt" beliau. Harga di note untuk design5/design6 tertulis
// 11000/12000 — dibaca 110.000/120.000 (nolnya kurang satu; terbukti pas
// dengan mesin harga: 50.000 kaos + sablon A5+A3 = 110.000, A4+A3 =
// 120.000). frontPrintId/backPrintId dipilih supaya total keranjang yang
// dihitung calculatePrice SAMA PERSIS dengan harga kartu.
export const SHOP_PRODUCTS = [
  { id: "design1", name: "Wortel Balap", meta: "Kaos hitam · sablon depan besar", price: 90000, image: "/products/design1.png", colorName: "Hitam", frontPrintId: "A3", backPrintId: null },
  { id: "design2", name: "Nemuraa Entertainment", meta: "Kaos abu tua · logo dada", price: 70000, image: "/products/design2.png", colorName: "Hitam", frontPrintId: "A5", backPrintId: null },
  { id: "design3", name: "Brainwash", meta: "Kaos putih · sablon belakang besar", price: 90000, image: "/products/design3.png", colorName: "Putih", frontPrintId: null, backPrintId: "A3" },
  { id: "design4", name: "Terlanjur Basah", meta: "Kaos tosca · sablon belakang", price: 90000, image: "/products/design4.png", colorName: "Hijau Tua", frontPrintId: null, backPrintId: "A3" },
  { id: "design5", name: "Sabila Sayur", meta: "Kaos hitam · depan + belakang", price: 110000, image: "/products/design5.png", colorName: "Hitam", frontPrintId: "A5", backPrintId: "A3" },
  { id: "design6", name: "Baby Painter", meta: "Kaos ungu · foto depan + belakang", price: 120000, image: "/products/design6.png", colorName: "Putih", frontPrintId: "A4", backPrintId: "A3" },
  { id: "design7", name: "Denjaka 999", meta: "Kaos hitam · depan + belakang", price: 80000, image: "/products/design7.png", colorName: "Hitam", frontPrintId: "10x15", backPrintId: "10x15" },
  { id: "design8", name: "Kucing Meme", meta: "Kaos putih · foto depan besar", price: 90000, image: "/products/design8.png", colorName: "Putih", frontPrintId: "A3", backPrintId: null },
];
