"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crosshair,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  CircleHelp,
  ClipboardList,
  Download,
  Expand,
  FolderOpen,
  Home,
  Images,
  Languages,
  Layers3,
  Save,
  Shirt,
  Shapes,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import MockupCanvas from "./MockupCanvas";
import ShirtViewer3D from "./ShirtViewer3D";
import StudioTools from "./StudioTools";
import PricingPanel from "./PricingPanel";
import HomePanel from "./HomePanel";
import { orientedDimensions } from "../lib/pricing";
import OrderDashboard from "./OrderDashboard";
import CartPanel from "./CartPanel";
import TrackingPanel from "./TrackingPanel";
import {
  artworkDataURL,
  buildCartOrder,
  readOrders,
  writeOrders,
  orderStatuses,
} from "../lib/orders";
import { newCartItemId, readCart, writeCart } from "../lib/cart";
import { translate } from "../lib/i18n";
import { config, formatRupiah, sampleBriefs } from "../lib/config";

const studioTools = [
  { id: "ai", labelKey: "toolAi", icon: Sparkles },
  { id: "upload", labelKey: "toolUpload", icon: Upload },
  { id: "font", labelKey: "toolFont", icon: Type },
  { id: "elemen", labelKey: "toolElemen", icon: Shapes },
  { id: "image", labelKey: "toolImage", icon: Images },
];
const SAVE_KEY = "sablonai.savedDesign.v1";
// Desain bawaan saat Studio pertama dibuka (permintaan user
// 3 Nov 2026): placeholder "YOUR DESIGN HERE" dari file yang user
// taruh di public/assets — menggantikan contoh Gowes sebagai
// tampilan awal; contoh brief tetap bisa dipilih dari tab AI.
const DEFAULT_DESIGN = {
  id: "your-design-here",
  title: "Your Design Here",
  category: "DEFAULT",
  brief: "",
  image: "/assets/your-design-here.png",
  prompt: "",
  demo: true,
};
const IDENTITY_TF = { dx: 0, dy: 0, scale: 1, rot: 0 };
const clampTf = (v, min, max) => Math.min(max, Math.max(min, v));
const normRot = (deg) => {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return Math.round(d * 10) / 10;
};

// Pratinjau desain melayang DI ATAS mockup (revisi user 2 Nov 2026:
// kotak tombol di kiri mockup dihilangkan; preview menimpa/overlap
// area mockup). Pengeditan posisi memakai frame seret di mockup 2D
// dan toolbar tipis melayang di bawah panggung (StageTools).
function DesignOverlay({ tr, side, artwork }) {
  return (
    <div className="design-overlay">
      <div className="design-overlay-label">
        {tr("designBoxTitle")} · {tr(side === "front" ? "viewFront" : "viewBack")}
      </div>
      <div className="design-overlay-preview">
        {artwork ? (
          <img src={artwork} alt="" />
        ) : (
          <p className="small-note">{tr("designEmpty")}</p>
        )}
      </div>
    </div>
  );
}

// Toolbar edit melayang di bawah panggung: perbesar/perkecil/putar/
// reset — bekerja di tampilan 2D maupun 3D (geser via frame di 2D).
function StageTools({ tr, transform, onPatch, onReset }) {
  const tf = transform || IDENTITY_TF;
  return (
    <div className="stage-tools-float">
      <button type="button" className="db-btn" title={tr("actZoomOut")} aria-label={tr("actZoomOut")} onClick={() => onPatch({ scale: clampTf(tf.scale / 1.12, 0.2, 2.5) })}>
        <Minus size={15} />
      </button>
      <button type="button" className="db-btn" title={tr("actZoomIn")} aria-label={tr("actZoomIn")} onClick={() => onPatch({ scale: clampTf(tf.scale * 1.12, 0.2, 2.5) })}>
        <Plus size={15} />
      </button>
      <button type="button" className="db-btn" title={tr("actRotateLeft")} aria-label={tr("actRotateLeft")} onClick={() => onPatch({ rot: normRot(tf.rot - 15) })}>
        <RotateCcw size={15} />
      </button>
      <button type="button" className="db-btn" title={tr("actRotateRight")} aria-label={tr("actRotateRight")} onClick={() => onPatch({ rot: normRot(tf.rot + 15) })}>
        <RotateCw size={15} />
      </button>
      <button type="button" className="db-btn" title={tr("editReset")} aria-label={tr("editReset")} onClick={onReset}>
        <Crosshair size={14} />
      </button>
    </div>
  );
}

// Frame edit di atas mockup 2D: seret untuk memindah, gagang sudut
// untuk skala, gagang atas untuk memutar. Koordinat dihitung dari
// geometri area cetak yang dilaporkan MockupCanvas (getGeometry).
function MockupFrame({ geometry, artwork, transform, onChange }) {
  const rootRef = useRef(null);
  const [box, setBox] = useState(null);
  const [artSize, setArtSize] = useState(null);
  const tf = transform || IDENTITY_TF;
  useEffect(() => {
    if (!artwork) {
      setArtSize(null);
      return;
    }
    let alive = true;
    const img = new Image();
    img.onload = () => {
      // Simpan juga src-nya: ukuran gambar lama tidak boleh dipakai
      // untuk desain baru (penyebab frame "bergeser" versi sebelumnya).
      if (alive) setArtSize({ src: artwork, w: img.width, h: img.height });
    };
    img.src = artwork;
    return () => {
      alive = false;
    };
  }, [artwork]);
  useEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      const holder = root ? root.parentElement : null;
      const canvasEl = holder ? holder.querySelector("canvas.mockup-canvas") : null;
      const geo = geometry;
      if (!root || !holder || !canvasEl || !geo) {
        setBox(null);
        return;
      }
      const cr = canvasEl.getBoundingClientRect();
      const wr = holder.getBoundingClientRect();
      if (cr.width < 10) {
        setBox(null);
        return;
      }
      const k = cr.width / 800;
      // Utamakan rect gambar TERLIHAT yang dilaporkan MockupCanvas
      // (margin transparan sudah dipotong di sana); fallback ke fit
      // ukuran file penuh untuk geometri lama tanpa rect art.
      let dw, dh;
      if (geo.art) {
        dw = geo.art.w * (tf.scale || 1);
        dh = geo.art.h * (tf.scale || 1);
      } else if (artSize && artSize.src === artwork) {
        const fit = Math.min(geo.pw / artSize.w, geo.ph / artSize.h);
        dw = artSize.w * fit * (tf.scale || 1);
        dh = artSize.h * fit * (tf.scale || 1);
      } else {
        setBox(null);
        return;
      }
      const cx = geo.px + geo.pw / 2 + (tf.dx || 0) * geo.pw;
      const cy = geo.py + geo.ph / 2 + (tf.dy || 0) * geo.ph;
      setBox({
        left: cr.left - wr.left + (cx - dw / 2) * k,
        top: cr.top - wr.top + (cy - dh / 2) * k,
        w: dw * k,
        h: dh * k,
        k,
        geo,
      });
    };
    measure();
    const holder = rootRef.current ? rootRef.current.parentElement : null;
    const ro = holder && window.ResizeObserver ? new ResizeObserver(measure) : null;
    if (ro && holder) ro.observe(holder);
    return () => {
      if (ro) ro.disconnect();
    };
  }, [artwork, artSize, tf, geometry]);
  if (!box) return <div ref={rootRef} className="mockup-frame-root" />;
  const startDrag = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX,
      startY = e.clientY;
    const start = { ...tf };
    const holder = rootRef.current.parentElement;
    const wr = holder.getBoundingClientRect();
    const ccx = wr.left + box.left + box.w / 2;
    const ccy = wr.top + box.top + box.h / 2;
    const d0 = Math.max(
      8,
      Math.hypot(startX - ccx, startY - ccy),
    );
    const a0 = Math.atan2(startY - ccy, startX - ccx);
    const move = (ev) => {
      if (mode === "move") {
        onChange({
          ...start,
          dx: clampTf(start.dx + (ev.clientX - startX) / box.k / box.geo.pw, -0.6, 0.6),
          dy: clampTf(start.dy + (ev.clientY - startY) / box.k / box.geo.ph, -0.6, 0.6),
        });
      } else if (mode === "scale") {
        const d1 = Math.hypot(ev.clientX - ccx, ev.clientY - ccy);
        onChange({ ...start, scale: clampTf((start.scale * d1) / d0, 0.2, 2.5) });
      } else if (mode === "rotate") {
        const a1 = Math.atan2(ev.clientY - ccy, ev.clientX - ccx);
        onChange({ ...start, rot: normRot(start.rot + ((a1 - a0) * 180) / Math.PI) });
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div ref={rootRef} className="mockup-frame-root">
      <div
        className="design-frame"
        style={{
          left: box.left,
          top: box.top,
          width: box.w,
          height: box.h,
          transform: `rotate(${tf.rot || 0}deg)`,
        }}
        onPointerDown={(e) => startDrag(e, "move")}
      >
        <span
          className="frame-rotate"
          onPointerDown={(e) => startDrag(e, "rotate")}
        />
        <span
          className="frame-handle"
          onPointerDown={(e) => startDrag(e, "scale")}
        />
      </div>
    </div>
  );
}

export default function SablonApp() {
  const [tab, setTab] = useState("beranda");
  // Dark mode dihilangkan (permintaan user Nov 2026): tema selalu
  // terang palet hijau-terracotta; yang tersisa hanya pilihan bahasa.
  const [lang, setLang] = useState("id");
  const tr = (key, vars) => translate(lang, key, vars);
  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.removeItem("sablonai.theme");
      if (localStorage.getItem("sablonai.lang") === "en") setLang("en");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "id";
    try {
      localStorage.setItem("sablonai.lang", lang);
    } catch {}
  }, [lang]);
  const [color, setColor] = useState(config.colors[0]);
  const [productId, setProductId] = useState("kaos-pendek");
  const [size, setSize] = useState("L");
  const [frontPrintId, setFrontPrintId] = useState("A4");
  const [backPrintId, setBackPrintId] = useState(null);
  const [frontOrientation, setFrontOrientation] = useState("portrait");
  const [backOrientation, setBackOrientation] = useState("portrait");
  const frontPrint =
    config.printSizes.find((p) => p.id === frontPrintId) ||
    config.printSizes[3];
  // Panduan masking 2026-11-03: A3 (32x42) hanya potret, tanpa
  // orientasi lanskap — paksa potret walau state/desain tersimpan
  // masih menyebut lanskap.
  const frontOrientationEff =
    frontPrint.id === "A3" ? "portrait" : frontOrientation;
  const frontDims = orientedDimensions(frontPrint, frontOrientationEff) || {
    wCm: frontPrint.wCm,
    hCm: frontPrint.hCm,
  };
  const frontIsLandscape =
    frontOrientationEff === "landscape" && frontPrint.wCm !== frontPrint.hCm;
  const backPrint = backPrintId
    ? config.printSizes.find((p) => p.id === backPrintId) || null
    : null;
  const backOrientationEff =
    backPrint && backPrint.id === "A3" ? "portrait" : backOrientation;
  const backDims = backPrint
    ? orientedDimensions(backPrint, backOrientationEff) || {
        wCm: backPrint.wCm,
        hCm: backPrint.hCm,
      }
    : null;
  const backIsLandscape = Boolean(
    backPrint && backOrientationEff === "landscape" && backPrint.wCm !== backPrint.hCm,
  );
  const [designsBySide, setDesignsBySide] = useState({
    front: { ...DEFAULT_DESIGN },
    back: null,
  });
  // Studio DIY 1 layar (Nov 2026): tool aktif di rail kiri studio dan
  // tampilan panggung — "canvas" (kanvas fabric), "2d" (mockup foto),
  // "3d" (viewer 3D). Ketiganya berbagi state desain yang sama.
  const [tool, setTool] = useState("ai");
  // 3D jadi tampilan utama Studio (keputusan user 3 Nov 2026); mockup
  // 2D tetap ada sebagai tab "Foto". Masking + geser desain kini bisa
  // langsung di 3D lewat mode Atur desain (edit3d) untuk sisi aktif.
  const [view, setView] = useState("3d");
  const [edit3d, setEdit3d] = useState(false);
  const [side2d, setSide2d] = useState("front");
  const [showArea, setShowArea] = useState(true),
    [help, setHelp] = useState(false),
    [full, setFull] = useState(false);
  const [mode, setMode] = useState(config.demoMode ? "demo" : "live");
  const design = designsBySide.front;
  const sideDesign = (side) => designsBySide[side] || designsBySide.front;
  const sideArtwork = (side) => sideDesign(side).image;
  // Posisi desain di mockup per sisi (revisi user Nov 2026): dx/dy
  // fraksi area cetak, scale pengali ukuran pas, rot derajat.
  const [transformsBySide, setTransformsBySide] = useState({
    front: { ...IDENTITY_TF },
    back: { ...IDENTITY_TF },
  });
  const tfOf = (side) => transformsBySide[side] || IDENTITY_TF;
  // Geometri area cetak persis dari render terakhir MockupCanvas —
  // dasar frame edit (menggantikan polling getGeometry yang bisa
  // memakai geometri basi sesaat setelah ukuran/orientasi berubah).
  const [mockGeom, setMockGeom] = useState(null);
  const handleGeom = useCallback(
    (g) =>
      setMockGeom((prev) =>
        prev && prev.px === g.px && prev.py === g.py && prev.pw === g.pw && prev.ph === g.ph
          ? prev
          : g,
      ),
    [],
  );
  const patchTransform = (patch) =>
    setTransformsBySide((prev) => ({
      ...prev,
      [side2d]: { ...(prev[side2d] || IDENTITY_TF), ...patch },
    }));
  const setTransform = (next) =>
    setTransformsBySide((prev) => ({ ...prev, [side2d]: next }));
  const [editorOpened, setEditorOpened] = useState(false);
  useEffect(() => {
    if (tab === "studio") setEditorOpened(true);
  }, [tab]);
  const updateDesign = (d) => {
    setDesignsBySide((prev) => ({ ...prev, [side2d]: d }));
    setTransformsBySide((prev) => ({ ...prev, [side2d]: { ...IDENTITY_TF } }));
  };
  const mockup = useRef(null);
  const choose = (s) => {
    updateDesign({ ...s, demo: true });
  };
  const chooseTool = (id) => {
    setTool(id);
  };
  const [studioMsg, setStudioMsg] = useState("");
  const studioMsgTimer = useRef(null);
  const flashStudio = (msg) => {
    setStudioMsg(msg);
    clearTimeout(studioMsgTimer.current);
    studioMsgTimer.current = setTimeout(() => setStudioMsg(""), 3500);
  };
  function saveDesign() {
    try {
      const data = {
        v: 1,
        savedAt: new Date().toISOString(),
        tool,
        side2d,
        colorName: color.name,
        productId,
        size,
        frontPrintId,
        backPrintId,
        frontOrientation,
        backOrientation,
        designsBySide,
        transformsBySide,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      flashStudio(tr("msgDesignSaved"));
    } catch {
      flashStudio(tr("errSaveFailed"));
    }
  }
  function openSaved() {
    let raw = null;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch {}
    if (!raw) {
      flashStudio(tr("msgNoSaved"));
      return;
    }
    try {
      const d = JSON.parse(raw);
      const c = config.colors.find((x) => x.name === d.colorName);
      if (c) setColor(c);
      if (d.productId) setProductId(d.productId);
      if (d.size) setSize(d.size);
      setFrontPrintId(d.frontPrintId ?? "A4");
      setBackPrintId(d.backPrintId ?? null);
      if (d.frontOrientation) setFrontOrientation(d.frontOrientation);
      if (d.backOrientation) setBackOrientation(d.backOrientation);
      if (d.designsBySide) setDesignsBySide(d.designsBySide);
      if (d.transformsBySide) setTransformsBySide(d.transformsBySide);
      if (d.tool) setTool(d.tool);
      setSide2d(d.side2d || "front");
      flashStudio(tr("msgDesignRestored"));
    } catch {
      flashStudio(tr("msgNoSaved"));
    }
  }
  function downloadMockup() {
    let url = null;
    let name = "sablonai-mockup.jpg";
    if (view === "2d") {
      url = mockup.current?.export();
      name = "sablonai-mockup-" + side2d + ".jpg";
    } else {
      url = sideArtwork(side2d);
      name = "sablonai-desain.png";
    }
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }
  const [orders, setOrders] = useState([]),
    [storageError, setStorageError] = useState("");
  useEffect(() => {
    const sync = () => {
      try {
        setOrders(readOrders(localStorage));
        setStorageError("");
      } catch (e) {
        setStorageError(e.message);
      }
    };
    sync();
    window.addEventListener("storage", sync);
    const escape = (e) => {
      if (e.key === "Escape") {
        setHelp(false);
        setFull(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  function changeProduct(nextProductId) {
    setProductId(nextProductId);
    const nextProduct = config.products.find((p) => p.id === nextProductId);
    if (nextProduct && !nextProduct.sizes.includes(size)) {
      setSize(nextProduct.sizes[0]);
    }
  }
  async function createOrder(details) {
    if (storageError) throw new Error(storageError);
    const preview = mockup.current?.export();
    if (!preview)
      throw new Error(
        "Mockup sedang diperbarui. Tunggu sebentar lalu simpan kembali.",
      );
    const safeArt = async (src) => {
      try {
        return await artworkDataURL(src);
      } catch {
        return null;
      }
    };
    const artwork = await safeArt(sideArtwork("front"));
    const backArtwork = backPrintId ? await safeArt(sideArtwork("back")) : null;
    const order = {
      ...details,
      id:
        "SA-" +
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        })
          .format(new Date())
          .replaceAll("-", "") +
        "-" +
        crypto.randomUUID().slice(0, 6).toUpperCase(),
      createdAt: new Date().toISOString(),
      status: "Diproses",
      color,
      preview,
      artwork,
      backArtwork,
      source: tool === "ai" ? "generate" : "editor",
      pricingIsExample: config.pricingIsExample,
      design: {
        title: design.title,
        brief: design.brief || "",
        prompt: design.prompt || "",
        demo: design.demo !== false,
        trace: design.trace || null,
      },
      editorJSON: null,
      editorSide: null,
      transforms: transformsBySide,
    };
    const next = [order, ...readOrders(localStorage)];
    writeOrders(localStorage, next);
    setOrders(next);
    return order;
  }
  async function saveExternalOrder(order) {
    if (storageError) throw new Error(storageError);
    const next = [order, ...readOrders(localStorage)];
    writeOrders(localStorage, next);
    setOrders(next);
    return order;
  }
  // Keranjang: item dari Koleksi kaos & Studio DIY, disimpan lokal.
  const [cart, setCart] = useState([]);
  useEffect(() => {
    setCart(readCart(localStorage));
  }, []);
  function commitCart(next) {
    setCart(next);
    writeCart(localStorage, next);
  }
  const [appToast, setAppToast] = useState("");
  const appToastTimer = useRef(null);
  function flashApp(msg) {
    setAppToast(msg);
    clearTimeout(appToastTimer.current);
    appToastTimer.current = setTimeout(() => setAppToast(""), 2600);
  }
  function addToCart(partial) {
    const item = {
      id: newCartItemId(),
      title: partial.title || "",
      productId: partial.productId || "kaos-pendek",
      size: partial.size || "L",
      colorName: partial.colorName || config.colors[0].name,
      frontPrintId: partial.frontPrintId ?? "A4",
      backPrintId: partial.backPrintId ?? null,
      frontOrientation: partial.frontOrientation || "portrait",
      backOrientation: partial.backOrientation || "portrait",
      quantity: partial.quantity || 1,
      artwork: partial.artwork || null,
      backArtwork: partial.backArtwork || null,
      designTitle: partial.designTitle || partial.title || "",
    };
    commitCart([item, ...cart]);
    flashApp(tr("cartAdded"));
  }
  function addStudioToCart(qty) {
    const product = config.products.find((p) => p.id === productId);
    addToCart({
      title: design.title || (product ? product.name : ""),
      productId,
      size,
      colorName: color.name,
      frontPrintId,
      backPrintId,
      frontOrientation,
      backOrientation,
      quantity: qty || 1,
      artwork: frontPrintId ? sideArtwork("front") : null,
      backArtwork: backPrintId ? sideArtwork("back") : null,
      designTitle: design.title,
    });
  }
  async function checkoutCart({ customer, phone }) {
    if (storageError) throw new Error(storageError);
    if (!cart.length) throw new Error(tr("cartEmpty"));
    const built = [];
    for (const item of cart) {
      let art = null;
      let backArt = null;
      try {
        if (item.artwork) art = await artworkDataURL(item.artwork);
      } catch {}
      try {
        if (item.backArtwork) backArt = await artworkDataURL(item.backArtwork);
      } catch {}
      built.push(
        buildCartOrder({ customer, phone, item, artwork: art, backArtwork: backArt }),
      );
    }
    const next = [...built, ...readOrders(localStorage)];
    writeOrders(localStorage, next);
    setOrders(next);
    const totalAll = built.reduce((sum, o) => sum + o.quote.total, 0);
    const lines = built.map(
      (o) =>
        "• " +
        o.design.title +
        " — " +
        o.product +
        " " +
        o.size +
        " " +
        (o.color && o.color.name ? o.color.name : "") +
        " ×" +
        o.quantity +
        " — " +
        formatRupiah(o.quote.total),
    );
    const text =
      "Halo SablonAI, saya " +
      customer +
      " mau pesan:\n" +
      lines.join("\n") +
      "\nTotal: " +
      formatRupiah(totalAll) +
      "\nID order: " +
      built.map((o) => o.id).join(", ");
    commitCart([]);
    return {
      waLink:
        "https://wa.me/" +
        config.whatsappNumber +
        "?text=" +
        encodeURIComponent(text),
      count: built.length,
    };
  }
  function goCollection() {
    setTab("beranda");
    setTimeout(() => {
      const el = document.getElementById("koleksi");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 90);
  }
  async function changeStatus(id, status) {
    if (!orderStatuses.includes(status)) throw new Error("Status tidak valid.");
    const next = readOrders(localStorage).map((o) =>
      o.id === id ? { ...o, status } : o,
    );
    writeOrders(localStorage, next);
    setOrders(next);
  }
  return (
    <div className="app-shell">
      <div className="workspace">
        <header className="topbar">
          <a href="/" className="brand-lockup" aria-label={tr("homeLabel")}>
            <span className="logo-mark">
              <Layers3 size={24} />
            </span>
            <span className="wordmark">
              sablon<span>ai</span>
              <i />
            </span>
          </a>
          <nav className="main-nav" aria-label={tr("studioNavHome")}>
            <button
              type="button"
              className={tab === "beranda" ? "nav-link active" : "nav-link"}
              onClick={() => setTab("beranda")}
            >
              <Home size={16} /> {tr("tabHome")}
            </button>
            <button
              type="button"
              className={tab === "studio" ? "nav-link active" : "nav-link"}
              onClick={() => setTab("studio")}
            >
              <SlidersHorizontal size={16} /> {tr("tabStudio")}
            </button>
            <button type="button" className="nav-link" onClick={goCollection}>
              <Shirt size={16} /> {tr("navCollection")}
            </button>
          </nav>
          <div className="top-right">
            <span className="demo-badge">
              <span /> {mode === "demo" ? tr("modeDemo") : tr("modeLive")}
            </span>
            <button
              type="button"
              className={tab === "pesanan" ? "nav-link active" : "nav-link"}
              onClick={() => setTab("pesanan")}
            >
              <ClipboardList size={16} /> {tr("tabOrders")}
            </button>
            <button
              type="button"
              className="nav-icon-btn"
              aria-label={tr("cartTitle")}
              title={tr("cartTitle")}
              onClick={() => setTab("keranjang")}
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="cart-badge">{cart.length}</span>
              )}
            </button>
            <button
              className="pref-button"
              aria-label={tr("langToggle")}
              title={tr("langToggle")}
              onClick={() => setLang(lang === "en" ? "id" : "en")}
            >
              <Languages size={19} />
              <span className="lang-badge">{lang === "en" ? "EN" : "ID"}</span>
            </button>
            <button className="help-button" onClick={() => setHelp(true)}>
              <CircleHelp size={16} /> {tr("help")}
            </button>
          </div>
        </header>
        <main className={tab === "studio" ? "main-studio" : undefined}>
          {tab === "beranda" && (
            <HomePanel
              t={tr}
              onStudio={(toolId) => {
                setTab("studio");
                chooseTool(toolId || "ai");
              }}
              onUseDesign={(s) => {
                choose(s);
                setTab("studio");
                setTool("ai");
                setView("3d");
              }}
              onCustomize={(s) => {
                choose(s);
                setTab("studio");
                setTool("upload");
                setView("canvas");
              }}
              onCollection={goCollection}
              onAddCart={addToCart}
            />
          )}
          {(tab === "studio" || editorOpened) && (
            <div hidden={tab !== "studio"}>
              <div className="studio-heading">
                <div>
                  <span className="eyebrow">{tr("studioEyebrow")}</span>
                  <h2>{tr("studioTitle")}</h2>
                </div>
                <div className="studio-actions">
                  {studioMsg && (
                    <span className="studio-msg" role="status">
                      {studioMsg}
                    </span>
                  )}
                  <button type="button" onClick={saveDesign}>
                    <Save size={14} /> {tr("saveDesign")}
                  </button>
                  <button type="button" onClick={openSaved}>
                    <FolderOpen size={14} /> {tr("openSaved")}
                  </button>
                  <button type="button" onClick={downloadMockup}>
                    <Download size={14} /> {tr("downloadMockup")}
                  </button>
                </div>
              </div>
              <div className="studio-shell">
                <div className="tool-rail" role="group" aria-label={tr("tabStudio")}>
                  {studioTools.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={"tool-rail-btn" + (tool === t.id ? " active" : "")}
                      aria-pressed={tool === t.id}
                      onClick={() => chooseTool(t.id)}
                    >
                      <t.icon size={21} />
                      <span>{tr(t.labelKey)}</span>
                    </button>
                  ))}
                </div>
                {editorOpened && (
                  <StudioTools
                    t={tr}
                    tool={tool}
                    design={sideDesign(side2d)}
                    onSetDesign={updateDesign}
                    mode={mode}
                    onMode={setMode}
                  />
                )}
                <section
                  className={"stage-panel card" + (full ? " fullscreen" : "")}
                >
                  <div className="stage-top">
                    <div>
                      <span className="live-dot" /> {tr("previewTitle")}
                    </div>
                    <div>
                      <button
                        aria-label={tr("showArea")}
                        aria-pressed={showArea}
                        className={showArea ? "icon-button selected" : "icon-button"}
                        onClick={() => setShowArea(!showArea)}
                      >
                        <SlidersHorizontal size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={full ? tr("closeFull") : tr("enlarge")}
                        onClick={() => setFull(!full)}
                      >
                        {full ? <X size={17} /> : <Expand size={17} />}
                      </button>
                    </div>
                  </div>
                  <div className="mockup-stage">
                    {view === "3d" && (
                      <ShirtViewer3D
                        frontTransform={tfOf("front")}
                        backTransform={tfOf("back")}
                        artwork={frontPrintId ? sideArtwork("front") : null}
                        backArtwork={backPrintId ? sideArtwork("back") : null}
                        backWidthCm={backDims ? backDims.wCm : 0}
                        backHeightCm={backDims ? backDims.hCm : 0}
                        frontWidthCm={frontDims.wCm}
                        frontHeightCm={frontDims.hCm}
                        color={color.hex}
                        t={tr}
                        showArea={showArea}
                        editSide={
                          edit3d &&
                          (side2d === "front" ? frontPrintId : backPrintId)
                            ? side2d
                            : null
                        }
                        onDragDesign={(p) => patchTransform(p)}
                      />
                    )}
                    <div className={view === "2d" ? "mockup-live" : "mockup-keeper"}>
                      <MockupCanvas
                        ref={mockup}
                        side={side2d}
                        artwork={(side2d === "front" ? !frontPrintId : !backPrintId) ? null : sideArtwork(side2d)}
                        color={color.hex}
                        printWidth={side2d === "back" && backDims ? backDims.wCm : frontDims.wCm}
                        printHeight={side2d === "back" && backDims ? backDims.hCm : frontDims.hCm}
                        showArea={showArea && (side2d === "front" ? Boolean(frontPrintId) : Boolean(backPrintId))}
                        transform={tfOf(side2d)}
                        onGeometry={handleGeom}
                      />
                      {view === "2d" &&
                        (side2d === "front" ? frontPrintId : backPrintId) && (
                          <MockupFrame
                            geometry={mockGeom}
                            artwork={sideArtwork(side2d)}
                            transform={tfOf(side2d)}
                            onChange={setTransform}
                          />
                        )}
                    </div>
                    {view === "2d" && (
                      <>
                        <div className="print-measure">
                          <span />
                          {side2d === "back"
                            ? backDims
                              ? backDims.wCm + " × " + backDims.hCm + " cm" + (backIsLandscape ? tr("landscapeSuffix") : "")
                              : tr("backPlainNote")
                            : frontPrintId
                              ? frontDims.wCm + " × " + frontDims.hCm + " cm" + (frontIsLandscape ? tr("landscapeSuffix") : "")
                              : tr("noPrint")}
                          <span />
                        </div>
                        <span className="mockup-label">
                          {tr("mockupShop")} •{" "}
                          {design.demo !== false ? tr("artworkDemo") : tr("artworkMeta")}
                        </span>
                      </>
                    )}
                    {(side2d === "front" ? frontPrintId : backPrintId) ? (
                      <div className="stage-left-col">
                        <DesignOverlay
                          tr={tr}
                          side={side2d}
                          artwork={sideArtwork(side2d)}
                        />
                        {sideArtwork(side2d) ? (
                          <StageTools
                            tr={tr}
                            transform={tfOf(side2d)}
                            onPatch={patchTransform}
                            onReset={() => setTransform({ ...IDENTITY_TF })}
                          />
                        ) : null}
                      </div>
                    ) : null}
                    {/* Tata letak panggung revisi user 3 Nov 2026:
                        tombol sisi + Atur desain pindah ke atas-tengah
                        panggung, toggle Foto/3D ke kanan atas. */}
                    <div className="stage-top-center">
                      <div className="view-toggle side-toggle" role="group" aria-label={tr("activeSideLabel")}>
                        <button type="button" className={"seg" + (side2d === "front" ? " on" : "")} onClick={() => setSide2d("front")}>
                          {tr("viewFront")}
                        </button>
                        <button type="button" className={"seg" + (side2d === "back" ? " on" : "")} onClick={() => setSide2d("back")}>
                          {tr("viewBack")}
                        </button>
                      </div>
                      {view === "3d" &&
                        (side2d === "front" ? frontPrintId : backPrintId) && (
                          <div className="view-toggle" role="group" aria-label={tr("editDesign")}>
                            <button
                              type="button"
                              className={"seg" + (edit3d ? " on" : "")}
                              aria-pressed={edit3d}
                              onClick={() => setEdit3d(!edit3d)}
                            >
                              {tr("editDesign")}
                            </button>
                          </div>
                        )}
                    </div>
                    <div className="stage-top-right">
                      <div className="view-toggle" role="group" aria-label={tr("viewModeLabel")}>
                        <button type="button" className={"seg" + (view === "2d" ? " on" : "")} aria-pressed={view === "2d"} onClick={() => { setView("2d"); setEdit3d(false); }}>
                          {tr("viewPhoto")}
                        </button>
                        <button type="button" className={"seg" + (view === "3d" ? " on" : "")} aria-pressed={view === "3d"} onClick={() => setView("3d")}>
                          3D
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
                <div className="stage-bottom">
                  <span className="stage-hint">
                    {view === "3d"
                      ? edit3d
                        ? tr("editDesignHint")
                        : tr("hint3dStage")
                      : tr("stageHintMockup")}
                  </span>
                </div>
                <PricingPanel
                  t={tr}
                  productId={productId}
                  size={size}
                  frontPrintId={frontPrintId}
                  backPrintId={backPrintId}
                  onProduct={changeProduct}
                  onSize={setSize}
                  onFrontPrint={setFrontPrintId}
                  onBackPrint={setBackPrintId}
                  frontOrientation={frontOrientationEff}
                  backOrientation={backOrientationEff}
                  onFrontOrientation={setFrontOrientation}
                  onBackOrientation={setBackOrientation}
                  side={side2d}
                  onSide={setSide2d}
                  color={color}
                  onColor={setColor}
                  onOrder={createOrder}
                  onAddToCart={addStudioToCart}
                  onDashboard={() => setTab("pesanan")}
                />
              </div>
              <p className="side-note studio-side-note">
                {tr("designForSide")}:{" "}
                <strong>{side2d === "front" ? tr("viewFront") : tr("viewBack")}</strong>
              </p>
            </div>
          )}
          {tab === "pesanan" && (
            <div className="orders-page">
              <TrackingPanel orders={orders} t={tr} lang={lang} />
              <OrderDashboard
                t={tr}
                lang={lang}
                orders={orders}
                onStatus={changeStatus}
                onNew={() => setTab("studio")}
                error={storageError}
              />
            </div>
          )}
          {tab === "keranjang" && (
            <CartPanel
              t={tr}
              items={cart}
              onQty={(id, q) =>
                commitCart(
                  cart.map((i) =>
                    i.id === id
                      ? { ...i, quantity: Math.min(100, Math.max(1, q)) }
                      : i,
                  ),
                )
              }
              onRemove={(id) => commitCart(cart.filter((i) => i.id !== id))}
              onCheckout={checkoutCart}
              onStudio={() => setTab("studio")}
              onCollection={goCollection}
              onOrders={() => setTab("pesanan")}
            />
          )}
          <footer>
            <span>
              © 2026 SablonAI <span className="footer-dot">•</span>{" "}
              {tr("footerLeft")}
            </span>
            <span>
              Build for Your World <span className="footer-dot">/</span> Meta AI
              Hackathon
            </span>
          </footer>
        </main>
      </div>
      {appToast && (
        <div className="app-toast" role="status">
          {appToast}
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal icon-button"
              autoFocus
              aria-label={tr("closeGuide")}
              onClick={() => setHelp(false)}
            >
              <X />
            </button>
            <div className="eyebrow">{tr("helpEyebrow")}</div>
            <h2 id="help-title">{tr("helpTitle")}</h2>
            <ol>
              <li>{tr("helpStep1")}</li>
              <li>{tr("helpStep2")}</li>
              <li>{tr("helpStep3")}</li>
              <li>{tr("helpStep4")}</li>
            </ol>
            <p className="notice">{tr("helpNotice")}</p>
            <button className="primary" onClick={() => setHelp(false)}>
              {tr("helpStart")} <ArrowRight size={17} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
