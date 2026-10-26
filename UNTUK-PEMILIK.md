# Untuk pemilik — mulai dari sini

SablonAI sudah bisa dicoba dalam **mode demo lokal tanpa API key**.

1. Klik dua kali `MULAI-SABLONAI.cmd`.
2. Buka `http://127.0.0.1:3000`.
3. Pilih inspirasi → Buat desain → ganti warna/ukuran → isi nama contoh → Simpan order demo → Dashboard.
4. Coba upload dan tambah teks di Custom Editor. Contoh logo berlatar putih ada di `public/assets/upload-demo.jpg`.

## Yang perlu kamu lengkapi setelah bangun

- [ ] Isi sendiri `META_API_KEY` di `.env.local`. Jangan kirim key lewat chat.
- [ ] Cek kredit dan notifikasi batas belanja di Billing Meta.
- [ ] Aktifkan `META_LIVE_ENABLED=true` hanya untuk tes kecil, lalu restart aplikasi.
- [ ] Di panel AI Generate, buka Pengaturan koneksi AI → Uji API live.
- [ ] Uji 1 generate dan 1 hapus background SAM, lihat biaya nyata, lalu 3 brief berbeda di HP/laptop.
- [ ] Berikan foto kaos putih depan dan mask transparan yang sejajar. Gambar sekarang ilustrasi sementara.
- [ ] Berikan harga kaos S–XXL, tarif cetak/cm², dan tambahan per kaos. Semua harga di layar masih contoh.
- [ ] Pilih 1 order nyata sebagai bintang demo, beserta 5–10 brief pelanggan. Data uji yang ada bukan pelanggan asli.
- [ ] Hubungkan repo GitHub baru dan Vercel. Panduannya di `docs/DEPLOY-VERCEL.md`.
- [ ] Coba link Vercel dari HP lain, rekam video 3 menit dan submit.

**Belum selesai:** pengujian API berbayar, foto asli, harga nyata, hosting publik, rekaman video, dan submit. Jangan menyebut hasil demo lokal sebagai bukti API Meta sudah berhasil.

Deadline kerja dari brief: **5 November 2026, 09:00 WIB**. Periksa kembali portal peserta sebelum submit.

Baca `LAPORAN-PENGERJAAN.md` untuk hasil tes dan `README.md` untuk penjelasan lengkap.
