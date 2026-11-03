// Penyimpanan desain Studio (tombol Save/Open) memakai IndexedDB,
// bukan localStorage: gambar desain hasil generate AI berupa data URL
// PNG 1600x1600 bisa beberapa MB per sisi, sehingga total JSON mudah
// melewati kuota localStorage (~5 MB) dan Save gagal dengan pesan
// "image is too large to store". Kuota IndexedDB jauh lebih besar.
// Data lama di localStorage (kunci sablonai.savedDesign.v1) tetap
// dibaca sebagai cadangan supaya simpanan lama tidak hilang.

const DB_NAME = "sablonai-db";
const STORE_NAME = "kv";
const DESIGN_KEY = "savedDesign.v1";
const LEGACY_KEY = "sablonai.savedDesign.v1";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(value) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, DESIGN_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function idbGet() {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = db
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(DESIGN_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function saveDesignData(data) {
  await idbPut(data);
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}

export async function loadDesignData() {
  try {
    const value = await idbGet();
    if (value) return value;
  } catch {}
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
