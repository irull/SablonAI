"use client";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ArrowDownToLine,
  ImagePlus,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Scissors,
  Trash2,
  Type,
} from "lucide-react";
import { metaRequest } from "../lib/api";
import { translate } from "../lib/i18n";

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
  if (file.size > 10 * 1024 * 1024)
    throw new Error(tr("errFileBig"));
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
const EditorCanvas = forwardRef(function EditorCanvas(
  { initialImage, onChange, mode, t },
  ref,
) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const element = useRef(null),
    canvas = useRef(null),
    fabric = useRef(null),
    fileInput = useRef(null),
    onChangeRef = useRef(onChange),
    timer = useRef(null);
  const generation = useRef(0);
  const [ready, setReady] = useState(false),
    [selected, setSelected] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [text, setText] = useState(tr("edDefaultText")),
    [textColor, setTextColor] = useState("#101460"),
    [subject, setSubject] = useState("logo");
  onChangeRef.current = onChange;
  const emit = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (canvas.current)
        onChangeRef.current(
          canvas.current.toDataURL({ format: "png", multiplier: 1 }),
        );
    }, 100);
  }, []);
  useImperativeHandle(ref, () => ({
    exportJSON: () => canvas.current?.toObject(),
    exportPNG: () =>
      canvas.current?.toDataURL({ format: "png", multiplier: 1 }),
  }));
  useEffect(() => {
    let alive = true,
      instance;
    import("fabric")
      .then((f) => {
        if (!alive) return;
        fabric.current = f;
        instance = new f.Canvas(element.current, {
          width: 600,
          height: 720,
          backgroundColor: "",
          preserveObjectStacking: true,
          selection: true,
        });
        canvas.current = instance;
        instance.on("object:modified", emit);
        instance.on("object:added", emit);
        instance.on("object:removed", emit);
        instance.on("text:changed", emit);
        const selection = () =>
          setSelected(Boolean(instance.getActiveObject()));
        instance.on("selection:created", selection);
        instance.on("selection:updated", selection);
        instance.on("selection:cleared", selection);
        setReady(true);
      })
      .catch(() =>
        setError(tr("errEditorLoad")),
      );
    return () => {
      alive = false;
      generation.current++;
      clearTimeout(timer.current);
      canvas.current = null;
      instance?.dispose();
    };
  }, [emit]);
  useEffect(() => {
    if (!ready || !initialImage) return;
    const current = ++generation.current;
    fabric.current.FabricImage.fromURL(initialImage)
      .then((img) => {
        if (current !== generation.current || !canvas.current) return;
        canvas.current.clear();
        const scale = Math.min(500 / img.width, 620 / img.height);
        img.set({
          left: 300,
          top: 360,
          scaleX: scale,
          scaleY: scale,
          cornerColor: "#3442CA",
          borderColor: "#3442CA",
          transparentCorners: false,
        });
        canvas.current.add(img);
        canvas.current.setActiveObject(img);
        canvas.current.requestRenderAll();
        emit();
      })
      .catch(() => setError(tr("errDesignIn")));
  }, [ready, initialImage, emit]);
  async function upload(file) {
    if (!file || !ready) return;
    setError("");
    setBusy(tr("busyLoading"));
    try {
      const src = await normalizedUpload(file, tr),
        img = await fabric.current.FabricImage.fromURL(src);
      if (!canvas.current) return;
      const scale = Math.min(480 / img.width, 560 / img.height);
      img.set({ left: 300, top: 360, scaleX: scale, scaleY: scale });
      canvas.current.add(img);
      canvas.current.setActiveObject(img);
      canvas.current.requestRenderAll();
      emit();
      setMessage(tr("msgUploaded"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  function addText() {
    if (!ready || !text.trim()) return;
    const obj = new fabric.current.Textbox(text.trim(), {
      left: 300,
      top: 360,
      width: 450,
      fontSize: 54,
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: textColor,
      textAlign: "center",
    });
    canvas.current.add(obj);
    canvas.current.setActiveObject(obj);
    canvas.current.requestRenderAll();
    emit();
  }
  function transform(action) {
    const c = canvas.current,
      o = c?.getActiveObject();
    if (!o) return;
    if (action === "delete") {
      c.getActiveObjects().forEach((obj) => c.remove(obj));
      c.discardActiveObject();
    } else if (action === "left" || action === "right")
      o.rotate(o.angle + (action === "left" ? -15 : 15));
    else {
      const factor = action === "bigger" ? 1.1 : 1 / 1.1;
      o.set({ scaleX: o.scaleX * factor, scaleY: o.scaleY * factor });
    }
    o.setCoords();
    c.requestRenderAll();
    emit();
  }
  async function removeBackground(demo) {
    const obj = canvas.current?.getActiveObject();
    if (!obj || obj.type !== "image") {
      setError("Pilih satu gambar di kanvas terlebih dahulu.");
      return;
    }
    setError("");
    setMessage("");
    setBusy(demo ? "Menghapus warna putih…" : "SAM 3.1 memisahkan objek…");
    try {
      const src = obj.getSrc();
      let result;
      if (demo) {
        const img = await readImage(src, tr("errImageRead"));
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
        const img = await readImage(src, tr("errImageRead"));
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
      const img = await readImage(result, tr("errImageRead"));
      if (!canvas.current || !canvas.current.getObjects().includes(obj)) return;
      obj.setElement(img);
      obj.setCoords();
      canvas.current.requestRenderAll();
      emit();
      setMessage(demo ? tr("msgSamDemo") : tr("msgSamLive"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  function download() {
    const src = canvas.current?.toDataURL({ format: "png", multiplier: 1 });
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = "sablonai-artwork.png";
    a.click();
  }
  return (
    <section className="editor-panel card">
      <div className="panel-heading">
        <span className="icon-tile">
          <SlidersIcon />
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
        onChange={(e) => upload(e.target.files[0])}
      />
      <button
        className="upload-zone"
        disabled={!ready || !!busy}
        onClick={() => fileInput.current?.click()}
      >
        <ImagePlus size={24} />
        <strong>{tr("uploadTitle")}</strong>
        <span>{tr("uploadHint")}</span>
      </button>
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
            onChange={(e) => {
              setTextColor(e.target.value);
              const o = canvas.current?.getActiveObject();
              if (o && ["textbox", "i-text", "text"].includes(o.type)) {
                o.set("fill", e.target.value);
                canvas.current.requestRenderAll();
                emit();
              }
            }}
          />
          <button
            className="icon-button"
            aria-label={tr("addTextCanvas")}
            disabled={!ready || !!busy}
            onClick={addText}
          >
            <Type size={19} />
          </button>
        </div>
      </div>
      <div className="editor-canvas-shell">
        <canvas ref={element} aria-label={tr("canvasLabel")} />
      </div>
      <div className="editor-tools">
        {[
          { a: "smaller", l: tr("toolSmaller"), i: Minus },
          { a: "bigger", l: tr("toolBigger"), i: Plus },
          { a: "left", l: tr("toolLeft"), i: RotateCcw },
          { a: "right", l: tr("toolRight"), i: RotateCw },
          { a: "delete", l: tr("toolDelete"), i: Trash2 },
        ].map((t) => (
          <button
            key={t.a}
            className="icon-button"
            disabled={!selected || !!busy}
            aria-label={t.l}
            title={t.l}
            onClick={() => transform(t.a)}
          >
            <t.i size={17} />
          </button>
        ))}
      </div>
      <p className="small-note">{tr("editorHint")}</p>
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
          disabled={!selected || !!busy || mode !== "live"}
          onClick={() => removeBackground(false)}
        >
          <Scissors size={16} /> {tr("samButton")}
        </button>
        {mode !== "live" && (
          <p className="small-note">{tr("samNote")}</p>
        )}
        <button
          className="text-button"
          disabled={!selected || !!busy}
          onClick={() => removeBackground(true)}
        >
          {tr("tryWhite")}
        </button>
      </div>
      {busy && (
        <p className="editor-status" role="status">
          <LoaderCircle className="spinner" size={15} />
          {busy}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-note" role="status">
          {message}
        </p>
      )}
      <button
        className="secondary full-width"
        disabled={!ready || !!busy}
        onClick={download}
      >
        <ArrowDownToLine size={16} /> {tr("downloadArtwork")}
      </button>
      <p className="small-note">{tr("exportNote")}</p>
    </section>
  );
});
function SlidersIcon() {
  return <Type size={19} />;
}
export default EditorCanvas;
