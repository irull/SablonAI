# SablonAI

**Dari cerita jadi karya.** Studio desain kaos DTF berbahasa Indonesia untuk Meta Global AI Developer Hackathon, track indie, tema Build for Your World.

Pelanggan di usaha sablon sering datang membawa ide, bukan artwork siap produksi. SablonAI menyatukan brief, desain, mockup, estimasi harga dari luas cetak, dan order dalam satu studio.

> Status 27 Oktober 2026: demo lokal end-to-end berjalan. Tiga model Meta sudah memiliki konektor berdasarkan dokumentasi resmi, tetapi BELUM diuji dengan API key pemilik. Gambar, harga, dan order uji adalah contoh. Belum ada deployment publik.

## Mulai di Windows

Klik dua kali **MULAI-SABLONAI.cmd**, lalu buka **http://127.0.0.1:3000**. Biarkan jendela terminal menyala. Tekan Ctrl+C untuk berhenti. Jika port 3000 terpakai, Next menampilkan nomor port penggantinya.

Atau dari PowerShell:

```powershell
cd D:\hackathon\meta-ai-developer
npm install
npm run dev
```

Node.js 22.9+ dibutuhkan (pengujian memakai 24.20). Untuk mode produksi lokal:

```powershell
npm run build
npm start
```

## Coba demo tanpa key

1. Pilih inspirasi **Gowes Pagi**, **Kopi Dulu**, atau **Main Bareng**, lalu klik **Buat desain**. Dalam mode demo, aplikasi memilih salah satu dari tiga artwork lokal; tidak menggambar brief bebas dengan AI.
2. Ganti warna kaos dan ukuran cetak. Ukuran cetak membatasi keseluruhan kanvas desain, termasuk ruang transparan. Aktifkan garis area cetak melalui ikon pengaturan pada mockup.
3. Buka **Custom Editor**. Upload PNG/JPG/WebP, tambah teks, geser objek, tarik sudut untuk mengubah ukuran, atau gunakan tombol putar/perbesar/hapus. Kanvas editor merupakan area cetak di kaos.
4. Untuk mencoba background tanpa API, upload `public/assets/upload-demo.jpg`, pilih gambarnya, lalu klik **Coba hapus putih (demo lokal)**. Filter ini bukan SAM, hanya menghapus piksel mendekati putih termasuk detail putih dalam desain.
5. Isi nama contoh dan klik **Simpan order demo**. Buka **Dashboard Order**, periksa mockup, ubah status, unduh artwork dan cadangkan detail order.

Dashboard disimpan dalam localStorage (`sablonai.orders.v1`) pada browser/perangkat yang sama. Ini demo lokal, bukan sistem order toko dengan login. Menghapus data browser menghapus order. Penyimpanan penuh dilaporkan; aplikasi tidak diam-diam menghapus order lama. Cadangan JSON dapat diunduh untuk arsip; fitur impor pemulihan belum dibuat.

## Mengisi API key setelah istirahat

File `.env.local` sudah disiapkan kosong dan dikecualikan dari Git. Isi sendiri nilai **META_API_KEY** di editor lokal. Jangan kirim kunci lewat chat. Jangan memakai awalan `NEXT_PUBLIC_`.

1. Periksa Billing Meta dan aktifkan notifikasi batas belanja.
2. Isi `META_API_KEY` di `.env.local`.
3. Untuk pengujian kecil, ubah `META_LIVE_ENABLED` menjadi `true` dan mulai ulang server.
4. Buka **Pengaturan koneksi AI** di panel AI Generate → aktifkan **Uji API live**.
5. Lakukan satu generate (1 Spark + 1 Image). Di Custom Editor pilih gambar unggahan, isi objek yang ingin dipertahankan, lalu panggil SAM satu kali.
6. Catat hasil/waktu dan biaya nyata dari Billing. Uji tiga brief di laptop dan ponsel. Barulah ubah `demoMode` di `lib/config.js` ke `false` bila ingin live menjadi bawaan.

Default tetap demo walaupun key tersedia. Key saja belum menyalakan panggilan berbayar. Mode live tidak otomatis beralih ke gambar demo ketika gagal; tombol cadangan ditawarkan dengan jelas. `maxRetries: 0` mencegah pengulangan panggilan berbayar secara otomatis.

Detail implementasi, model, sumber resmi, dan batas pengujian: [docs/API-META.md](docs/API-META.md).

## Harga dan mockup toko

Semua angka saat ini **CONTOH, BELUM HARGA TOKO**. Ubah `lib/config.js` setelah pemilik memberi tabel harga:

```text
harga per kaos = harga kaos sesuai ukuran
               + lebar cm × tinggi cm × tarif cetak per cm²
               + biaya tambahan per kaos
harga order = harga per kaos × jumlah
```

Contoh teruji: L Rp38.000 + 24×30×Rp12 + Rp3.000 = **Rp49.640/kaos**. Dua kaos = Rp99.280. Angka ini bukan penawaran harga toko.

Aset kaos saat ini ilustrasi buatan kode, bukan foto produk. Ganti `public/assets/mockup-kaos-putih.jpg` dan `mockup-kaos-mask.png` dengan foto putih depan dan mask alpha transparan yang sejajar. Renderer memakai kanvas 800×740; paling mudah gunakan dimensi/aspek dan posisi kaos yang sama. Warna putih pada mask harus memiliki alpha penuh; luar kaos harus transparan, bukan hitam opaque. Bila foto berbeda komposisi, sesuaikan koordinat area cetak dan skala 7 px/cm di `components/MockupCanvas.js`.

Displacement dan shading menggunakan luminans foto yang sama. Realisme akhir tetap perlu disetel dengan foto kain asli. Simulasi warna layar tidak menggantikan contoh kain fisik.

Artwork demo dan ekspor editor 600×720 px belum dijamin layak cetak. Periksa resolusi, teks, transparansi, warna, dan hak penggunaan sebelum produksi. Empat variasi per brief pada draf awal tidak dijadikan default: brief utama memprioritaskan satu hasil per generate dan uji biaya kecil.

## Stack dan struktur

- Next.js App Router, React, JavaScript; satu aplikasi untuk frontend dan server.
- fabric.js dimuat dinamis hanya dalam efek komponen client.
- `app/api/meta/route.js`: proxy server, validasi input, pembatasan payload, timeout, dan pembatasan permintaan sederhana.
- `components/MockupCanvas.js`: recolor satu foto dengan alpha mask, displacement dari luminans, shading/blending.
- `components/EditorCanvas.js`: editor dan background removal.
- `lib/pricing.js`: kalkulator murni; `lib/orders.js`: penyimpanan dan ekspor lokal.
- `tests/`: rumus harga, persistensi, validasi, jalur demo, pembatas live, dan fixture mask SAM resmi.

Pembatas permintaan di memori berlaku per proses, bukan batas biaya global pada Vercel. Sebelum live publik, gunakan pengaturan pembatasan/proteksi deployment yang sesuai dan pantau Billing.

## Verifikasi

```powershell
npm test
npm run build
npm run format:check
npm audit --omit=dev
```

Unduhan PNG/JSON perlu dicek di browser biasa; otomasi unduhan dalam browser aplikasi belum mengonfirmasi file tersimpan di OS.

Laporan bukti pengujian dan yang belum selesai: [LAPORAN-PENGERJAAN.md](LAPORAN-PENGERJAAN.md). Build dan tes tidak membuktikan API Meta live, cetak fisik, atau ketersediaan Vercel.

## Deploy dan demo hackathon

Panduan: [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md). Storyboard 3 menit: [docs/DEMO-3-MENIT.md](docs/DEMO-3-MENIT.md). Daftar yang perlu dilengkapi pemilik: [UNTUK-PEMILIK.md](UNTUK-PEMILIK.md).

Repo lokal Git sudah dibuat dengan commit per tahap. Belum ada remote GitHub atau proyek Vercel yang terhubung. Jangan menampilkan link lokal sebagai link submit publik.

Batas kerja menurut brief: **5 November 2026 09:00 WIB**. Halaman event resmi menampilkan 4 November 2026 21:00 ET, yang dikonversi menjadi waktu tersebut. Periksa portal peserta untuk perubahan dan Official Rules sebelum submit: [Meta](https://dev.meta.ai/events/global-hackathon), [Cerebral Valley](https://events.cerebralvalley.ai/e/meta-ai-developer-hackathon). Teks Official Rules lengkap belum diverifikasi dalam pengerjaan ini; tidak ada formulir/perjanjian yang diterima atau dikirim.

## Asal karya

Pemilik mengarahkan kebutuhan produk dan domain produksi DTF. Implementasi lokal dalam repo ini dikerjakan mulai 27 Oktober 2026 (WIB), dengan bantuan OpenAI Codex. Jangan mengklaim proyek dibangun dengan Muse Code bila belum benar-benar digunakan. Penggunaan model Meta live juga harus dilaporkan sesuai hasil uji nyata.

Tiga artwork placeholder dan ilustrasi kaos dibuat langsung dari SVG/kode dalam `scripts/create-assets.mjs`, bukan keluaran Muse Image. `npm run assets` membuat ulang aset tersebut dan akan menimpa aset dengan nama sama; jangan jalankan setelah mengganti foto/artwork toko tanpa membuat cadangan. Ikon menggunakan lucide-react, font memakai DM Sans/Manrope dengan fallback lokal. Dependensi pihak ketiga tetap mengikuti lisensinya.
