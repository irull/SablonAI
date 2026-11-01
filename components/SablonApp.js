"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
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
import EditorCanvas from "./EditorCanvas";
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
  const frontDims = orientedDimensions(frontPrint, frontOrientation) || {
    wCm: frontPrint.wCm,
    hCm: frontPrint.hCm,
  };
  const frontIsLandscape =
    frontOrientation === "landscape" && frontPrint.wCm !== frontPrint.hCm;
  const backPrint = backPrintId
    ? config.printSizes.find((p) => p.id === backPrintId) || null
    : null;
  const backDims = backPrint
    ? orientedDimensions(backPrint, backOrientation) || {
        wCm: backPrint.wCm,
        hCm: backPrint.hCm,
      }
    : null;
  const backIsLandscape = Boolean(
    backPrint && backOrientation === "landscape" && backPrint.wCm !== backPrint.hCm,
  );
  const [designsBySide, setDesignsBySide] = useState({
    front: { ...sampleBriefs[0], demo: true },
    back: null,
  });
  // Studio DIY 1 layar (Nov 2026): tool aktif di rail kiri studio dan
  // tampilan panggung — "canvas" (kanvas fabric), "2d" (mockup foto),
  // "3d" (viewer 3D). Ketiganya berbagi state desain yang sama.
  const [tool, setTool] = useState("ai");
  const [view, setView] = useState("2d");
  const [side2d, setSide2d] = useState("front");
  const [showArea, setShowArea] = useState(true),
    [help, setHelp] = useState(false),
    [full, setFull] = useState(false);
  const [mode, setMode] = useState(config.demoMode ? "demo" : "live");
  const [editedBySide, setEditedBySide] = useState({ front: null, back: null });
  const design = designsBySide.front;
  const sideDesign = (side) => designsBySide[side] || designsBySide.front;
  const sideArtwork = (side) => editedBySide[side] || sideDesign(side).image;
  const [editorOpened, setEditorOpened] = useState(false);
  useEffect(() => {
    if (tab === "studio") setEditorOpened(true);
  }, [tab]);
  const editor = useRef(null);
  const updateDesign = (d) => {
    setDesignsBySide((prev) => ({ ...prev, [side2d]: d }));
    setEditedBySide((prev) => ({ ...prev, [side2d]: null }));
  };
  const mockup = useRef(null);
  const choose = (s) => {
    updateDesign({ ...s, demo: true });
  };
  const chooseTool = (id) => {
    setTool(id);
    setView(id === "ai" ? "2d" : "canvas");
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
        editedBySide,
        editorJSON: editor.current?.exportJSON() || null,
        editorSide: side2d,
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
      if (d.editedBySide) setEditedBySide(d.editedBySide);
      if (d.tool) setTool(d.tool);
      setSide2d(d.editorSide || d.side2d || "front");
      if (d.editorJSON)
        setTimeout(() => {
          editor.current?.loadJSON(d.editorJSON);
        }, 450);
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
    } else if (view === "canvas") {
      url = editor.current?.exportPNG();
      name = "sablonai-desain.png";
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
    const inStudio = tab === "studio";
    const fromEditor = inStudio && tool !== "ai";
    if (fromEditor && !editor.current?.exportJSON()?.objects?.length)
      throw new Error("Tambahkan gambar atau teks sebelum membuat order.");
    const editorArtwork = fromEditor ? editor.current?.exportPNG() : null;
    if (fromEditor && (!editorArtwork || editorArtwork !== editedBySide[side2d]))
      throw new Error(
        "Editor sedang memperbarui desain. Tunggu sebentar lalu simpan kembali.",
      );
    const preview = mockup.current?.export();
    if (!preview)
      throw new Error(
        "Mockup sedang diperbarui. Tunggu sebentar lalu simpan kembali.",
      );
    const artwork = await artworkDataURL(
      fromEditor && side2d === "front" ? editorArtwork : sideArtwork("front"),
    );
    const backArtwork = backPrintId
      ? await artworkDataURL(
          fromEditor && side2d === "back" ? editorArtwork : sideArtwork("back"),
        )
      : null;
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
      source: fromEditor ? "editor" : "generate",
      pricingIsExample: config.pricingIsExample,
      design: {
        title: design.title,
        brief: design.brief || "",
        prompt: design.prompt || "",
        demo: design.demo !== false,
        trace: design.trace || null,
      },
      editorJSON: fromEditor ? editor.current?.exportJSON() : null,
      editorSide: fromEditor ? side2d : null,
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
                setView("2d");
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
                  <EditorCanvas
                    key={side2d}
                    t={tr}
                    ref={editor}
                    tool={tool}
                    stageHidden={view !== "canvas"}
                    initialImage={sideArtwork(side2d)}
                    onChange={(url) => setEditedBySide((prev) => ({ ...prev, [side2d]: url }))}
                    mode={mode}
                    aiDesign={sideDesign(side2d)}
                    onAiDesign={updateDesign}
                    onAiMode={setMode}
                    onRevealMockup={() => setView("2d")}
                  />
                )}
                <section
                  className={
                    "stage-panel card" +
                    (full ? " fullscreen" : "") +
                    (view === "canvas" ? " stage-off" : "")
                  }
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
                        artwork={frontPrintId ? sideArtwork("front") : null}
                        backArtwork={backPrintId ? sideArtwork("back") : null}
                        backWidthCm={backDims ? backDims.wCm : 0}
                        backHeightCm={backDims ? backDims.hCm : 0}
                        frontWidthCm={frontDims.wCm}
                        frontHeightCm={frontDims.hCm}
                        color={color.hex}
                        t={tr}
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
                      />
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
                  </div>
                </section>
                <div className="stage-bottom">
                  <div className="view-toggle side-toggle" role="group" aria-label={tr("activeSideLabel")}>
                    <button type="button" className={"seg" + (side2d === "front" ? " on" : "")} onClick={() => setSide2d("front")}>
                      {tr("viewFront")}
                    </button>
                    <button type="button" className={"seg" + (side2d === "back" ? " on" : "")} onClick={() => setSide2d("back")}>
                      {tr("viewBack")}
                    </button>
                  </div>
                  <span className="stage-hint">
                    {view === "canvas"
                      ? tr("stageHintCanvas") + " · " + tr("printAreaNote")
                      : tr("stageHintMockup")}
                  </span>
                  <div className="view-toggle" role="group" aria-label={tr("viewModeLabel")}>
                    <button type="button" className={"seg" + (view === "canvas" ? " on" : "")} aria-pressed={view === "canvas"} onClick={() => setView("canvas")}>
                      {tr("viewCanvas")}
                    </button>
                    <button type="button" className={"seg" + (view === "2d" ? " on" : "")} aria-pressed={view === "2d"} onClick={() => setView("2d")}>
                      2D
                    </button>
                    <button type="button" className={"seg" + (view === "3d" ? " on" : "")} aria-pressed={view === "3d"} onClick={() => setView("3d")}>
                      3D
                    </button>
                  </div>
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
                  frontOrientation={frontOrientation}
                  backOrientation={backOrientation}
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
