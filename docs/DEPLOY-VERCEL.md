# Deploy utama: Vercel

Status: konfigurasi aplikasi siap dibangun di Vercel, tetapi repo publik dan deployment belum dibuat. Folder awal kosong dan sesi ini tidak memiliki CLI GitHub/Vercel yang tersedia. Tidak ada link publik yang dapat diklaim berhasil.

## Siapkan repo baru

1. Login GitHub sendiri, buat repo baru bernama `SablonAI`. Pilih publik sesuai brief saat siap submit. Jangan ubah repo lain.
2. Jangan centang pembuatan README otomatis: repo lokal sudah memiliki README dan commit.
3. Dari folder proyek, hubungkan URL repo milikmu dan push. Git lokal sudah diinisialisasi. Nama branch saat dibuat adalah `master`; bisa diganti ke `main`:

```powershell
cd D:\hackathon\meta-ai-developer
git branch -M main
git remote add origin https://github.com/NAMA-AKUN/SablonAI.git
git push -u origin main
```

Ganti `NAMA-AKUN` sendiri. Periksa `git status` dan daftar file sebelum push. `.env.local`, `node_modules`, dan `.next` harus tetap diabaikan. Jangan masukkan token dalam URL remote.

## Import ke Vercel

1. Masuk Vercel, pilih Add New Project, import repo SablonAI.
2. Framework: Next.js. Root directory: akar repo. Build: `npm run build`. Jangan memakai static export atau GitHub Pages.
3. Pilih runtime Node.js 24.x yang tersedia pada akun; kode mensyaratkan minimal 22.9.
4. Untuk demo tanpa biaya, biarkan API key kosong dan `META_LIVE_ENABLED=false`.
5. Untuk tes live, isi `META_API_KEY` melalui Environment Variables Vercel dan flag `META_LIVE_ENABLED=true`. Jangan isi key di frontend atau repo. Pastikan Billing Meta sudah dipantau.
6. Deploy. Simpan URL hasil Vercel sebagai satu-satunya demo utama. Jika env diubah, lakukan redeploy.
7. Periksa batas durasi fungsi paket Vercel yang dipakai. Route meminta hingga 180 detik, tetapi keberhasilannya belum diuji di hosting. Image/SAM lambat tetap harus ditangani dengan pesan error dan cadangan demo.

## Penerimaan deployment

- [ ] HTTPS dapat dibuka dari browser pribadi dan HP orang lain.
- [ ] Tidak ada error browser saat pindah semua tab.
- [ ] Warna, ukuran, upload, teks, putar, harga, simpan order, dan dashboard berjalan.
- [ ] Tiga brief benar-benar memakai model live jika video mengklaim live. Jika mode demo, label demo tetap terlihat.
- [ ] Penghapusan background benar-benar SAM, bukan tombol hapus putih lokal.
- [ ] API key tidak muncul dalam request frontend, HTML, bundle JavaScript, atau Git.
- [ ] Harga dan foto sudah nyata, atau masih dilabeli contoh.
- [ ] Cadangan order JSON diunduh; order lokal di satu HP tidak otomatis muncul di laptop.
- [ ] Pembatas/proteksi hosting dan notifikasi batas belanja diatur sebelum membuka API berbayar luas.
- [ ] URL final dicantumkan di README, video dan submission.

Jangan menulis status “deploy selesai” sampai link publik diperiksa. Akun/perjanjian baru harus diselesaikan pemilik sendiri.
