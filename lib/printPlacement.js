// Penempatan area cetak (masking) mengikuti gambar panduan masking
// dari user, 2026-11-03: semua ukuran RATA ATAS (tepi atas sejajar
// antar ukuran dan antar orientasi), bukan rata tengah seperti
// sebelumnya. Pada panduan, oranye = lanskap dan biru = potret;
// 10x10 tidak punya orientasi (persegi, dada kiri di depan) dan
// 32x42 (A3) hanya potret.
//
// Angka 3D adalah meter dunia model white-tee.glb (terukur dari
// file: lebar torso 0,421 m, puncak garmen y 1,648, ujung bawah
// y 0,966). Fraksi panduan terhadap tinggi garmen: tepi atas depan
// 25,5%, depan 10x10 27,2% + tengahnya bergeser ke dada kiri,
// belakang 9,7%, belakang 10x10 2,7% (menempel di bawah kerah).
export function isTenSquare(wCm, hCm) {
  return wCm === 10 && hCm === 10;
}

export const FRONT_TOP_Y = 1.474;
export const FRONT_TEN_TOP_Y = 1.462;
export const FRONT_TEN_CX = 0.09;
export const BACK_TOP_Y = 1.582;
export const BACK_TEN_TOP_Y = 1.63;

export function frontTopY(wCm, hCm) {
  return isTenSquare(wCm, hCm) ? FRONT_TEN_TOP_Y : FRONT_TOP_Y;
}
export function frontCxOffset(wCm, hCm) {
  return isTenSquare(wCm, hCm) ? FRONT_TEN_CX : 0;
}
export function backTopY(wCm, hCm) {
  return isTenSquare(wCm, hCm) ? BACK_TEN_TOP_Y : BACK_TOP_Y;
}

// Koreksi tampilan A3 dari user (2026-11-03 sore, kotak merah yang
// digambar di atas tangkapan layar 3D depan + belakang): A3 ukuran
// asli 32x42 mendominasi torso model/foto yang sempit (torso model
// 0,421 m) — tidak seperti proporsi A3 di kaos asli. A3 ditampilkan
// diperkecil dengan skala SERAGAM 0,75x (24x31,5 cm) di kedua
// penampil (3D dan Foto) supaya depan-belakang dan antar-tampilan
// selalu sama. Skala harus seragam: versi awal memakai lebar 0,75x
// dan tinggi 0,90x (24x38, mengikuti kotak gambar user apa adanya),
// tetapi rasio 24:38 tidak sama dengan rasio A3 32:42 sehingga
// desain tampil tertarik/stretch (dilaporkan user 3 Nov 2026 sore).
// Ini murni skala tampilan masking/pratinjau: ukuran jual, nama,
// dan harga tetap "A3 32x42" dari lib/config + lib/pricing.
export function renderCm(wCm, hCm) {
  if (wCm === 32 && hCm === 42) return { w: 24, h: 31.5 };
  return { w: wCm || 0, h: hCm || 0 };
}
