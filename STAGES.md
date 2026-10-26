# STAGES.md — Tahapan Build SablonAI (Next.js, Vercel saja)

> Bahasa: Indonesia. Proyek: SablonAI, track indie, Meta Global AI Developer Hackathon.
> Build: **Selasa 27 Okt 2026 00:00 WIB – Kamis 5 Nov 2026 09:00 WIB** (deadline submit, tidak bisa telat).
> Tema: **Build for Your World**. Demo harus jalan penuh, bukan cuma video.
> Stack (keputusan 27 Okt 2026): **Next.js App Router + React, deploy Vercel saja.**
> Kerangka vanilla lama di `workspace/sablonai/` hanya referensi, jangan di-deploy.

## Aturan main yang tidak boleh dilanggar

1. **Demo dulu, polish belakangan.** Juri menilai demo yang benar-benar jalan (25%) dan
   dampak nyata (30%). Fitur keren yang setengah jalan merusak keduanya.
2. **API key tidak pernah di chat, di kode frontend, atau di repo publik.**
   Kunci hanya di environment variable Vercel / `.env.local` (lihat `.env.example`).
3. **Cek kredit sebelum test besar.** Kredit $150 Meta Model API sudah aktif di Billing.
   Setel dulu Spend Limit notification, baru test. Kalau kredit habis / tidak teraplikasi,
   kartu yang nempel bisa kena charge — jadi test kecil dulu.
4. **Satu mockup, banyak warna.** Foto dasar hanya 1 kaos putih + mask-nya.
   Warna jadi preset picker di app. Bukan foto banyak warna.
5. **2D dulu, 3D bonus.** Mockup 2D realistis adalah jalur utama. 3D hanya masuk
   kalau Stage 1–4 sudah jalan mulus (lihat Stage 5, ada gerbang go/no-go).
6. **Hanya karya selama hackathon yang didemo.** Jangan pakai hasil kerja sebelum
   27 Okt sebagai bagian demo, kecuali aset persiapan (foto mockup, tabel harga).
7. **fabric.js hanya di client.** Jangan import fabric di server component atau
   di level atas halaman. Editor ada di `components/EditorCanvas.js` dengan
   import dinamis di `useEffect`. Melanggar ini = build Next.js gagal.

## Peta ke rubrik juri

| Rubrik (skor 0–10 per kriteria, rubrik sama di Stage 2 & final) | Bobot | Dibuktikan di SablonAI lewat |
|---|---|---|
| Impact — potensi dunia nyata, siapa yang diuntungkan, cocok dengan problem statement | 30% | Demo dibuka & ditutup angka toko nyata: brief customer asli → order jadi, harga dari luas cetak. Bukan angka karangan. |
| Use of Meta AI tooling — pemakaian kreatif, bukan integrasi dasar | 25% | Rantai lengkap: Muse Spark (brief → prompt) → Muse Image (desain) → SAM 3.1 (hapus background). Plus Muse Wonder kalau sempat, untuk pelanggan yang kembali (Active Memory). |
| Technical depth — engineering rapi & matang | 20% | API Route aman di server, displacement mockup mengikuti lipatan, kalkulator dari luas, editor fabric.js yang stabil di HP, struktur komponen Next.js yang rapi. |
| Demo — demo jalan & video layak tonton | 25% | Alur end-to-end tanpa putus di video 3 menit + link demo Vercel yang bisa diklik juri. Siapkan mockup pre-render sebagai fallback kalau API lambat saat rekam. |

## Teknologi yang dipakai (keputusan kerangka Next.js)

- **Framework:** Next.js App Router (JavaScript, bukan TypeScript — supaya lebih
  cepat dibaca & diperbaiki). React untuk komponen UI.
- **Editor:** fabric.js (canvas 2D) untuk upload desain, tambah teks, geser/perbesar.
  Client component saja, import dinamis.
- **Mockup 2D:** 1 foto kaos putih + displacement map dari foto itu sendiri
  + blending Multiply/Overlay, ala Lumise.
- **Backend/API:** Route Handler Next.js di `app/api/meta/route.js` sebagai proxy
  ke Meta Model API. Frontend tidak pernah memegang API key.
- **Deploy: Vercel saja.** Repo GitHub (publik saat submit) → Vercel deploy otomatis.
  GitHub Pages TIDAK dipakai sebagai demo utama, karena Pages tidak bisa
  menjalankan API route, dan dua link demo (Pages + Vercel) bisa membingungkan juri.
  Pages hanya boleh jadi cadangan, bukan link di video/submit.
- **Test chat yang sudah dilakukan:** test chat via 9Router + Hermes lokal (27 Okt 2026)
  itu bagus sebagai bukti chat jalan, TAPI bukan jalur produk. Produk tidak boleh
  bergantung ke gateway lokal (localhost tidak bisa diakses Vercel) dan
  jalur OpenAI-compatible 9Router belum tentu mendukung Muse Image & SAM 3.1.
  Jadi jalur produk tetap Route Handler Vercel di atas.

## Struktur kerangka Next.js (yang sudah dibuat)

```
sablonai-nextjs/
├── package.json            # next, react, react-dom, fabric
├── next.config.js
├── app/
│   ├── layout.js           # Shell HTML + metadata
│   ├── page.js             # Halaman tipis, import SablonApp (server component)
│   ├── globals.css         # Gaya mobile-first
│   └── api/meta/route.js   # Proxy API (kerangka, TODO diisi Stage 2)
├── components/
│   ├── SablonApp.js        # Client: tab, warna, harga, order, AI Generate
│   └── EditorCanvas.js     # Client: fabric.js, import dinamis
├── lib/
│   ├── config.js           # Warna preset, rumus harga (placeholder), mode demo
│   └── api.js              # Frontend → /api/meta saja
├── public/assets/          # Tempat foto mockup putih + mask (Stage 1)
├── .env.example            # Contoh variabel, tanpa kunci asli
├── .gitignore
├── README.md
└── STAGES.md               # File ini
```

## Stage 0 — Fondasi & Pengaman (27 Okt)

**Tujuan:** tidak ada waktu build yang hilang karena akun, kunci, atau repo.
- [ ] Setel Spend Limit notification di Billing Meta.
- [ ] Buat repo GitHub BARU `SablonAI` dari folder ini, hubungkan ke Vercel, isi `META_API_KEY`
      di Vercel Environment Variables (bukan di repo).
- [ ] `npm install` + `npm run dev` jalan lokal, `npm run build` lolos (cek jebakan fabric).
- [ ] Test kecil via Route Handler: 1x Spark, 1x Image, 1x SAM. Catat biaya & waktu.
- [ ] Kumpulkan: 1 foto kaos putih + mask, tabel harga toko, 5–10 brief order nyata
      (1 dipilih jadi “bintang demo” — yang teks/logonya jelas).
- **Kriteria selesai:** repo + Vercel jalan, build lolos, 3 test API kecil berhasil, aset Stage 1 lengkap.
- **Fallback:** kalau API Meta bermasalah, jangan kejar-kejaran — pakai mode demo
  + desain pre-render untuk UI, sambil laporkan masalah di Discord #questions.

## Stage 1 — Shell UI + Mockup 2D + Warna (27–28 Okt)

**Tujuan:** customer bisa buka web di HP, pilih warna, lihat mockup.
- [ ] Foto kaos putih masuk ke `public/assets/`, tampil sebagai mockup utama.
- [ ] Picker warna (preset stok toko) mengubah warna kain, bukan ganti foto.
- [ ] Layout mobile: tab AI Generate / Custom Editor / Dashboard, tombol besar.
- **Kriteria selesai:** dibuka di HP, ganti warna langsung berubah, tidak ada layout rusak.
- **Untuk juri:** ini fondasi Demo & Technical depth — harus mulus sebelum AI masuk.

## Stage 2 — AI Generate: Spark → Image (28–30 Okt)

**Tujuan:** chat brief jadi desain.
- [ ] Isi `app/api/meta/route.js`: endpoint & format persis dari docs Meta untuk Spark & Image.
      Jangan menebak format — cek docs, test, baru kunci.
- [ ] Alur: brief customer → Spark merapikan jadi prompt desain → Image membuat gambar
      → gambar tampil di mockup.
- [ ] Simpan prompt & hasil di log demo (bukti Tooling, bukan sekadar “pakai AI”).
- [ ] Matikan `demoMode` di `lib/config.js` hanya setelah alur ini jalan stabil.
- **Kriteria selesai:** 3 brief berbeda (termasuk bintang demo) menghasilkan desain
  yang tampil di mockup tanpa error, di HP maupun laptop.
- **Fallback:** kalau Image lambat/gagal saat demo, pakai 2–3 desain pre-render
  yang sudah dibuat sebelumnya.

## Stage 3 — Custom Editor + SAM 3.1 (30 Okt – 1 Nov)

**Tujuan:** customer yang sudah punya desain bisa edit sendiri, background bersih.
- [ ] fabric.js penuh: upload, tambah teks, geser, perbesar, putar, hapus objek.
- [ ] Tombol hapus background → SAM 3.1 via Route Handler → hasil cut-out masuk ke mockup.
- [ ] Displacement map: desain mengikuti lipatan kain + blending Multiply/Overlay.
      Tuning: nilai displace, blur, opacity — dites pakai foto mockup asli, bukan teori.
- **Kriteria selesai:** upload logo buram → hapus background → tempel di mockup
  dan kelihatan menyatu dengan kain, bukan seperti stiker tempelan.
- **Risiko:** filter piksel di HP bisa lambat — mitigasi: precompute di resolusi
  tetap (mis. 1024 px), pisahkan layer desain dari foto.

## Stage 4 — Kalkulator Harga + Dashboard Order (1–2 Nov)

**Tujuan:** dari desain jadi order yang bisa diproduksi.
- [ ] Ganti angka placeholder di `lib/config.js` dengan tabel harga toko nyata:
  harga kaos per ukuran + harga cetak per cm² + biaya tambahan.
- [ ] Harga berubah langsung saat ukuran cetak / ukuran kaos diubah.
- [ ] Order disimpan & tampil di Dashboard pemilik (nama, ukuran, luas cetak, harga,
  desain). Versi demo lokal dulu, backend penyimpanan permanen hanya kalau sempat
  tanpa mengorbankan demo.
- **Kriteria selesai:** bintang demo dihitung harganya dengan benar dan ordernya
  muncul di dashboard. Angka ini yang dipakai buka/tutup video demo (Impact).

## Stage 5 — BONUS 3D, hanya kalau lolos gerbang (2–3 Nov)

**Gerbang go/no-go (dicek di awal Stage 5, tidak bisa dinego):**
- Stage 1–4 semua kriteria selesai DAN demo end-to-end sudah bisa direkam.
- Kalau salah satu belum selesai → Stage 5 DIBATALKAN, waktu dialihkan ke Stage 6.
- Kalau lolos → coba model 3D (referensi: VirtualThreads pakai Verge3D + glTF;
  jalur gratis kita: Three.js + model glTF, desain jadi texture, warna jadi
  warna material, juga sebagai client component). Target minimal: putar
  depan–belakang–samping + ganti warna. Kalau modelnya melar atau HP nge-lag,
  batalkan 3D dan kembali ke 2D — demo 2D yang mulus lebih berharga daripada 3D yang patah-patah.
- **Kriteria selesai (bonus):** 3D jalan di HP tanpa lag berat, desain tidak melar
  di lipatan/kerah, dan tidak merusak alur 2D.

## Stage 6 — Demo, Deploy & Submit (3–5 Nov, deadline 5 Nov 09:00 WIB)

**Tujuan:** semua yang dinilai juri sudah rapi dan terkirim tepat waktu.
- [ ] Repo GitHub SablonAI dipastikan PUBLIK, README lengkap, tidak ada kunci di repo.
- [ ] Deploy Vercel dicek dari HP orang lain (bukan cuma laptop sendiri). Link Vercel
      inilah link demo utama di video & submit.
- [ ] Video demo 3 menit (Storyboard sudah ada, 5 shot): buka angka toko →
  chat brief → AI desain → mockup realistis → harga → order masuk dashboard → tutup angka.
- [ ] Submit via halaman submit paling lambat **5 Nov 09:00 WIB**: repo publik +
  video 3 menit + semua kontributor terdaftar. Jangan submit di menit terakhir.
- [ ] Uji akhir: buka demo dari HP dengan koneksi biasa, dan siapkan desain
  pre-render kalau API ngadat saat penjurian.
- **Kriteria selesai:** submit terkirim & terkonfirmasi, link demo Vercel bisa dibuka juri.

## Checklist harian singkat (tempel di dinding)

- Pagi: apa target stage hari ini & kriteria selesainya?
- Sore: apakah demo end-to-end masih jalan? Kalau rusak, perbaiki dulu sebelum nambah fitur.
- Malam: commit ke GitHub (pesan commit jelas), jangan tidur dengan demo rusak.
- Setiap kali nambah komponen client (canvas, localStorage, window): pastikan
  tidak di-import dari server component.

## Yang masih placeholder & harus diisi saat Stage-nya tiba

- Angka harga di `lib/config.js` (Stage 4, dari tabel harga toko).
- Endpoint & nama model persis di `app/api/meta/route.js` (Stage 2/3, dari docs Meta).
- Foto mockup & mask di `public/assets/` (Stage 1, dari toko).
- Bintang demo: 1 order nyata pilihan pemilik (Stage 0).
