"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Expand,
  Layers3,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import MockupCanvas from "./MockupCanvas";
import GeneratePanel from "./GeneratePanel";
import EditorCanvas from "./EditorCanvas";
import PricingPanel from "./PricingPanel";
import { orientedDimensions } from "../lib/pricing";
import ColourGroup from "./ui/ColourGroup";
import OrderDashboard from "./OrderDashboard";
import {
  artworkDataURL,
  readOrders,
  writeOrders,
  orderStatuses,
} from "../lib/orders";
import { config, sampleBriefs } from "../lib/config";

const tabs = [
  { id: "ai", label: "AI Generate", icon: Sparkles },
  { id: "editor", label: "Custom Editor", icon: SlidersHorizontal },
  { id: "dashboard", label: "Dashboard Order", icon: ClipboardList },
];
export default function SablonApp() {
  const [tab, setTab] = useState("ai");
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
      status: "Baru",
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
      <aside className="rail" aria-label="Navigasi studio">
        <a href="/" className="logo-mark" aria-label="SablonAI beranda">
          <Layers3 size={26} />
        </a>
        <div className="rail-links">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "rail-item active" : "rail-item"}
              aria-label={t.label}
              title={t.label}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={21} />
            </button>
          ))}
        </div>
        <button
          className="rail-help"
          aria-label="Panduan studio"
          onClick={() => setHelp(true)}
        >
          <CircleHelp size={21} />
        </button>
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
            <strong>Studio desain</strong>
          </div>
          <div className="top-right">
            <span className="demo-badge">
              <span /> {mode === "demo" ? "Mode demo" : "API live"}
            </span>
            <button className="help-button" onClick={() => setHelp(true)}>
              <CircleHelp size={16} /> Panduan
            </button>
          </div>
        </header>
        <main>
          <section className="page-heading">
            <div>
              <div className="eyebrow">DARI CERITA JADI KARYA</div>
              <h1>Ide kamu. Kaos kamu.</h1>
              <p>
                Ruang kecil untuk ide besar. Yuk, bikin sesuatu yang kamu
                banget.
              </p>
            </div>
            <div className="studio-tag">
              <span className="tiny-shirt">
                <Shirt size={19} />
              </span>
              <div>
                <strong>Studio DTF</strong>
                <small>Dibuat untuk usaha lokal</small>
              </div>
            </div>
          </section>
          <div className="studio-navigation">
            <nav aria-label="Tampilan studio">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={tab === t.id ? "tab active" : "tab"}
                >
                  <t.icon size={17} />
                  {t.label}
                </button>
              ))}
            </nav>
            <span className="saved-indicator">
              <span /> Ruang berkarya kamu
            </span>
          </div>
          <div className="studio-grid" hidden={tab === "dashboard"}>
            <div className="design-tools">
              <div hidden={tab !== "ai"}>
                <GeneratePanel
                  design={design}
                  onDesign={updateDesign}
                  onMode={setMode}
                />
              </div>
              <div hidden={tab !== "editor"}>
                {editorOpened && (
                  <EditorCanvas
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
                  <span className="live-dot" /> Pratinjau kaos
                </div>
                <div>
                  <button
                    aria-label="Tampilkan batas area cetak"
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
                    aria-label={
                      full ? "Tutup pratinjau penuh" : "Perbesar pratinjau"
                    }
                    onClick={() => setFull(!full)}
                  >
                    {full ? <X size={17} /> : <Expand size={17} />}
                  </button>
                </div>
              </div>
              <div className="mockup-stage">
                <span className="view-label">DEPAN</span>
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
                  {frontIsLandscape ? " (Lanskap)" : ""}
                  <span />
                </div>
                <span className="mockup-label">
                  MOCKUP FOTO TOKO •{" "}
                  {design.demo !== false ? "ARTWORK DEMO" : "ARTWORK META AI"}
                </span>
              </div>
              <ColourGroup
                value={color}
                onChange={setColor}
                colors={config.colors}
              />
            </section>
            <PricingPanel
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
          {tab === "dashboard" && (
            <OrderDashboard
              orders={orders}
              onStatus={changeStatus}
              onNew={() => setTab("ai")}
              error={storageError}
            />
          )}
          <section className="gallery-section" hidden={tab === "dashboard"}>
            <div className="gallery-title">
              <div>
                <h2>Sedikit inspirasi, banyak kemungkinan.</h2>
                <p>Contoh desain untuk memulai ceritamu.</p>
              </div>
              <span>
                03 DESAIN PILIHAN <ArrowRight size={16} />
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
                    <img src={s.image} alt={"Contoh desain " + s.title} />
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
              © 2026 SablonAI <span className="footer-dot">•</span> Dari ide
              lokal, jadi karya personal.
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
              aria-label="Tutup panduan"
              onClick={() => setHelp(false)}
            >
              <X />
            </button>
            <div className="eyebrow">SELAMAT DATANG DI STUDIO</div>
            <h2 id="help-title">Dari cerita jadi kaos.</h2>
            <ol>
              <li>Ceritakan ide atau pilih satu inspirasi.</li>
              <li>Pilih produk, warna kaos, dan ukuran sablon.</li>
              <li>Edit gambar dan teks di Custom Editor.</li>
              <li>Masukkan nama dan simpan order demo.</li>
            </ol>
            <p className="notice">
              Mode demo memakai desain lokal, bukan hasil Meta AI. Foto kaos
              masih ilustrasi. Harga sudah harga toko. Dashboard tersimpan
              hanya di browser ini, belum terhubung ke toko.
            </p>
            <button className="primary" onClick={() => setHelp(false)}>
              Mulai berkarya <ArrowRight size={17} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
