"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Expand,
  Languages,
  Layers3,
  Moon,
  PackageSearch,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import MockupCanvas from "./MockupCanvas";
import GeneratePanel from "./GeneratePanel";
import EditorCanvas from "./EditorCanvas";
import PricingPanel from "./PricingPanel";
import { orientedDimensions } from "../lib/pricing";
import ColourGroup from "./ui/ColourGroup";
import OrderDashboard from "./OrderDashboard";
import CatalogPanel from "./CatalogPanel";
import TrackingPanel from "./TrackingPanel";
import {
  artworkDataURL,
  readOrders,
  writeOrders,
  orderStatuses,
} from "../lib/orders";
import { translate } from "../lib/i18n";
import { config, sampleBriefs } from "../lib/config";

const tabs = [
  { id: "ai", labelKey: "tabAi", icon: Sparkles },
  { id: "editor", labelKey: "tabEditor", icon: SlidersHorizontal },
  { id: "katalog", labelKey: "tabCatalog", icon: Shirt },
  { id: "lacak", labelKey: "tabTrack", icon: PackageSearch },
  { id: "dashboard", labelKey: "tabDashboard", icon: ClipboardList },
];
export default function SablonApp() {
  const [tab, setTab] = useState("ai");
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("id");
  const tr = (key, vars) => translate(lang, key, vars);
  useEffect(() => {
    try {
      if (localStorage.getItem("sablonai.theme") === "dark") setTheme("dark");
      if (localStorage.getItem("sablonai.lang") === "en") setLang("en");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang === "en" ? "en" : "id";
    try {
      localStorage.setItem("sablonai.theme", theme);
      localStorage.setItem("sablonai.lang", lang);
    } catch {}
  }, [theme, lang]);
  const [color, setColor] = useState(config.colors[0]);
  // Paket 1B: produk, ukuran kaos, dan ukuran sablon tetap menggantikan
  // lebar/tinggi cetak bebas. Ukuran sablon depan menentukan area cetak
  // di mockup (tampilan depan); sablon belakang hanya menambah harga.
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
  const [design, setDesign] = useState({ ...sampleBriefs[0], demo: true });
  const [showArea, setShowArea] = useState(false),
    [help, setHelp] = useState(false),
    [full, setFull] = useState(false);
  const [mode, setMode] = useState(config.demoMode ? "demo" : "live");
  const [editedDesign, setEditedDesign] = useState(null);
  const [editorOpened, setEditorOpened] = useState(false);
  // Perbaikan 2026-10-28: efek ini harus jalan setiap tab berubah,
  // bukan hanya saat mount (tab awal 'ai'), kalau tidak EditorCanvas
  // tidak pernah dipasang dan panel Custom Editor terlihat kosong.
  useEffect(() => {
    if (tab === "editor") setEditorOpened(true);
  }, [tab]);
  const editor = useRef(null);
  const updateDesign = (d) => {
    setDesign(d);
    setEditedDesign(null);
  };
  const mockup = useRef(null);
  const choose = (s) => {
    updateDesign({ ...s, demo: true });
  };
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
    if (tab === "editor" && !editor.current?.exportJSON()?.objects?.length)
      throw new Error("Tambahkan gambar atau teks sebelum membuat order.");
    const editorArtwork = tab === "editor" ? editor.current?.exportPNG() : null;
    if (tab === "editor" && (!editorArtwork || editorArtwork !== editedDesign))
      throw new Error(
        "Editor sedang memperbarui desain. Tunggu sebentar lalu simpan kembali.",
      );
    const preview = mockup.current?.export();
    if (!preview)
      throw new Error(
        "Mockup sedang diperbarui. Tunggu sebentar lalu simpan kembali.",
      );
    const artwork = await artworkDataURL(
      tab === "editor" ? editorArtwork : design.image,
    );
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
      source: tab === "editor" ? "editor" : "generate",
      pricingIsExample: config.pricingIsExample,
      design: {
        title: design.title,
        brief: design.brief || "",
        prompt: design.prompt || "",
        demo: design.demo !== false,
        trace: design.trace || null,
      },
      editorJSON: tab === "editor" ? editor.current?.exportJSON() : null,
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
      <aside className="rail" aria-label={tr("studioNavHome")}>
        <a href="/" className="logo-mark" aria-label={tr("homeLabel")}>
          <Layers3 size={26} />
        </a>
        <div className="rail-links">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "rail-item active" : "rail-item"}
              aria-label={tr(t.labelKey)}
              title={tr(t.labelKey)}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={21} />
            </button>
          ))}
        </div>
        <button
          className="rail-help"
          aria-label={tr("guideLabel")}
          onClick={() => setHelp(true)}
        >
          <CircleHelp size={21} />
        </button>
        <div className="rail-prefs">
          <button
            className="pref-button"
            aria-label={tr("themeToggle")}
            title={tr("themeToggle")}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
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
        </div>
        <div className="avatar">SA</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <a href="/" className="wordmark">
            sablon<span>ai</span>
            <i />
          </a>
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />{" "}
            <strong>{tr("breadcrumbStudio")}</strong>
          </div>
          <div className="top-right">
            <span className="demo-badge">
              <span /> {mode === "demo" ? tr("modeDemo") : tr("modeLive")}
            </span>
            <button className="help-button" onClick={() => setHelp(true)}>
              <CircleHelp size={16} /> {tr("help")}
            </button>
          </div>
        </header>
        <main>
          <section className="page-heading">
            <div>
              <div className="eyebrow">{tr("heroEyebrow")}</div>
              <h1>
                {tr("heroTitle")}{" "}
                <em className="hero-accent">{tr("heroTitleAccent")}</em>
              </h1>
              <p>{tr("heroSub")}</p>
            </div>
            <div className="studio-tag">
              <span className="tiny-shirt">
                <Shirt size={19} />
              </span>
              <div>
                <strong>{tr("studioDtf")}</strong>
                <small>{tr("studioDtfSub")}</small>
              </div>
            </div>
          </section>
          <div className="studio-grid" hidden={tab === "dashboard" || tab === "katalog" || tab === "lacak"}>
            <div className="design-tools">
              <div hidden={tab !== "ai"}>
                <GeneratePanel
                  t={tr}
                  design={design}
                  onDesign={updateDesign}
                  onMode={setMode}
                />
              </div>
              <div hidden={tab !== "editor"}>
                {editorOpened && (
                  <EditorCanvas
                    t={tr}
                    ref={editor}
                    initialImage={design.image}
                    onChange={setEditedDesign}
                    mode={mode}
                  />
                )}
              </div>
            </div>
            <section
              className={"preview-panel card" + (full ? " fullscreen" : "")}
            >
              <div className="preview-toolbar">
                <div>
                  <span className="live-dot" /> {tr("previewTitle")}
                </div>
                <div>
                  <button
                    aria-label={tr("showArea")}
                    aria-pressed={showArea}
                    className={
                      showArea ? "icon-button selected" : "icon-button"
                    }
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
                <span className="view-label">{tr("viewFront")}</span>
                <MockupCanvas
                  ref={mockup}
                  artwork={
                    tab === "editor"
                      ? editedDesign || design.image
                      : design.image
                  }
                  color={color.hex}
                  printWidth={frontDims.wCm}
                  printHeight={frontDims.hCm}
                  showArea={showArea}
                />
                <div className="print-measure">
                  <span />
                  {frontDims.wCm} × {frontDims.hCm} cm
                  {frontIsLandscape ? tr("landscapeSuffix") : ""}
                  <span />
                </div>
                <span className="mockup-label">
                  {tr("mockupShop")} •{" "}
                  {design.demo !== false ? tr("artworkDemo") : tr("artworkMeta")}
                </span>
              </div>
              <ColourGroup
                t={tr}
                value={color}
                onChange={setColor}
                colors={config.colors}
              />
            </section>
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
              onOrder={createOrder}
              onDashboard={() => setTab("dashboard")}
            />
          </div>
          {tab === "lacak" && (
            <TrackingPanel orders={orders} t={tr} lang={lang} />
          )}
          {tab === "katalog" && (
            <CatalogPanel onSave={saveExternalOrder} t={tr} />
          )}
          {tab === "dashboard" && (
            <OrderDashboard
              t={tr}
              lang={lang}
              orders={orders}
              onStatus={changeStatus}
              onNew={() => setTab("ai")}
              error={storageError}
            />
          )}
          <section className="gallery-section" hidden={tab === "dashboard" || tab === "katalog" || tab === "lacak"}>
            <div className="gallery-title">
              <div>
                <h2>{tr("galleryTitle")}</h2>
                <p>{tr("gallerySub")}</p>
              </div>
              <span>
                {tr("galleryCount")} <ArrowRight size={16} />
              </span>
            </div>
            <div className="gallery-grid">
              {sampleBriefs.map((s, i) => (
                <button
                  className={"gallery-card gallery-" + i}
                  key={s.id}
                  onClick={() => {
                    choose(s);
                    setTab("ai");
                  }}
                >
                  <div className="gallery-art">
                    <img src={s.image} alt={tr("designExampleAlt") + s.title} />
                    <span className="gallery-action">
                      <ArrowRight size={20} />
                    </span>
                  </div>
                  <div className="gallery-caption">
                    <strong>{s.title}</strong>
                    <span>{s.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
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
