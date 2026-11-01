"use client";
import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ImagePlus,
  LoaderCircle,
  Scissors,
  Type,
} from "lucide-react";
import { metaRequest } from "../lib/api";
import { translate } from "../lib/i18n";
import GeneratePanel from "./GeneratePanel";
import DesignGallery from "./DesignGallery";

// Panel tool Studio DIY (Nov 2026, revisi user): editor kanvas fabric
// DIHAPUS. Semua tool sekarang menghasilkan SATU gambar desain untuk
// sisi aktif — dari generate AI, upload, render teks (termasuk
// melingkar), render elemen/template, atau galeri — dan gambar itu
// tampil di kotak desain + mockup, diatur posisinya langsung di
// mockup (geser/skala/putar ditangani SablonApp + MockupCanvas).
const FONTS = [
  "Arial",
  "Anton",
  "Bebas Neue",
  "Dancing Script",
  "Lobster",
  "Montserrat",
  "Oswald",
  "Pacifico",
  "Playfair Display",
  "Poppins",
];
const CLIPARTS = [
  { id: "sun", label: "Sun", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="19" fill="#F5A623"/><g stroke="#F5A623" stroke-width="6" stroke-linecap="round"><line x1="50" y1="8" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="92"/><line x1="8" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="92" y2="50"/><line x1="20" y1="20" x2="28" y2="28"/><line x1="72" y1="72" x2="80" y2="80"/><line x1="80" y1="20" x2="72" y2="28"/><line x1="28" y1="72" x2="20" y2="80"/></g></svg>' },
  { id: "heart", label: "Heart", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 86 C20 62 8 44 8 29 C8 15 18 6 30 6 C40 6 47 12 50 20 C53 12 60 6 70 6 C82 6 92 15 92 29 C92 44 80 62 50 86Z" fill="#E5484D"/></svg>' },
  { id: "star", label: "Star", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,4 61,38 98,38 68,59 79,93 50,71 21,93 32,59 2,38 39,38" fill="#FFC53D" stroke="#E8A100" stroke-width="2"/></svg>' },
  { id: "bolt", label: "Bolt", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="56,2 20,56 43,56 37,98 82,40 56,40" fill="#FFD60A" stroke="#E0A800" stroke-width="2"/></svg>' },
  { id: "leaf", label: "Leaf", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M84 14 C40 18 18 42 15 86 C56 84 80 58 84 14Z" fill="#3E9B4F"/><path d="M22 80 C38 56 58 36 78 22" stroke="#2C7039" stroke-width="4" fill="none" stroke-linecap="round"/></svg>' },
  { id: "flame", label: "Flame", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 3 C58 22 77 34 77 58 A27 27 0 1 1 23 58 C23 44 31 33 38 23 C40 33 44 39 48 44 C46 29 46 15 50 3Z" fill="#F76B15"/></svg>' },
  { id: "crown", label: "Crown", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="8,74 8,30 31,50 50,22 69,50 92,30 92,74Z" fill="#FFC53D" stroke="#E8A100" stroke-width="2"/><rect x="8" y="78" width="84" height="9" rx="3" fill="#E8A100"/></svg>' },
  { id: "smile", label: "Smile", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FFD60A"/><circle cx="35" cy="42" r="5" fill="#333"/><circle cx="65" cy="42" r="5" fill="#333"/><path d="M30 62 C38 74 62 74 70 62" stroke="#333" stroke-width="5" fill="none" stroke-linecap="round"/></svg>' },
];
const TEMPLATES = [
  { id: "komunitas", name: "Komunitas", title: "GOWES PAGI", sub: "KOMUNITAS SEPEDA", font: "Bebas Neue", color: "#21493c", clip: "sun" },
  { id: "usaha", name: "Usaha Lokal", title: "Kopi Dulu", sub: "NGOPI - SANTAI - ULANGI", font: "Dancing Script", color: "#7A4A21", clip: "heart" },
  { id: "sport", name: "Sport", title: "NO PAIN", sub: "NO GLORY", font: "Anton", color: "#3442CA", clip: "bolt" },
  { id: "vintage", name: "Vintage", title: "Sejak 1998", sub: "ORIGINAL - CLASSIC", font: "Playfair Display", color: "#354E40", clip: "crown" },
];
const SHAPE_IDS = ["rect", "circle", "triangle", "star", "heart", "line"];

function shapeSvg(id, color) {
  const inner =
    id === "rect"
      ? `<rect x="14" y="20" width="72" height="60" fill="${color}"/>`
      : id === "circle"
        ? `<circle cx="50" cy="50" r="36" fill="${color}"/>`
        : id === "triangle"
          ? `<polygon points="50,12 90,86 10,86" fill="${color}"/>`
          : id === "star"
            ? `<polygon points="50,4 61,38 98,38 68,59 79,93 50,71 21,93 32,59 2,38 39,38" fill="${color}"/>`
            : id === "heart"
              ? `<path d="M50 86 C20 62 8 44 8 29 C8 15 18 6 30 6 C40 6 47 12 50 20 C53 12 60 6 70 6 C82 6 92 15 92 29 C92 44 80 62 50 86Z" fill="${color}"/>`
              : `<line x1="8" y1="50" x2="92" y2="50" stroke="${color}" stroke-width="8" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
}

const readImage = (src, errMsg = "Gambar gagal dibaca.") =>
  new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(errMsg));
    im.src = src;
  });

async function normalizedUpload(file, tr) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error(tr("errFileType"));
  if (file.size > 10 * 1024 * 1024) throw new Error(tr("errFileBig"));
  const url = URL.createObjectURL(file);
  try {
    const img = await readImage(url);
    if (img.width * img.height > 24000000)
      throw new Error(tr("errResTooBig"));
    const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function svgImage(svg) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    );
    const img = new Image();
    img.onload = () => {
      resolve({ img, url });
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// Potong tepi transparan hasil render supaya desain tampil pas di
// mockup (tanpa margin kosong besar dari kanvas render).
function trimCanvas(c) {
  const g = c.getContext("2d");
  const w = c.width,
    h = c.height;
  const data = g.getImageData(0, 0, w, h).data;
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return c.toDataURL("image/png");
  const pad = 12;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out
    .getContext("2d")
    .drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

async function renderSvgDesign(svg, px = 640) {
  const { img, url } = await svgImage(svg);
  try {
    const c = document.createElement("canvas");
    c.width = px;
    c.height = px;
    c.getContext("2d").drawImage(img, 0, 0, px, px);
    return trimCanvas(c);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Render teks (lurus / lengkung atas / lengkung bawah / melingkar)
// menjadi PNG transparan — matematika busur sama dengan editor lama.
async function renderTextDesign({ text, font, color, shape }, tr) {
  const value = (text || "").trim() || tr("edDefaultText");
  try {
    await Promise.race([
      document.fonts.load(`700 100px "${font}"`),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
  } catch {}
  const fontSize = 120;
  const meas = document.createElement("canvas").getContext("2d");
  meas.font = `700 ${fontSize}px "${font}"`;
  const c = document.createElement("canvas");
  if (shape === "straight") {
    const w = Math.ceil(meas.measureText(value).width);
    c.width = w + 90;
    c.height = Math.ceil(fontSize * 1.8);
    const g = c.getContext("2d");
    g.font = `700 ${fontSize}px "${font}"`;
    g.fillStyle = color;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(value, c.width / 2, c.height / 2 + fontSize * 0.04);
    return trimCanvas(c);
  }
  const chars = [...value];
  const widths = chars.map((ch) =>
    Math.max(10, meas.measureText(ch === " " ? " " : ch).width),
  );
  const gap = fontSize * 0.14;
  const total =
    widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, chars.length - 1);
  const R =
    shape === "circle"
      ? Math.max(95, total / (2 * Math.PI) + fontSize * 0.45)
      : Math.max(150, total * 0.8);
  const size = Math.ceil(R * 2 + fontSize * 2.4);
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  g.font = `700 ${fontSize}px "${font}"`;
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const cxp = size / 2,
    cyp = size / 2;
  let theta =
    shape === "circle" ? 0 : -(total / R) / 2;
  chars.forEach((ch, i) => {
    const half = widths[i] / 2 / R;
    theta += half;
    const draw = ch === " " ? " " : ch;
    g.save();
    if (shape === "arcDown") {
      g.translate(cxp + R * Math.sin(theta), cyp + R * Math.cos(theta));
      g.rotate(-theta);
    } else {
      g.translate(cxp + R * Math.sin(theta), cyp - R * Math.cos(theta));
      g.rotate(theta);
    }
    g.fillText(draw, 0, 0);
    g.restore();
    theta += half + gap / R;
  });
  return trimCanvas(c);
}

async function renderTemplateDesign(tpl) {
  const clip = CLIPARTS.find((x) => x.id === tpl.clip);
  const c = document.createElement("canvas");
  c.width = 1100;
  c.height = 1100;
  const g = c.getContext("2d");
  if (clip) {
    const { img, url } = await svgImage(clip.svg);
    try {
      g.drawImage(img, 360, 60, 380, 380);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  try {
    await Promise.race([
      document.fonts.load(`700 100px "${tpl.font}"`),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
  } catch {}
  g.fillStyle = tpl.color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 128px "${tpl.font}"`;
  g.fillText(tpl.title, 550, 580);
  g.font = `600 52px "Poppins", sans-serif`;
  g.fillText(tpl.sub, 550, 700);
  return trimCanvas(c);
}

export default function StudioTools({ t, tool = "upload", design, onSetDesign, mode, onMode }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [subject, setSubject] = useState("logo");
  const [text, setText] = useState(tr("edDefaultText")),
    [textColor, setTextColor] = useState("#21493c"),
    [font, setFont] = useState("Arial"),
    [textShape, setTextShape] = useState("straight");
  const [shapeColor, setShapeColor] = useState("#21493c");
  const [refData, setRefData] = useState(null);
  const fileInput = useRef(null),
    refFileInput = useRef(null);

  const currentImage = design && design.image ? design.image : null;

  function setDesignImage(image, title) {
    onSetDesign({
      ...(design || {}),
      image,
      title: title || (design && design.title) || "",
      demo: true,
    });
  }

  async function upload(file) {
    if (!file) return;
    setError("");
    setMessage("");
    setBusy(tr("uploadTitle"));
    try {
      const src = await normalizedUpload(file, tr);
      setDesignImage(src, file.name.replace(/\.[^.]+$/, ""));
      setMessage(tr("msgDesignIn"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function removeBackground(demo) {
    if (!currentImage) {
      setError(tr("designEmpty"));
      return;
    }
    setError("");
    setMessage("");
    setBusy(demo ? "Menghapus warna putih…" : "SAM 3.1 memisahkan objek…");
    try {
      let result;
      if (demo) {
        const img = await readImage(currentImage, tr("errImageRead"));
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const cx = c.getContext("2d");
        cx.drawImage(img, 0, 0);
        const p = cx.getImageData(0, 0, c.width, c.height);
        for (let i = 0; i < p.data.length; i += 4) {
          const white = Math.min(p.data[i], p.data[i + 1], p.data[i + 2]);
          if (white > 230)
            p.data[i + 3] = Math.round(
              p.data[i + 3] * Math.max(0, (245 - white) / 15),
            );
        }
        cx.putImageData(p, 0, 0);
        result = c.toDataURL("image/png");
      } else {
        const img = await readImage(currentImage, tr("errImageRead"));
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        result = (
          await metaRequest({
            action: "segment",
            image: c.toDataURL("image/png"),
            subject: subject.trim(),
            demo: false,
          })
        ).image;
      }
      setDesignImage(result, design ? design.title : "");
      setMessage(demo ? tr("msgSamDemo") : tr("msgSamLive"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function makeText() {
    setError("");
    setBusy(tr("makeDesign"));
    try {
      const url = await renderTextDesign(
        { text, font, color: textColor, shape: textShape },
        tr,
      );
      setDesignImage(url, text.slice(0, 26));
      setMessage(tr("msgDesignIn"));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy("");
    }
  }

  async function makeFromRender(promise, title) {
    setError("");
    setBusy(tr("makeDesign"));
    try {
      const url = await promise;
      setDesignImage(url, title);
      setMessage(tr("msgDesignIn"));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy("");
    }
  }

  function downloadArtwork() {
    if (!currentImage) return;
    const a = document.createElement("a");
    a.href = currentImage;
    a.download = "sablonai-artwork.png";
    a.click();
  }

  return (
    <div className="ec-tools card">
      {tool === "ai" && (
        <div className="tool-section">
          <GeneratePanel
            t={tr}
            design={design}
            onDesign={(d) => onSetDesign(d)}
            onMode={(m) => {
              if (onMode) onMode(m);
            }}
          />
          <div className="ref-block">
            <div className="field-label">{tr("refTitle")}</div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              ref={refFileInput}
              className="visually-hidden"
              aria-label={tr("refPick")}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setError("");
                try {
                  const src = await normalizedUpload(file, tr);
                  setRefData({ src, name: file.name });
                } catch (err) {
                  setError(err.message);
                }
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="upload-zone compact"
              disabled={!!busy}
              onClick={() => refFileInput.current?.click()}
            >
              <ImagePlus size={20} />
              <strong>{tr("refPick")}</strong>
            </button>
            {refData && (
              <div className="ref-preview">
                <img src={refData.src} alt={refData.name} />
                <p className="small-note">
                  {tr("refChosen", { name: refData.name })}
                </p>
                <div className="ref-actions">
                  <button
                    type="button"
                    className="secondary mini-btn"
                    onClick={() =>
                      setDesignImage(
                        refData.src,
                        refData.name.replace(/\.[^.]+$/, ""),
                      )
                    }
                  >
                    {tr("refUseAsDesign")}
                  </button>
                </div>
              </div>
            )}
            <p className="small-note">{tr("refHint")}</p>
          </div>
        </div>
      )}
      {tool === "upload" && (
        <div className="tool-section">
          <div className="panel-heading">
            <span className="icon-tile">
              <ImagePlus size={19} />
            </span>
            <div>
              <h2>{tr("edTitle")}</h2>
              <p>{tr("edSub")}</p>
            </div>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            ref={fileInput}
            className="visually-hidden"
            aria-label={tr("pickFile")}
            onChange={(e) => {
              upload(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <button
            className="upload-zone"
            disabled={!!busy}
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus size={24} />
            <strong>{tr("uploadTitle")}</strong>
            <span>{tr("uploadHint")}</span>
          </button>
          <div className="background-tools">
            <label className="field-label" htmlFor="subject">
              {tr("subjectLabel")}
            </label>
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              placeholder={tr("subjectPlaceholder")}
            />
            <button
              className="secondary"
              disabled={!currentImage || !!busy || mode !== "live"}
              onClick={() => removeBackground(false)}
            >
              <Scissors size={16} /> {tr("samButton")}
            </button>
            {mode !== "live" && (
              <p className="small-note">{tr("samNote")}</p>
            )}
            <button
              className="text-button"
              disabled={!currentImage || !!busy}
              onClick={() => removeBackground(true)}
            >
              {tr("tryWhite")}
            </button>
          </div>
          <button
            className="secondary full-width"
            disabled={!currentImage || !!busy}
            onClick={downloadArtwork}
          >
            <ArrowDownToLine size={16} /> {tr("downloadArtwork")}
          </button>
          <p className="small-note">{tr("exportNote")}</p>
        </div>
      )}
      {tool === "font" && (
        <div className="tool-section">
          <h3 className="tool-title">{tr("fontTitle")}</h3>
          <div className="text-add">
            <label className="field-label" htmlFor="editor-text">
              {tr("addText")}
            </label>
            <div>
              <input
                id="editor-text"
                maxLength={140}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <input
                aria-label={tr("textColor")}
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
              <select
                className="font-select"
                aria-label={tr("fontLabel")}
                value={font}
                onChange={(e) => setFont(e.target.value)}
              >
                {FONTS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field-label">{tr("textShapeLabel")}</div>
          <div className="seg-row" role="group" aria-label={tr("textShapeLabel")}>
            {[
              { id: "straight", k: "shapeStraight" },
              { id: "arcUp", k: "shapeArcUp" },
              { id: "arcDown", k: "shapeArcDown" },
              { id: "circle", k: "shapeCircle" },
            ].map((sh) => (
              <button
                key={sh.id}
                type="button"
                className={"seg-btn" + (textShape === sh.id ? " on" : "")}
                aria-pressed={textShape === sh.id}
                onClick={() => setTextShape(sh.id)}
              >
                {tr(sh.k)}
              </button>
            ))}
          </div>
          <p className="small-note">{tr("textShapeHint")}</p>
          <button
            type="button"
            className="primary full-width"
            disabled={!!busy}
            onClick={makeText}
          >
            <Type size={16} /> {tr("makeDesign")}
          </button>
        </div>
      )}
      {tool === "elemen" && (
        <div className="tool-section">
          <div className="element-tools">
            <div className="field-label">{tr("templatesTitle")}</div>
            <div className="template-grid">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className="template-card"
                  disabled={!!busy}
                  onClick={() =>
                    makeFromRender(renderTemplateDesign(tpl), tpl.title)
                  }
                >
                  <span style={{ fontFamily: tpl.font }}>{tpl.title}</span>
                  <small>{tpl.name}</small>
                </button>
              ))}
            </div>
            <div className="field-label">{tr("shapesTitle")}</div>
            <div className="prop-row">
              <span>{tr("textColor")}</span>
              <input
                type="color"
                value={shapeColor}
                onChange={(e) => setShapeColor(e.target.value)}
              />
            </div>
            <div className="shape-row">
              {SHAPE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="secondary mini-btn"
                  disabled={!!busy}
                  onClick={() =>
                    makeFromRender(
                      renderSvgDesign(shapeSvg(id, shapeColor)),
                      tr("shp" + id[0].toUpperCase() + id.slice(1)),
                    )
                  }
                >
                  {tr("shp" + id[0].toUpperCase() + id.slice(1))}
                </button>
              ))}
            </div>
            <div className="field-label">{tr("clipartTitle")}</div>
            <div className="clipart-grid">
              {CLIPARTS.map((cl) => (
                <button
                  key={cl.id}
                  type="button"
                  className="clipart-btn"
                  title={cl.label}
                  aria-label={cl.label}
                  disabled={!!busy}
                  onClick={() =>
                    makeFromRender(renderSvgDesign(cl.svg), cl.label)
                  }
                  dangerouslySetInnerHTML={{ __html: cl.svg }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {tool === "image" && (
        <div className="tool-section">
          <DesignGallery
            t={tr}
            onPick={(url) =>
              onSetDesign({
                image: url,
                title: decodeURIComponent(
                  url.split("/").pop().split("?")[0],
                ).slice(0, 30),
                demo: true,
              })
            }
          />
        </div>
      )}
      <div className="tool-status">
        <p className="small-note">{tr("editorHint")}</p>
        {busy && (
          <p className="small-note" role="status">
            <LoaderCircle size={13} className="spinner" /> {busy}
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="small-note" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
