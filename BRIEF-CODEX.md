# BRIEF UNTUK CODEX — Website SablonAI

> Dokumen ini adalah SATU-SATUNYA brief yang dibutuhkan Codex untuk mengerjakan
> website SablonAI. Kalau ada yang bertentangan dengan dokumen lain, dokumen ini
> yang dipakai, kecuali aturan resmi hackathon (lihat bagian Aturan Hackathon).
> Bahasa kerja: Indonesia untuk penjelasan ke pemilik, kode & komentar boleh
> Indonesia/Inggris yang jelas. Pemilik BUKAN berlatar IT — jelaskan dengan
> bahasa sederhana, jangan jargon tanpa penjelasan.
>
> ## UPDATE KONSEP 27 Okt 2026 malam — e-commerce + DYO (MENGALAHKAN deskripsi lama)
>
> Konsep di bawah ini adalah versi terbaru dari pemilik, dan menggantikan
> gambaran lama yang hanya “2 tampilan”. Jangan kerjakan versi lama saja.
> Deadline masih 8–9 hari (sampai 5 Nov 09:00 WIB), pemilik optimis selesai
> tepat waktu dengan bantuan AI, dan perubahan alur masih boleh karena
> proyek belum terlalu jauh. Prioritas: demo end-to-end yang jalan, bukan
> semua fitur sekaligus — lihat urutan P0/P1 di bawah.
>
> ### Halaman utama = e-commerce
> - Card produk jadi yang bisa dipesan langsung: Kaos Lengan Pendek,
>   Kaos Lengan Panjang, Hoodie, Totebag, Kaos Anak.
> - Ada cart, login, tombol Contact Us yang langsung terhubung ke WhatsApp.
> - Alur produk jadi: lihat card → add cart → buy → form detail pembeli →
>   order masuk dashboard admin. Jalur cepat: order juga bisa diteruskan
>   ke WhatsApp (pesan berisi ringkasan order).
>
> ### Halaman DYO (Do It Yourself) = tempat berkreasi membuat mockup sablon
> - Client memilih produk, warna, ukuran kaos, lalu memilih ukuran sablon
>   (lihat harga di bawah). Ukuran sablon itu menentukan masking area di
>   mockup — kotak area cetak yang dipilih. Pemilik akan kirim gambar contoh
>   masking; sampai gambar itu datang, pakai kotak proporsional sesuai cm.
> - Client bisa generate AI, edit manual (upload/teks), atau gabungkan keduanya.
> - Setelah desain selesai: desain dikirim ke admin (dashboard), harga dihitung,
>   masuk cart, pembayaran, proses. Lihat bagian “Desain vs Mockup” di bawah.
>
> ### Limit generate AI (wajib, supaya token tidak habis)
> - Rekomendasi yang dipakai (bukan cuma localStorage, karena itu bisa diakali):
>   **Tamu: 3x generate per hari per perangkat. Setelah login (nama + nomor
>   WhatsApp): 10x generate per hari per akun.** Batas ditegakkan di server
>   (Route Handler), dengan counter sederhana per perangkat/akun. Untuk demo
>   hackathon, counter sederhana ini sudah cukup — catat di laporan bahwa
>   ini bukan sistem kuota kelas produksi yang anti-curang penuh.
> - Ide lain yang boleh dipakai sebagai pelengkap, bukan pengganti batas di atas:
>   (a) tamu hanya bisa lihat produk jadi + DYO manual tanpa AI, AI hanya setelah
>   login; (b) preview desain tamu diberi watermark / resolusi rendah, file
>   resolusi penuh hanya setelah order/login; (c) 1 generate dalam antrean
>   (tidak bisa spam banyak sekaligus), dan prompt yang sama di-cache.
> - Jangan pakai ide yang membuat demo juri macet: kalau juri harus login dan
>   tidak ada akun demo, demo gagal. Jadi sediakan akun demo / jalur tamu
>   yang jelas di video dan di halaman login.
>
> ### Cart, pembayaran, dan pelacakan (client)
> - Cart bisa berisi produk jadi DAN desain DYO (satu cart, beda jenis item).
> - Pembayaran untuk demo hackathon: **manual via WhatsApp / transfer yang
>   dikonfirmasi admin** — BUKAN payment gateway. Alasan: gateway butuh
>   akun, verifikasi, dan biaya, tidak sebanding dengan waktu 8–9 hari.
>   Status pembayaran: Menunggu Pembayaran → Dikonfirmasi Admin → lanjut produksi.
>   Kalau pemilik nanti minta gateway sungguhan, itu pekerjaan pasca-hackathon.
> - Client bisa memantau order dalam 5 langkah saja (hapus langkah yang tidak perlu):
>   **Diproses → Dicek → Produksi → Dikirim → Diterima.**
>   “Dicek” = admin memeriksa desain & pembayaran. Tidak ada langkah packing
>   terpisah, tidak ada langkah lain yang tidak perlu.
>
> ### Dashboard admin
> - Satu order harus menampilkan, dalam satu layar: nama pemesan, produk,
>   warna kaos, ukuran kaos, desain (file asli, lihat bawah), ukuran sablon
>   per sisi (depan/belakang), harga per item, total, status, dan tombol
>   ubah status + tombol WhatsApp ke customer + tombol download desain.
> - Admin memproses order lewat dashboard ini (ubah status, konfirmasi
>   pembayaran, download desain untuk dicetak).
>
> ### Desain vs Mockup — PENTING, jangan sampai tertukar
> - Yang dibutuhkan saat mencetak sablon adalah **DESAINNYA, bukan mockupnya**.
>   Backend / data order HARUS memisahkan keduanya:
>   - `designUrl` / file desain asli: PNG transparan resolusi tinggi, file yang
>     akan dicetak. Inilah yang di-download admin.
>   - `mockupUrl` / preview: foto kaos + desain yang ditempel (untuk dilihat
>     customer). Ini TIDAK boleh dipakai untuk cetak.
> - Setiap order DYO menyimpan keduanya, plus: produk, warna, ukuran kaos,
>   ukuran sablon depan, ukuran sablon belakang, dan harga.
> - Kalau desain hanya ada di mockup (sudah menyatu dengan foto kaos), itu
>   SALAH dan tidak bisa dicetak — laporkan sebagai bug, jangan dibiarkan.
>
> ### Harga nyata (27 Okt malam, menggantikan harga per cm²)
> - Produk: Kaos Lengan Pendek S,M,L,XL Rp 50.000, XXL Rp 60.000
>   (tiap tambahan X di atas XL +Rp 10.000). Kaos Lengan Panjang S,M,L,XL
>   Rp 60.000, XXL Rp 70.000 (aturan X yang sama). Hoodie All Size Rp 100.000.
>   Totebag 1 ukuran Rp 25.000. Kaos Anak: HARGA BELUM DIBERIKAN — jangan
>   dikarang, tandai TODO di `lib/config.js` dan tanyakan ke pemilik.
> - Sablon (per sisi): 10×10 cm Rp 10.000; 10×15 cm Rp 15.000;
>   15×20 cm (A5) Rp 20.000; 21×28 cm (A4) Rp 30.000; 32×42 cm (A3) Rp 40.000.
> - Total = harga produk + sablon depan + sablon belakang.
>   Contoh pemilik: kaos pendek M (50.000) + depan A5 (20.000) + belakang A3
>   (40.000) = Rp 110.000. Kalau hanya 1 sisi, sisi lainnya Rp 0.
> - Harga-harga ini sudah ada di `lib/config.js` baru. Jangan kembali ke
>   model per-cm² tanpa persetujuan pemilik.
>
> ### Urutan prioritas untuk 8–9 hari (P0 dulu, P2/P3 boleh dicoret)
> - **P0 (wajib demo):** halaman utama e-commerce + card produk, cart,
>   checkout form detail pembeli, DYO dengan masking + generate berlimit,
>   desain vs mockup terpisah, admin dashboard + ubah status, pelacakan 5 langkah,
>   tombol WhatsApp, harga baru yang benar.
> - **P1 (penting, kerjakan setelah P0 jalan):** login sederhana (nama + nomor
>   WhatsApp, untuk limit generate & pelacakan), sablon 2 sisi, produk jadi
>   langsung pesan tanpa DYO.
> - **P2 (kalau sempat):** konfirmasi pembayaran admin, akun demo untuk juri.
> - **P3 / DICORET kalau P0 belum jalan:** 3D, Muse Wonder, payment gateway,
>   login password/OTP yang rumit, database permanen yang kompleks.
>
> ### Update data 28 Okt 2026 — masking, size chart, harga anak, WhatsApp, pembayaran
> - Gambar contoh masking DITERIMA 28 Okt (disimpan di
>   `public/assets/masking/`): A5, A4, A3, 10×10, 25×10. Posisi dari gambar:
>   10×10 = dada kiri kecil; 25×10 = dada atas horizontal tengah;
>   A5/A4/A3 = tengah dada vertikal, makin besar makin luas.
> - Size chart DITERIMA 28 Okt (`public/assets/size-chart/`): dewasa
>   S–4XL (Lebar 47–62, Panjang 66–81, Lengan 21–26, toleransi 1–2 cm);
>   anak XS–XL (Lebar 33–43, Panjang 45–58). Tampilkan tabel ini di halaman produk.
> - Harga Kaos Anak DITERIMA: XS,S,M,L,XL Rp 40.000 + Rp 5.000 per kelipatan X.
>   Penafsiran di `lib/config.js`: XS–XL = 40.000, tiap X di atas XL +5.000.
>   Kalau maksud pemilik berbeda, koreksi config, jangan diam-diam pakai tafsir lain.
> - Nomor WhatsApp toko DITERIMA: 6281290000520. Pembayaran via WhatsApp
>   DISETUJUI pemilik — manual/transfer dikonfirmasi admin, bukan payment gateway.
> - KONFIRMASI UKURAN 28 Okt 2026 — SUDAH DISELESAIKAN, tidak lagi menunggu:
>   Pemilik: “1,2,3 ikut ukuran pertama, dengan contoh masking seperti gambar.”
>   Artinya ukuran & harga ikut daftar pertama, gambar hanya contoh posisi.
>   Final: 10×10 Rp 10.000, 10×15 Rp 15.000, A5 15×20 Rp 20.000,
>   A4 21×28 Rp 30.000, A3 32×42 Rp 40.000. Label cm di file gambar masking
>   (A5 14×21, A3 28×42) DIABAIKAN untuk ukuran. File 25×10 BUKAN varian
>   yang dijual — hanya referensi posisi dada atas untuk 10×15.
> - Harga Kaos Anak DIKONFIRMASI 28 Okt 2026: “betul XXL jadi 45rb.”
>   Final: XS–XL Rp 40.000, XXL Rp 45.000.
>
> ### Yang masih menunggu pemilik (jangan dikarang, jangan diblokir total)
> - Tidak ada lagi untuk ukuran & harga di atas — semua sudah final di
>   `lib/config.js`. Yang tersisa hanya aset/fitur lain di luar bagian ini.

## 1. Siapa pemilik & masalahnya (baca dulu, ini yang dinilai juri)

- Pemilik: pengusaha sablon DTF di Indonesia + rental PlayStation. Ahli di
  produksi sablon (persiapan artwork, color separation, hitung biaya dari luas
  cetak), bukan di coding. Ia yang mengarahkan proyek ini dan memegang hak atas
  semua komponennya.
- Masalah nyata dari tokonya: kebanyakan customer datang TANPA desain siap cetak
  — cuma bawa ide lisan, foto buram, atau logo low-res. Desainer kewalahan revisi
  bolak-balik, customer tidak bisa membayangkan hasil akhir di kaos.
- Solusi: SablonAI, web app mobile-friendly berbahasa Indonesia. Customer cerita
  ide lewat chat → AI buatkan desain → desain ditempel realistis di mockup kaos
  → harga dihitung langsung dari luas cetak → order masuk ke dashboard pemilik.
- Tema hackathon: **Build for Your World** (bawa model Meta ke bidang yang
  dikuasai pemilik). Track: **indie, solo**.

## 2. Apa yang harus dibangun (fitur wajib, tidak boleh dikurangi)

1. **AI Generate (tampilan 1)**
   - Input: chat brief bebas dari customer (contoh: “Kaos komunitas sepeda,
     gambar gunung sederhana, tulisan ‘GOWES PAGI’, warna hijau tua”).
   - Alur: brief → Muse Spark (merapikan brief jadi prompt desain) →
     Muse Image (membuat gambar desain) → gambar tampil di mockup.
   - Harus bisa dites dengan minimal 3 brief berbeda.
2. **Custom Editor (tampilan 2)**
   - Upload desain sendiri (gambar), tambah teks, geser, perbesar, putar, hapus objek.
   - Tombol hapus background → SAM 3.1 → hasil cut-out masuk ke mockup.
   - Library: fabric.js, canvas 2D.
3. **Mockup realistis (inti, bukan tempelan)**
   - Desain harus MENYATU dengan kain, mengikuti lipatan kain (gaya demo Lumise),
     bukan seperti stiker ditempel. Teknik: displacement map dari foto mockup
     itu sendiri + blending Multiply/Overlay.
   - Foto dasar: HANYA 1 foto kaos putih polos, tampak depan, rata, terang merata,
     resolusi tinggi, di `public/assets/mockup-kaos-putih.jpg`, plus mask-nya
     `public/assets/mockup-kaos-mask.png`.
   - Warna kaos: preset picker sesuai stok toko (Putih, Hitam, Navy, Merah,
     Hijau Tua, Kuning — bisa diubah di `lib/config.js`). Warna diganti dari app,
     BUKAN dengan foto banyak warna. Warna di layar adalah preview, bukan patokan
     100% kain asli — tulis keterangan ini di UI.
4. **Kalkulator harga instan — LIHAT UPDATE KONSEP di atas, model per-cm² SUDAH TIDAK BERLAKU**
   - Rumus baru: harga produk + sablon depan + sablon belakang, dengan tabel
     harga tetap di bagian Update Konsep dan di `lib/config.js`.
   - Harga berubah langsung saat produk/ukuran/ukuran sablon diubah.
5. **Dashboard Order (pemilik) — LIHAT UPDATE KONSEP di atas**
   - Daftar order + detail lengkap per order + ubah status 5 langkah +
     download DESAIN ASLI (bukan mockup) + tombol WhatsApp.
   - Versi awal boleh simpan lokal (localStorage) untuk demo. Penyimpanan permanen
     (database) hanya kalau sempat TANPA mengorbankan demo end-to-end.
6. **Biaya API per order (nilai tambah, bukan wajib mutlak)**
   - Kalau sempat, tampilkan perkiraan biaya API per order (acuan lama:
     sekitar Rp 300–500, Muse Image $0,01/gambar, SAM 3.1 sekitar Rp 40–50/gambar).
     Jangan jadikan angka ini patokan final tanpa cek Billing.

## 3. Stack & deploy (sudah diputuskan, jangan diubah tanpa persetujuan pemilik)

- **Framework: Next.js App Router + React, JavaScript (bukan TypeScript).**
  Alasan: deploy Vercel paling mulus, API route menyatu dengan frontend.
- **UI — DIPUTUSKAN pemilik 28 Okt 2026: Headless UI + Tailwind CSS, ditambahkan di Stage 1.**
  Headless UI (https://headlessui.com/) adalah komponen React tanpa gaya visual
  dari pembuat Tailwind, dengan aksesibilitas bawaan (keyboard, fokus, ARIA).
  Headless UI SAJA tidak membuat tampilan seragam — seragam didapat dari
  komponen yang sama + token desain yang sama di bawah ini. Jangan instal
  Headless UI tanpa Tailwind / tanpa token, karena hasilnya akan tetap acak.
  - Instalasi (Codex SESUAIKAN dengan versi proyeknya sendiri, jangan asal salin):
    `npm install @headlessui/react`, plus Tailwind + PostCSS + Autoprefixer
    sesuai versi Next.js/React di proyek itu, lalu konfigurasi Tailwind
    (content mencakup app/ dan components/) dan migrasi `globals.css` ke
    Tailwind. Cek peer dependencies Headless UI terhadap React di proyek
    (kerangka di sini Next 14 / React 18; proyek Codex di laptop dilaporkan
    Next 16 / React 19 — versinya boleh beda, yang penting `npm run build` lolos).
  - Semua komponen Headless UI adalah client component — pakai hanya di file
    `"use client"`, jangan di server component (aturan yang sama seperti fabric.js).
  - Token desain yang harus dipakai di SEMUA halaman (jangan tiap halaman
    mengarang warna/radius sendiri): 1 warna utama toko yang konsisten untuk
    tombol utama, 1 warna sekunder untuk tombol biasa, radius yang sama untuk
    tombol/kartu/input, jarak dan ukuran teks yang sama untuk judul, label,
    dan harga. Tulis token ini di konfigurasi Tailwind / CSS bersama, dan
    jangan hardcode warna berbeda di tiap halaman.
  - Komponen bersama yang wajib dibuat di `components/ui/` (atau setara) dan
    dipakai ulang, bukan dibuat ulang per halaman: Button, Card, Input, Badge
    (status order), Price (format Rp yang sama).
  - Pemetaan Headless UI ke SablonAI (wajib, jangan buat dropdown/modal kustom
    baru kalau Headless UI sudah menyediakannya):
    - RadioGroup → pilih warna kaos, ukuran kaos, ukuran sablon
    - Listbox → pilih/filter (mis. filter status order di dashboard admin)
    - Dialog → cart (drawer/modal), form checkout, detail order, login, preview desain
    - Disclosure → menu HP, accordion size chart
    - Switch → sablon 1 sisi / 2 sisi
    - Tabs → navigasi utama (Beranda / DYO / Cart / Dashboard / Lacak)
  - TIDAK pakai Headless UI untuk: editor fabric.js dan mockup displacement —
    itu tetap kustom.
  - Kriteria selesai Stage 1 untuk UI: build lolos, semua halaman memakai
    komponen bersama di atas, tidak ada dua gaya tombol/kartu yang berbeda,
    dan dialog/menu bisa dipakai dengan keyboard di HP maupun laptop.
- **Deploy: Vercel saja untuk demo utama.** Repo GitHub harus PUBLIK saat submit.
  GitHub Pages TIDAK dipakai sebagai demo utama (Pages tidak bisa menjalankan
  API route, dan dua link demo membingungkan juri). Pages hanya cadangan.
- **Backend API: Route Handler Next.js di `app/api/meta/route.js`.**
  Frontend TIDAK PERNAH memanggil api.meta.ai langsung, TIDAK PERNAH menyimpan
  API key. Key hanya dari environment variable Vercel (`META_API_KEY`).
- **JANGAN pakai sebagai jalur produk:** 9Router lokal (localhost, tidak bisa
  diakses Vercel, dan jalur OpenAI-compatible-nya belum tentu mendukung
  Muse Image & SAM 3.1) dan Hermes lokal (bukan backend web, status instalasi
  belum pasti). Test chat via 9Router+Hermes yang sudah dilakukan pemilik
  itu bukti chat jalan saja, bukan arsitektur produk.
- **Struktur yang sudah ada (kerangka, lanjutkan dari sini, jangan tulis ulang
  dari nol kalau folder ini sudah ada):**
  ```
  app/layout.js, app/page.js, app/globals.css
  app/api/meta/route.js
  components/SablonApp.js, components/EditorCanvas.js
  lib/config.js, lib/api.js
  public/assets/
  package.json, next.config.js, .env.example, .gitignore
  README.md, STAGES.md, BRIEF-CODEX.md, PROMPT-CODEX.md
  ```
- **Jebakan Next.js yang WAJIB dihindari:**
  - fabric.js / canvas / window / localStorage HANYA di client component.
  - `EditorCanvas.js` sudah benar: `"use client"` + import fabric dinamis
    di `useEffect` + simpan modul di ref. Jangan pernah import fabric di
    server component atau di level atas halaman — build akan gagal.
  - Setiap komponen baru yang pakai browser API harus client component juga.

## 4. Model Meta yang dipakai

- **Muse Spark** — chat, merapikan brief jadi prompt. Chat ringan tetap di Spark.
- **Muse Image** — membuat gambar desain. $0,01/gambar (acuan lama).
- **SAM 3.1** — hapus background / segmentasi.
- **Muse Wonder (opsional, hati-hati biaya)** — hanya kalau sempat dan hanya
  untuk pelanggan yang kembali (Active Memory / preferensi pelanggan).
  Wonder standar via Meta Model API, harga premium ($4/$20 per juta token
  input/output, acuan lama). Jangan pakai Wonder untuk chat ringan.
- **Kredit:** $150 Meta Model API sudah aktif di Billing (akun pemilik).
  Sebelum test besar, pastikan Spend Limit notification sudah disetel pemilik.
  Test kecil dulu: 1x Spark, 1x Image, 1x SAM, catat biaya & waktu.

## 5. API — aturan keras (jangan ditebak)

- **JANGAN menebak endpoint, nama model, atau format request/response Meta.**
  Di kerangka, `app/api/meta/route.js` sengaja masih TODO. Isi dari dokumentasi
  resmi Meta Model API saat Stage 2, test dengan panggilan kecil, baru kunci.
  Kalau dokumentasi tidak bisa diakses / format tidak jelas, LAPORKAN ke pemilik
  dan pakai mode demo + desain pre-render untuk UI — jangan mengarang format
  lalu mengklaim API sudah jalan.
- Base URL acuan lama: `https://api.meta.ai/v1` — konfirmasi ulang dari docs.
- API key: dari `process.env.META_API_KEY` di server saja. Jangan pernah tulis
  kunci di kode, di `.env` yang ikut commit, di chat, atau di repo publik.
  `.env.example` hanya contoh nama variabel, tanpa nilai.

## 6. Tahapan kerja (STAGES.md, kerjakan BERURUTAN, satu stage selesai baru lanjut)

Stage lengkap ada di `STAGES.md`. Ringkasnya:

- **Stage 0 — Fondasi & Pengaman (27 Okt):** Spend Limit, repo baru, hubungkan
  Vercel, `npm install` + `npm run dev` + `npm run build` lolos, test kecil
  1x Spark/Image/SAM, kumpulkan foto mockup, tabel harga, 5–10 brief nyata,
  pilih 1 “bintang demo” (order nyata, teks/logo jelas).
- **Stage 1 — Shell UI + Mockup 2D + Warna (27–28 Okt):** foto kaos putih jadi
  mockup utama, picker warna jalan, layout HP tidak rusak.
- **Stage 2 — AI Generate: Spark → Image (28–30 Okt):** isi Route Handler,
  matikan `demoMode` hanya setelah 3 brief berbeda jalan stabil di HP & laptop.
- **Stage 3 — Custom Editor + SAM 3.1 (30 Okt–1 Nov):** fabric penuh +
  hapus background + displacement lipatan + blending.
- **Stage 4 — Kalkulator Harga + Dashboard (1–2 Nov):** harga nyata dari tabel
  toko, order bintang demo muncul di dashboard.
- **Stage 5 — BONUS 3D, gerbang go/no-go (2–3 Nov):** HANYA kalau Stage 1–4
  selesai DAN demo end-to-end sudah bisa direkam. Kalau tidak lolos, BATALKAN
  Stage 5 dan alihkan waktu ke Stage 6. Target 3D minimal: putar depan–belakang–
  samping + ganti warna (referensi: VirtualThreads pakai Verge3D + glTF;
  jalur gratis: Three.js + model glTF, juga client component). Kalau model melar
  atau HP lag, batalkan 3D, kembali ke 2D.
- **Stage 6 — Demo, Deploy & Submit (3–5 Nov):** repo PUBLIK, README lengkap,
  deploy Vercel dicek dari HP orang lain, video demo 3 menit (5 shot, buka &
  tutup dengan angka toko nyata), submit paling lambat **5 Nov 2026 09:00 WIB**
  (repo publik + video + kontributor). Jangan submit di menit terakhir.

## 7. Rubrik juri (ini yang dinilai, kerjakan untuk ini, bukan untuk keren-kerenan)

Skor 0–10 per kriteria, rubrik sama di Stage 2 & final:

- **Impact 30%** — potensi dunia nyata, siapa yang diuntungkan, cocok dengan
  problem statement. Bukti: demo dibuka & ditutup angka toko nyata, order nyata.
- **Use of Meta AI tooling 25%** — pemakaian kreatif, bukan integrasi dasar.
  Bukti: rantai Spark → Image → SAM terlihat jelas, bukan sekadar satu panggilan.
- **Technical depth 20%** — engineering rapi & matang. Bukti: proxy aman,
  displacement rapi, kalkulator benar, komponen Next.js rapi, build lolos.
- **Demo 25%** — demo jalan & video layak tonton. Bukti: alur end-to-end tanpa
  putus, link Vercel bisa diklik juri, fallback pre-render kalau API lambat.

## 8. Aturan hackathon & keamanan

- Demo hanya boleh menampilkan karya yang dibangun SELAMA hackathon
  (27 Okt–5 Nov), kecuali aset persiapan (foto mockup, tabel harga).
  Jangan pakai / klaim karya sebelum 27 Okt sebagai bagian demo.
- Bantuan AI/agent diperbolehkan menurut waiver yang dikutip panduan peserta,
  dan Muse Code adalah alat resmi event, ASALKAN komponen tetap karya pemilik
  dan pemilik memegang haknya. Aturan resmi (Official Rules) tetap di atas
  waiver — kalau ada yang bertentangan, ikuti Official Rules dan laporkan.
- Jangan commit `.env`, `node_modules/`, `.next/`, atau kunci apa pun.
  Jangan ubah visibilitas repo lain, jangan hapus repo, jangan ubah kode
  di luar proyek SablonAI ini.
- Jangan pernah minta password / kunci API ke pemilik lewat chat. Kunci
  dimasukkan pemilik sendiri di Vercel Environment Variables / `.env.local`.

## 9. Cara kerja Codex yang diminta pemilik

- Kerjakan **satu stage per satu**, mulai dari Stage 0. Setelah tiap stage,
  jalankan `npm run build` (dan `npm run dev` untuk cek manual) dan laporkan:
  apa yang selesai, apa yang dites, apa yang masih placeholder, dan apa yang
  butuh dari pemilik (foto, tabel harga, bintang demo, kunci di Vercel).
- Jangan menambah fitur di luar brief tanpa persetujuan pemilik, terutama
  fitur yang bisa merusak demo end-to-end.
- Jangan mengubah demo yang sudah jalan demi polish. Kalau ada yang rusak,
  perbaiki dulu sebelum nambah fitur baru.
- Setiap commit: pesan commit jelas per stage (contoh: `stage-1: mockup 2D + picker warna`).
- Kalau mentok (docs Meta tidak jelas, build gagal berulang, API error),
  jangan diam-diam menebak atau mengulang cara yang sama berkali-kali.
  Tuliskan error persisnya, apa yang sudah dicoba, dan apa yang dibutuhkan
  dari pemilik — lalu berhenti di titik itu sampai ada arahan.
- Jelaskan ke pemilik dengan bahasa sederhana, dalam Bahasa Indonesia.
  Jangan kirim laporan penuh istilah teknis tanpa arti.

## 10. Aset yang masih placeholder (jangan dikarang)

- Foto mockup & mask di `public/assets/` — dari toko, belum ada di kerangka.
- Angka harga di `lib/config.js` — dari tabel harga toko, Stage 4.
- Endpoint & nama model persis di `app/api/meta/route.js` — dari docs Meta, Stage 2/3.
- Bintang demo — 1 order nyata pilihan pemilik, Stage 0.
- Kalau aset ini belum ada saat Codex bekerja, pakai placeholder yang JELAS
  dilabeli “contoh/demo, bukan data toko”, dan catat di laporan stage.

## 11. Checklist penerimaan akhir (sebelum Codex menyatakan selesai)

- [ ] `npm run build` lolos, tanpa error fabric/SSR.
- [ ] Dibuka di HP: tab, warna, mockup, editor, harga, order semua jalan.
- [ ] 3 brief berbeda menghasilkan desain di mockup (atau, kalau API belum
      tersambung, mode demo + desain pre-render berjalan dan dilabeli jelas).
- [ ] Upload → hapus background → tempel di mockup kelihatan menyatu dengan kain.
- [ ] Harga bintang demo benar & ordernya muncul di dashboard.
- [ ] Repo bersih: tidak ada kunci, tidak ada `.env` asli, README lengkap.
- [ ] Link Vercel bisa dibuka dari HP orang lain.
- [ ] Video demo 3 menit sudah direkam / siap direkam dari alur yang sama.
