// Kotak gambar yang TERLIHAT dari sebuah karya (desain), dihitung dari
// kanal alfa: banyak file desain punya margin transparan besar di
// sekeliling gambar (contoh design-gowes.png 800x900, gambar terlihat
// hanya 590x699). Kalau margin itu ikut diukur, ukuran sablon yang
// dipilih pelanggan tidak jujur (A4 terisi gambar terlihat jauh lebih
// kecil) dan frame edit melayang mengelilingi ruang kosong.
// Fungsi ini memindai alfa sekali per src (di-cache), lalu semua
// permukaan (mockup 2D, frame edit, tekstur 3D depan, decal belakang)
// menggambar dari kotak ini supaya konsisten.
const cache = new Map();

export function artworkBox(img) {
  const w = (img && (img.naturalWidth || img.width)) || 0;
  const h = (img && (img.naturalHeight || img.height)) || 0;
  const full = { x: 0, y: 0, w, h };
  if (!img || !w || !h) return full;
  const key = img.src || "";
  if (key && cache.has(key)) return cache.get(key);
  let box = full;
  try {
    const MAX = 512;
    const s = Math.min(1, MAX / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * s));
    const ch = Math.max(1, Math.round(h * s));
    const cv = document.createElement("canvas");
    cv.width = cw;
    cv.height = ch;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    cx.drawImage(img, 0, 0, cw, ch);
    const d = cx.getImageData(0, 0, cw, ch).data;
    let minX = cw,
      minY = ch,
      maxX = -1,
      maxY = -1;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (d[(y * cw + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX >= minX && maxY >= minY) {
      box = {
        x: minX / s,
        y: minY / s,
        w: (maxX - minX + 1) / s,
        h: (maxY - minY + 1) / s,
      };
    }
  } catch {
    // Gambar tanpa alfa / kanvas terlarang (CORS): pakai kotak penuh.
    box = full;
  }
  if (key) cache.set(key, box);
  return box;
}
