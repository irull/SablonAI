# PROMPT UNTUK CODEX — SablonAI (siap tempel)

> Cara pakai: tempel **Prompt Utama** di bawah ini ke Codex sebagai pesan pertama,
> bersama file `BRIEF-CODEX.md` (dan folder proyek ini, kalau sudah ada).
> Setelah itu, untuk tiap stage, tempel prompt stage yang sesuai — satu stage
> per satu, jangan semua stage sekaligus. Jangan tempel kunci API apa pun di chat.

---

## Prompt Utama (tempel ini dulu)

```
Kamu adalah coding agent untuk proyek SablonAI, web app sablon DTF milik
pengusaha Indonesia (bukan berlatar IT) untuk Meta Global AI Developer Hackathon,
track indie, tema Build for Your World.

Baca dan patuhi BRIEF-CODEX.md dan STAGES.md di proyek ini sampai habis
SEBELUM menulis kode apa pun. Brief itu adalah sumber kebenaran. Kalau ada
yang bertentangan, ikuti brief, kecuali aturan resmi hackathon.

Ringkasan yang tidak boleh kamu langgar:
- Stack: Next.js App Router + React, JavaScript (bukan TypeScript).
  Deploy: Vercel saja untuk demo utama. Repo GitHub harus publik saat submit.
  GitHub Pages TIDAK dipakai sebagai demo utama.
- 2 tampilan utama: AI Generate (brief -> Muse Spark -> Muse Image -> mockup)
  dan Custom Editor (fabric.js, upload, tambah teks, hapus background SAM 3.1).
- Mockup realistis: 1 foto kaos putih + mask, desain menyatu mengikuti lipatan
  kain (displacement + blending), warna kaos diganti dari app lewat preset picker.
- Kalkulator harga dari luas cetak, dashboard order pemilik.
- API Meta lewat Route Handler di app/api/meta/route.js saja, kunci hanya dari
  environment variable Vercel (META_API_KEY). JANGAN PERNAH tulis kunci di kode,
  di .env yang ikut commit, atau di chat. JANGAN tebak endpoint/nama model/
  format API Meta — isi dari dokumentasi resmi saat Stage 2, test kecil dulu.
- fabric.js HANYA di client component, import dinamis di useEffect.
  Jangan import fabric di server component — build akan gagal.
- Kerjakan BERURUTAN satu stage per satu (Stage 0 sampai 6, lihat STAGES.md).
  Demo yang sudah jalan tidak boleh dirusak demi polish. Jangan tambah fitur
  di luar brief tanpa persetujuan pemilik.
- Deadline submit: 5 November 2026 pukul 09:00 WIB. Repo publik + video demo
  3 menit + kontributor.
- Setelah tiap stage, jalankan npm run build, laporkan dalam Bahasa Indonesia
  sederhana: apa yang selesai, apa yang dites, apa yang masih placeholder,
  dan apa yang kamu butuhkan dari pemilik (foto, tabel harga, bintang demo,
  kunci di Vercel). Kalau mentok, tuliskan error persisnya dan berhenti di
  titik itu, jangan menebak berulang-ulang.

Mulai dari Stage 0. Tanyakan hanya kalau ada yang benar-benar memblokir
pekerjaan, selebihnya kerjakan dari brief dan kerangka yang sudah ada.
Kalau folder proyek ini sudah berisi kerangka Next.js, LANJUTKAN dari kerangka
itu, jangan tulis ulang dari nol.
```

---

## Prompt per stage (tempel satu per satu, setelah stage sebelumnya selesai)

### Stage 0 — Fondasi & Pengaman

```
Kerjakan Stage 0 dari STAGES.md dan BRIEF-CODEX.md untuk SablonAI.
Pastikan: npm install, npm run dev, dan npm run build jalan. Siapkan checklist
yang harus dilengkapi pemilik: Spend Limit di Billing Meta, repo GitHub baru,
Vercel + META_API_KEY di Environment Variables, foto kaos putih + mask,
tabel harga toko, 5-10 brief nyata, dan 1 bintang demo.
Jangan isi angka harga atau format API dengan tebakan. Laporkan apa yang sudah
siap dan apa yang masih menunggu pemilik, dalam Bahasa Indonesia sederhana.
```

### Stage 1 — Mockup 2D + Warna + Headless UI / Tailwind

```
Kerjakan Stage 1 SablonAI, dengan langkah UI dulu sebelum halaman e-commerce
dibangun: instal Headless UI + Tailwind CSS (sesuaikan versinya dengan
Next.js/React di proyek ini, cek peer dependencies, jangan asal salin versi
dari kerangka lain), konfigurasi Tailwind, migrasi globals.css, tetapkan token
desain bersama, dan buat komponen bersama Button/Card/Input/Badge/Price yang
dipakai di semua halaman.
Pakai Headless UI untuk RadioGroup (warna/ukuran/sablon), Dialog (cart/checkout/
detail/login), Disclosure (menu HP/size chart), Switch (1/2 sisi), Tabs
(navigasi utama), dan Listbox (filter status) — semua hanya di client component.
Jangan buat dropdown/modal kustom baru kalau Headless UI sudah menyediakannya,
dan jangan pakai Headless UI untuk editor fabric.js atau mockup displacement.
Setelah itu: foto kaos putih di public/assets/ jadi mockup utama, picker warna
preset (pakai RadioGroup) mengubah warna kain (bukan ganti foto), layout mobile
rapi untuk tab AI Generate / Custom Editor / Dashboard.
Kriteria selesai: dibuka di HP, ganti warna langsung berubah, tidak ada layout
rusak, tidak ada dua gaya tombol/kartu yang berbeda, dialog/menu bisa dipakai
dengan keyboard. Jalankan npm run build dan laporkan hasil tesnya.
```

### Stage 2 — AI Generate: Spark → Image

```
Kerjakan Stage 2 SablonAI: isi app/api/meta/route.js dari dokumentasi resmi
Meta Model API untuk Muse Spark dan Muse Image, lalu sambungkan alur
brief -> Spark (prompt) -> Image (desain) -> tampil di mockup.
Jangan tebak format API. Test dengan 3 brief berbeda termasuk bintang demo.
Matikan demoMode di lib/config.js HANYA setelah alur ini jalan stabil di HP
dan laptop. Laporkan biaya/waktu test dan error apa pun dengan persis.
```

### Stage 3 — Custom Editor + SAM 3.1

```
Kerjakan Stage 3 SablonAI: lengkapi fabric.js (upload, tambah teks, geser,
perbesar, putar, hapus objek), tombol hapus background lewat SAM 3.1 via
Route Handler, dan displacement map supaya desain mengikuti lipatan kain
dengan blending Multiply/Overlay.
Kriteria selesai: upload logo buram -> hapus background -> tempel di mockup
kelihatan menyatu dengan kain, bukan stiker tempelan. Perhatikan performa HP.
```

### Stage 4 — Kalkulator Harga + Dashboard

```
Kerjakan Stage 4 SablonAI: ganti angka placeholder di lib/config.js dengan
tabel harga toko nyata yang diberikan pemilik (harga kaos per ukuran + harga
cetak per cm2 + biaya tambahan), harga berubah langsung saat ukuran berubah,
dan order tampil di dashboard pemilik.
Kriteria selesai: harga bintang demo benar dan ordernya muncul di dashboard.
Kalau tabel harga belum diberikan, pakai placeholder berlabel jelas dan
laporkan bahwa itu masih menunggu pemilik.
```

### Stage 5 — Bonus 3D (hanya kalau lolos gerbang)

```
Cek dulu gerbang Stage 5 di STAGES.md: Stage 1-4 selesai DAN demo end-to-end
sudah bisa direkam? Kalau TIDAK lolos, BATALKAN Stage 5 dan laporkan bahwa
waktu dialihkan ke Stage 6, jangan kerjakan 3D.
Kalau lolos, kerjakan bonus 3D minimal: model glTF + Three.js (client component),
putar depan-belakang-samping + ganti warna material, desain jadi texture.
Kalau model melar atau HP lag berat, batalkan 3D dan kembali ke mockup 2D.
```

### Stage 6 — Demo, Deploy & Submit

```
Kerjakan Stage 6 SablonAI: pastikan repo PUBLIK dan bersih (tidak ada kunci,
tidak ada .env asli, README lengkap), deploy Vercel dicek dari HP orang lain,
dan siapkan alur video demo 3 menit sesuai storyboard (buka angka toko ->
chat brief -> AI desain -> mockup realistis -> harga -> order di dashboard ->
tutup angka).
Ingatkan pemilik: submit paling lambat 5 November 2026 pukul 09:00 WIB
(repo publik + video + kontributor). Jangan submit di menit terakhir.
Laporkan link Vercel final dan checklist penerimaan akhir dari BRIEF-CODEX.md.
```

---

## Yang TIDAK boleh ada di prompt ke Codex

- Kunci API Meta apa pun, password apa pun, atau isi `.env` asli.
- Perintah untuk mengubah repo lain, menghapus repo, atau memakai GitHub Pages
  sebagai demo utama.
- Perintah untuk memakai 9Router/Hermes lokal sebagai jalur produk.
- Angka harga final atau format API yang dikarang — selalu tandai placeholder
  dan minta data nyata ke pemilik.
