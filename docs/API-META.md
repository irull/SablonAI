# Integrasi Meta — bukti dan batas verifikasi

Diperiksa 27 Oktober 2026. Tidak ada API key yang diminta, dicetak, atau di-commit. Tidak ada panggilan model berbayar dalam pengerjaan ini.

## Sumber resmi

- [Overview dan ID model](https://dev.meta.ai/docs/overview)
- [Responses quickstart](https://dev.meta.ai/docs/quickstart)
- [Muse Image dan bentuk hasil](https://dev.meta.ai/docs/image-generation)
- [Media segmentation](https://dev.meta.ai/docs/media-segmentation)
- [Grammar output SAM](https://dev.meta.ai/docs/sam/reading-segmentation)
- [Parser resmi dan pemakaian mask](https://dev.meta.ai/docs/sam/client-libraries)

Halaman di atas dapat dibaca saat pengerjaan. Contoh dokumen menyebut env `MODEL_API_KEY`; aplikasi ini memakai nama `META_API_KEY` mengikuti brief pemilik. Header autentikasi tetap Bearer dan kunci hanya dibaca server.

## Kontrak yang diimplementasikan

Base URL tetap `https://api.meta.ai/v1`. Semua panggilan frontend menuju `/api/meta`, tidak langsung ke Meta. URL tujuan tidak diambil dari input pengguna.

| Aksi aplikasi | Model | Permintaan upstream | Hasil yang dipakai |
|---|---|---|---|
| `refine` | `muse-spark-1.3` | `POST /responses`, system + brief sebagai user input, `store:false` | Isi `output_text` dari item `message` |
| `image` | `muse-image-1.0` | `POST /responses`, prompt; tool `image_generation`, PNG, reasoning low; pencarian dimatikan | `image_generation_call.result`, base64 PNG |
| `segment` | `sam-3.1` | `POST /responses`, input_text objek + input_image data URL, `stream:true`, mask one_bit | Event stream melalui `@meta-sam/parser`, raster mask dikomposisi dengan gambar asli |

Permintaan Image memakai satu hasil per klik untuk menjaga uji biaya kecil. Ukuran `1024x1024` pada Muse Image mengarahkan aspek rasio; dokumentasi tidak menjamin ukuran piksel keluaran persis. Teks gambar dan kualitas produksi tetap diperiksa manusia.

SAM bukan endpoint yang langsung mengembalikan PNG transparan. Parser resmi membaca grammar khusus, lalu raster mask dipasang dalam koordinat kotak objeknya (bukan diregangkan ke seluruh gambar). Semua kecocokan objek digabung dengan alpha asli. Tidak ada objek atau stream tidak lengkap menghasilkan kegagalan, bukan keberhasilan palsu.

## Pengaman dan perilaku kegagalan

- `.env.local` diabaikan Git; `.env.example` tidak berisi kunci.
- Server memerlukan key DAN `META_LIVE_ENABLED=true`; UI bawaan demo.
- Validasi aksi, panjang teks, tipe gambar, ukuran payload, dan asal browser.
- Maksimal 6 permintaan live per menit per IP per proses; bukan pembatas global lintas server Vercel.
- SDK timeout 150 detik, tanpa retry otomatis; route menyediakan durasi maksimum 180 detik. Kuota/durasi deployment mengikuti paket Vercel pemilik, dan tetap harus diuji di hosting nyata.
- Error upstream tidak dikembalikan mentah. Log server hanya memuat aksi, nama error, dan kode status, tanpa header/key/gambar.
- Model gagal tidak menghapus desain sebelumnya. Cadangan demo dipilih eksplisit dan tetap berlabel demo.
- Tidak ada gateway lokal, 9Router, Hermes, model premium tambahan, atau URL API buatan.

## Pengujian yang sudah dilakukan

- Tiga brief demo menghasilkan pemilihan aset sesuai tema, melalui Route Handler yang sama.
- Request tidak valid dan cross-origin ditolak.
- Mode live tanpa konfigurasi mengembalikan 503 tanpa memanggil Meta.
- Perbedaan internal `localhost` dengan host browser `127.0.0.1` diuji agar permintaan sah tidak terblokir.
- Fixture mask resmi SAM dipotong menjadi beberapa chunk event, diparsing, didekode, dan dikomposisi. Posisi alpha dan dimensi PNG diperiksa otomatis.
- Fixture kosong/tidak lengkap ditolak.

**Belum terbukti:** autentikasi akun pemilik, akses ketiga model, kecocokan request/response live pada akun itu, kualitas hasil live, biaya, latensi nyata, dan perilaku di Vercel. Tes fixture tidak membuktikan model SAM sudah dipanggil.

## Prosedur tes kecil berikutnya

1. Aktifkan notifikasi batas belanja; isi key sendiri, aktifkan flag live, restart.
2. Gunakan satu brief singkat. Aktifkan Uji API live dan klik Buat desain satu kali: 1 Spark + 1 Image.
3. Buka log prompt di UI, unduh JSON hasil untuk bukti waktu/prompt/usage. Periksa gambar dan ejaan.
4. Di Custom Editor, upload satu gambar, pilih objeknya, isi noun phrase konkret (mis. `person` atau objek yang benar-benar terlihat), klik SAM satu kali.
5. Catat biaya dari Billing. Jangan mengisi angka biaya dari perkiraan lama sebagai biaya aktual.
6. Uji tiga brief pada laptop dan ponsel. Jika gagal, simpan kode status/log yang sudah disanitasi, lalu periksa dokumentasi terbaru sebelum mengubah format.
7. Setelah stabil, pemilik boleh mengganti `demoMode` menjadi false. Cadangan lokal tetap dipertahankan.
