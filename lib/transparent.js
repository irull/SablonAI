import sharp from "sharp";

// Latar hasil generate Muse Image hampir selalu putih polos (model gambar
// tidak mengeluarkan alpha asli). Fungsi ini mengubah latar putih yang
// MENYENTUH TEPI gambar menjadi transparan memakai flood fill dari tepi,
// jadi bagian putih di DALAM desain (bulu putih, gigi, mata, dsb.) yang
// tidak terhubung ke tepi tetap utuh — beda dari filter hapus-putih demo
// lama yang menghapus semua piksel putih di mana pun.
//
// Mengembalikan Buffer PNG baru. Bila gambar tidak berlatar terang atau
// proses gagal, buffer asli dikembalikan apa adanya (generate tidak boleh
// gagal hanya karena langkah ini).
const HARD = 242; // min(r,g,b) >= ini -> pasti latar, alpha 0
const SOFT = 198; // min(r,g,b) <= ini -> pasti bukan latar

export async function whiteToTransparent(input) {
  try {
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width: w, height: h, channels } = info;
    if (!w || !h || channels !== 4) return input;
    const n = w * h;
    const minC = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      minC[i] = Math.min(data[o], data[o + 1], data[o + 2]);
    }
    // Calon latar: piksel terang. Flood fill 4-arah dari semua piksel tepi.
    const isBg = new Uint8Array(n);
    const stack = [];
    const seed = (i) => {
      if (!isBg[i] && minC[i] > SOFT) {
        isBg[i] = 1;
        stack.push(i);
      }
    };
    for (let x = 0; x < w; x++) {
      seed(x);
      seed((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      seed(y * w);
      seed(y * w + w - 1);
    }
    // Latar harus dominan; kalau tidak ada latar terang menyentuh tepi,
    // gambar dikembalikan apa adanya.
    let seeds = 0;
    for (let i = 0; i < n; i++) seeds += isBg[i];
    if (seeds === 0) return input;
    while (stack.length) {
      const i = stack.pop();
      const x = i % w;
      if (x > 0) seed(i - 1);
      if (x < w - 1) seed(i + 1);
      if (i >= w) seed(i - w);
      if (i < n - w) seed(i + w);
    }
    let bgCount = 0;
    for (let i = 0; i < n; i++) bgCount += isBg[i];
    if (bgCount < n * 0.02) return input; // latar terlalu kecil: abaikan
    // Terapkan alpha dengan tepi lembut di pita SOFT..HARD.
    const span = HARD - SOFT;
    for (let i = 0; i < n; i++) {
      if (!isBg[i]) continue;
      const o = i * 4;
      const m = minC[i];
      const keep = m >= HARD ? 0 : (HARD - m) / span;
      data[o + 3] = Math.round(data[o + 3] * Math.max(0, Math.min(1, keep)));
    }
    return await sharp(data, {
      raw: { width: w, height: h, channels: 4 },
    })
      .png()
      .toBuffer();
  } catch {
    return input;
  }
}
