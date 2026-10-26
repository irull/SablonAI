# Laporan pengerjaan SablonAI

Tanggal: **27 Oktober 2026 (WIB)**. Lokasi kerja: `D:\hackathon\meta-ai-developer`.

## Hasil utama

Aplikasi Next.js/React JavaScript sudah dibuat dari folder proyek yang kosong. Demo lokal bisa mengikuti alur **brief → desain contoh → mockup → harga contoh → simpan order → dashboard**. Editor bisa menggunakan gambar milik pengguna. Tidak ada API key yang dipakai dan tidak ada biaya model yang dikeluarkan.

Brief, prompt dan stage dari folder induk disalin ke repo untuk referensi; dokumen asli di luar proyek tidak diubah. Draf DOCX dibaca sebagai referensi; jika bertentangan, brief utama diikuti. Contohnya, generate satu hasil diprioritaskan sesuai brief utama, bukan empat variasi dari draf awal.

## Status per tahap — tidak menyamakan fallback dengan kelulusan live

| Tahap | Yang dikerjakan | Hasil verifikasi / yang masih menunggu |
|---|---|---|
| 0 — Fondasi | Instal dependensi, struktur Next.js, Git lokal, env kosong yang diabaikan, mode demo | Dev dan build berhasil. Billing/Spend Limit, GitHub, Vercel, tes berbayar, data toko masih menunggu pemilik. Tahap penuh belum lulus. |
| 1 — UI/mockup/warna | Studio responsif, tiga tab, enam preset warna, satu gambar kaos + mask | Desktop, lebar iframe 390 dan 320 px diperiksa. Gambar kaos masih ilustrasi, bukan foto toko. HP fisik belum diuji. |
| 2 — Generate | Route Handler Spark→Image berdasarkan dokumentasi Meta; tiga brief demo; prompt/timing/usage dapat ditampilkan | Tema sepeda, kopi, gaming diuji. Live tidak diaktifkan. Pemilihan contoh lokal tidak diklaim sebagai generasi AI. |
| 3 — Editor/SAM | fabric.js client, upload, teks, warna teks, geser, tarik sudut, skala, putar, hapus; SAM parser resmi; displacement/shading | Kontrol editor dicoba di browser. Fixture mask resmi berhasil diparsing/dikomposisi. SAM berbayar belum diuji. Hapus putih lokal diberi label demo dan batasannya. Realisme foto asli belum terbukti. |
| 4 — Harga/order | Rumus cm², ukuran kaos, kuantitas, tambahan; localStorage; status, pencarian, filter dan detail order | Order browser tersimpan, status bertahan setelah reload, tersinkron ke tab yang sama origin. Seluruh angka masih contoh; bintang demo nyata belum tersedia. |
| 5 — Bonus 3D | Dibatalkan sesuai gerbang no-go | Foto/harga/model live belum memenuhi penerimaan tahap 1–4. Tidak ada Three.js/model 3D yang ditambahkan. |
| 6 — Persiapan demo/submit | README, panduan pemilik, panduan Vercel, storyboard 3 menit, bukti screenshot | GitHub publik, URL Vercel, HP eksternal, video dan submission belum dilakukan. |

## Bukti pengujian

- `npm run build`: **lulus**, termasuk komponen client fabric dan route `/api/meta`.
- `npm run dev`: berhasil melayani halaman dan API. Setelah pengujian, server dev dihentikan dan versi produksi dijalankan melalui `npm start`.
- `npm start`: **lulus**, HTTP halaman 200; alur generate demo dan editor dicoba kembali dalam build produksi.
- `npm test`: **17 tes lulus**. Meliputi 3 tema demo, input salah, cross-origin, API belum aktif, host lokal, rumus normal/desimal/batas, order rusak, kuota penyimpanan penuh, fixture SAM terpotong dalam chunk, hasil kosong/tidak lengkap, serta byte gambar yang tidak valid.
- `npm run format:check`: **lulus**.
- `npm audit --omit=dev`: **0 kerentanan** pada audit terakhir. Sharp ditingkatkan ke 0.35.5 setelah audit awal menemukan advisory pada versi lama.
- Pemeriksaan file yang akan masuk Git: `.env.local`, `node_modules`, `.next` diabaikan. Tidak ada pola credential yang ditemukan dalam file sumber/dokumen yang dipindai. Ini pemeriksaan pola, bukan klaim audit keamanan lengkap.
- Konsol tab produksi diperiksa: tidak ada error JavaScript pada pemeriksaan akhir.

### Pemeriksaan browser

- Generate demo: Gowes Pagi, Kopi Dulu, Main Bareng; detail prompt sesuai tema.
- Warna dan ukuran cetak memperbarui mockup. Mask mempertahankan bentuk kaos.
- Upload `upload-demo.jpg` → hapus putih lokal → transparansi tampak di kanvas/mockup.
- Tambah teks, putar, perbesar dan hapus melalui tombol.
- Geser objek menggunakan pointer dan tarik sudut untuk resize pada versi produksi: posisi/batas berubah.
- Order contoh pertama Rp49.640 muncul di dashboard; status `Produksi` bertahan sesudah reload.
- Di layout 320 px, L merah, cetak 10×20 cm, 2 pcs → **Rp86.800**, sesuai 2×(38.000+2.400+3.000). Order terlihat di dashboard.
- Order hasil edit pada build produksi juga tersimpan beserta artwork dan state editor.
- Tidak ada overflow halaman pada iframe 390 px (body 375 px setelah scrollbar) dan 320 px (body 305 px). Dashboard mobile memakai kartu, bukan tabel yang terpotong.
- Pemeriksaan mobile memakai viewport iframe di browser desktop, **bukan pengujian perangkat HP fisik atau sentuhan nyata**.

### Batas verifikasi unduhan

Artwork PNG berhasil dibuat sebagai data gambar dan disertakan dalam order lokal. Tombol unduh PNG/JSON telah diimplementasikan. Percobaan menangkap file unduhan melalui otomasi browser dalam aplikasi mengalami timeout; file hasil unduhan di sistem operasi belum terkonfirmasi. Periksa unduhan di Chrome/Edge biasa sebelum rekaman. Tidak ada keberhasilan unduhan OS yang diklaim hanya berdasarkan klik tombol.

Screenshot produksi:

- [Studio](docs/screenshots/studio-desktop.png)
- [Editor](docs/screenshots/editor-desktop.png)
- [Dashboard](docs/screenshots/dashboard-desktop.png)

Order uji dengan nama “Pelanggan Demo QA”, “Demo Mobile 320”, dan “Demo Produksi Editor” hanya data sintetis pada browser pengujian ini, bukan order pelanggan asli. Browser lain akan mulai dengan daftar kosong.

## Masalah yang ditemukan dan diperbaiki

- Build pertama dijalankan ketika instalasi belum selesai: `next is not recognized`. Setelah instalasi selesai, build ulang berhasil.
- Import route awal terlalu banyak naik folder: `Can't resolve '../../../../lib/config.js'`. Diubah menjadi `../../../lib/...`; build berhasil.
- Mockup JPEG awal memiliki latar hitam akibat alpha diratakan otomatis. Generator aset diubah meratakan ke putih.
- fabric 7 memakai origin tengah secara default. Koordinat objek awal disesuaikan ke pusat kanvas agar artwork tidak terpotong saat pertama dimuat.
- Request browser lokal mengirim Origin/Host `127.0.0.1:3000`, sementara URL internal Next memakai `localhost:3000`. Guard awal mengembalikan `Permintaan lintas situs ditolak.` Guard kini membandingkan host asli dan memiliki tes regresi.
- Pembaruan sharp saat dev masih hidup sempat memicu cache modul lama. Server dimulai ulang; build/test dengan versi baru berhasil. Sisa direktori sementara npm di `node_modules` tidak ikut repo.
- Saat server dev diganti produksi, tab pratinjau lama menahan halaman koneksi gagal. Tab produksi baru berhasil dibuka dan digunakan. Tidak ada perubahan firewall atau pengaturan sistem.

## Yang dibutuhkan dari pemilik

Lihat [UNTUK-PEMILIK.md](UNTUK-PEMILIK.md). Intinya: key di server, Billing, foto/mask asli, tabel harga, brief pelanggan/bintang demo, serta akun repo/deployment. Deadline dari brief tetap **5 November 2026 09:00 WIB**, dengan pengecekan ulang portal peserta.

Tidak ada repository lain yang diubah, tidak ada perjanjian/submit yang diterima atas nama pemilik, dan tidak ada hosting publik yang diklaim tersedia.
