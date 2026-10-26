# BRIEF UNTUK CODEX — Website SablonAI

> Dokumen ini adalah SATU-SATUNYA brief yang dibutuhkan Codex untuk mengerjakan
> website SablonAI. Kalau ada yang bertentangan dengan dokumen lain, dokumen ini
> yang dipakai, kecuali aturan resmi hackathon (lihat bagian Aturan Hackathon).
> Bahasa kerja: Indonesia untuk penjelasan ke pemilik, kode & komentar boleh
> Indonesia/Inggris yang jelas. Pemilik BUKAN berlatar IT — jelaskan dengan
> bahasa sederhana, jangan jargon tanpa penjelasan.

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
4. **Kalkulator harga instan**
   - Rumus: harga kaos per ukuran + (lebar cm × tinggi cm × harga cetak per cm²)
     + biaya tambahan. Harga berubah langsung saat ukuran/ukuran cetak diubah.
   - Angka di kerangka masih PLACEHOLDER — jangan dikarang jadi harga final.
     Minta tabel harga nyata ke pemilik di Stage 4, atau pakai placeholder dengan
     label jelas “contoh, belum harga toko”.
5. **Dashboard Order (pemilik)**
   - Daftar order: nama customer, ukuran kaos, ukuran cetak, harga, desain.
   - Versi awal boleh simpan lokal (localStorage) untuk demo. Penyimpanan permanen
     (database) hanya kalau sempat TANPA mengorbankan demo end-to-end.
6. **Biaya API per order (nilai tambah, bukan wajib mutlak)**
   - Kalau sempat, tampilkan perkiraan biaya API per order (acuan lama:
     sekitar Rp 300–500, Muse Image $0,01/gambar, SAM 3.1 sekitar Rp 40–50/gambar).
     Jangan jadikan angka ini patokan final tanpa cek Billing.

## 3. Stack & deploy (sudah diputuskan, jangan diubah tanpa persetujuan pemilik)

- **Framework: Next.js App Router + React, JavaScript (bukan TypeScript).**
  Alasan: deploy Vercel paling mulus, API route menyatu dengan frontend.
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
