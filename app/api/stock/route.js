// API stok foto gratis (Pexels + Pixabay) untuk panel Gambar di Studio DIY.
// Kunci API dibaca dari environment server (BUKAN NEXT_PUBLIC, tidak
// pernah dikirim ke browser):
//   PEXELS_API_KEY, PIXABAY_API_KEY  — daftar gratis di pexels.com/api
//   dan pixabay.com/api, isi di .env.local / Environment Variables Vercel.
// Tanpa kunci: { configured: false } dan UI menampilkan petunjuk.
//
// GET /api/stock?q=kopi        -> { configured, results: [{id, thumb, full, alt, credit, source}] }
// GET /api/stock?img=<url>     -> proxy gambar (host dibatasi) supaya
//                                 kanvas editor tidak kena blokir CORS.

const IMAGE_HOSTS = ["images.pexels.com", "cdn.pixabay.com", "pixabay.com"];

async function searchPexels(q, key) {
  const url =
    "https://api.pexels.com/v1/search?per_page=12&orientation=any&query=" +
    encodeURIComponent(q);
  const r = await fetch(url, { headers: { Authorization: key } });
  if (!r.ok) throw new Error("Pexels " + r.status);
  const data = await r.json();
  return (data.photos || []).map((p) => ({
    id: "pexels-" + p.id,
    thumb: p.src?.medium || p.src?.small,
    full: p.src?.large || p.src?.original,
    alt: p.alt || "Pexels photo",
    credit: p.photographer || "Pexels",
    source: "Pexels",
  }));
}

async function searchPixabay(q, key) {
  const url =
    "https://pixabay.com/api/?image_type=photo&per_page=12&safesearch=true&key=" +
    encodeURIComponent(key) +
    "&q=" +
    encodeURIComponent(q);
  const r = await fetch(url);
  if (!r.ok) throw new Error("Pixabay " + r.status);
  const data = await r.json();
  return (data.hits || []).map((p) => ({
    id: "pixabay-" + p.id,
    thumb: p.webformatURL,
    full: p.largeImageURL || p.webformatURL,
    alt: p.tags || "Pixabay photo",
    credit: p.user || "Pixabay",
    source: "Pixabay",
  }));
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const img = params.get("img");
  if (img) {
    let target;
    try {
      target = new URL(img);
    } catch {
      return Response.json({ error: "URL gambar tidak valid." }, { status: 400 });
    }
    if (
      target.protocol !== "https:" ||
      !IMAGE_HOSTS.includes(target.hostname)
    ) {
      return Response.json({ error: "Host gambar tidak diizinkan." }, { status: 400 });
    }
    try {
      const r = await fetch(target.toString());
      if (!r.ok) throw new Error("upstream " + r.status);
      const buf = await r.arrayBuffer();
      return new Response(buf, {
        headers: {
          "Content-Type": r.headers.get("content-type") || "image/jpeg",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (e) {
      return Response.json({ error: "Gambar stok tidak dapat diambil." }, { status: 502 });
    }
  }
  const q = (params.get("q") || "").trim().slice(0, 80);
  const pexelsKey = process.env.PEXELS_API_KEY || "";
  const pixabayKey = process.env.PIXABAY_API_KEY || "";
  const configured = Boolean(pexelsKey || pixabayKey);
  if (!configured) return Response.json({ configured: false, results: [] });
  if (q.length < 2)
    return Response.json({ configured: true, results: [] });
  const jobs = [];
  if (pexelsKey) jobs.push(searchPexels(q, pexelsKey).catch(() => []));
  if (pixabayKey) jobs.push(searchPixabay(q, pixabayKey).catch(() => []));
  const parts = await Promise.all(jobs);
  // Selang-seling hasil dari dua sumber supaya grid terasa beragam.
  const results = [];
  const max = Math.max(...parts.map((p) => p.length), 0);
  for (let i = 0; i < max; i++)
    for (const part of parts) if (part[i]) results.push(part[i]);
  return Response.json({ configured: true, results: results.slice(0, 18) });
}
