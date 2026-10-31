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
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Redo2,
  Scissors,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { metaRequest } from "../lib/api";
import { translate } from "../lib/i18n";

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
  { id: "crown", label: "Crown", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="8,74 8,30 31,50 50,22 69,50 92,30 92,74" fill="#FFC53D" stroke="#E8A100" stroke-width="2"/><rect x="8" y="78" width="84" height="9" rx="3" fill="#E8A100"/></svg>' },
  { id: "smile", label: "Smile", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FFD60A"/><circle cx="35" cy="42" r="5" fill="#333"/><circle cx="65" cy="42" r="5" fill="#333"/><path d="M30 62 C38 74 62 74 70 62" stroke="#333" stroke-width="5" fill="none" stroke-linecap="round"/></svg>' },
];
const TEMPLATES = [
  { id: "komunitas", name: "Komunitas", title: "GOWES PAGI", sub: "KOMUNITAS SEPEDA", font: "Bebas Neue", color: "#101460", clip: "sun" },
  { id: "usaha", name: "Usaha Lokal", title: "Kopi Dulu", sub: "NGOPI - SANTAI - ULANGI", font: "Dancing Script", color: "#7A4A21", clip: "heart" },
  { id: "sport", name: "Sport", title: "NO PAIN", sub: "NO GLORY", font: "Anton", color: "#3442CA", clip: "bolt" },
  { id: "vintage", name: "Vintage", title: "Sejak 1998", sub: "ORIGINAL - CLASSIC", font: "Playfair Display", color: "#354E40", clip: "crown" },
];
const SHAPE_IDS = ["rect", "circle", "triangle", "star", "heart", "line"];

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
  const lastEmit = useRef(null);
  const [ready, setReady] = useState(false),
    [selected, setSelected] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [text, setText] = useState(tr("edDefaultText")),
    [textColor, setTextColor] = useState("#101460"),
    [subject, setSubject] = useState("logo");
  const [zoom, setZoomState] = useState(1),
    [layers, setLayers] = useState([]),
    [hist, setHist] = useState({ u: 0, r: 0 });
  const [font, setFont] = useState("Arial"),
    [objProps, setObjProps] = useState(null);
  const zoomRef = useRef(1),
    undoStack = useRef([]),
    redoStack = useRef([]),
    historyLock = useRef(false),
    histTimer = useRef(null),
    lidRef = useRef(1);
  onChangeRef.current = onChange;
  const capturePNG = () => {
    const c = canvas.current;
    if (!c) return null;
    const vt = c.viewportTransform ? c.viewportTransform.slice() : null;
    c.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const url = c.toDataURL({ format: "png", multiplier: 1 });
    if (vt) c.setViewportTransform(vt);
    c.requestRenderAll();
    return url;
  };
  const emit = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const url = capturePNG();
      if (url) {
        lastEmit.current = url;
        onChangeRef.current(url);
      }
    }, 100);
  }, []);
  function applyZoom(z) {
    const next = Math.min(2, Math.max(0.5, z));
    zoomRef.current = next;
    setZoomState(next);
    const c = canvas.current;
    if (!c || !fabric.current) return;
    c.zoomToPoint(new fabric.current.Point(300, 360), next);
    c.requestRenderAll();
  }
  function layerLabel(obj) {
    if (["textbox", "i-text", "text"].includes(obj.type))
      return (obj.text || tr("layerText")).slice(0, 22);
    if (obj.type === "image") return tr("layerImage");
    return tr("layerShape");
  }
  function refreshLayers(instance) {
    const c = instance || canvas.current;
    if (!c) return;
    const active = c.getActiveObject();
    setLayers(
      c
        .getObjects()
        .slice()
        .reverse()
        .map((obj) => {
          if (!obj.__lid) obj.__lid = "L" + lidRef.current++;
          return {
            lid: obj.__lid,
            obj,
            label: layerLabel(obj),
            visible: obj.visible !== false,
            locked: Boolean(obj.lockMovementX),
            active: obj === active,
          };
        }),
    );
  }
  function scheduleSnapshot(instance) {
    if (historyLock.current) return;
    clearTimeout(histTimer.current);
    histTimer.current = setTimeout(() => {
      const c = instance || canvas.current;
      if (!c || historyLock.current) return;
      const json = JSON.stringify(c.toJSON());
      const stack = undoStack.current;
      if (stack[stack.length - 1] === json) return;
      stack.push(json);
      if (stack.length > 40) stack.shift();
      redoStack.current = [];
      setHist({ u: stack.length, r: 0 });
    }, 250);
  }
  async function restore(json) {
    const c = canvas.current;
    if (!c) return;
    historyLock.current = true;
    try {
      await c.loadFromJSON(json);
    } catch {}
    historyLock.current = false;
    if (fabric.current)
      c.zoomToPoint(new fabric.current.Point(300, 360), zoomRef.current);
    c.requestRenderAll();
    refreshLayers(c);
    emit();
  }
  function undo() {
    const stack = undoStack.current;
    if (stack.length < 2) return;
    redoStack.current.push(stack.pop());
    setHist({ u: stack.length, r: redoStack.current.length });
    restore(stack[stack.length - 1]);
  }
  function redo() {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(next);
    setHist({ u: undoStack.current.length, r: redoStack.current.length });
    restore(next);
  }
  function selectLayer(obj) {
    const c = canvas.current;
    if (!c) return;
    c.setActiveObject(obj);
    c.requestRenderAll();
    refreshLayers(c);
  }
  function toggleLayer(obj, kind) {
    const c = canvas.current;
    if (!c) return;
    if (kind === "visible") obj.set("visible", obj.visible === false);
    else {
      const locked = !obj.lockMovementX;
      obj.set({
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
      });
    }
    obj.setCoords();
    c.requestRenderAll();
    refreshLayers(c);
    emit();
  }
  function moveLayer(obj, dir) {
    const c = canvas.current;
    if (!c) return;
    if (dir === "forward") obj.bringForward();
    else obj.sendBackwards();
    c.requestRenderAll();
    refreshLayers(c);
    emit();
  }
  function deleteLayer(obj) {
    const c = canvas.current;
    if (!c) return;
    c.remove(obj);
    c.discardActiveObject();
    c.requestRenderAll();
    refreshLayers(c);
    emit();
  }
  function readProps(c) {
    const o = c?.getActiveObject();
    if (!o) return null;
    return {
      isText: ["textbox", "i-text", "text"].includes(o.type),
      charSpacing: o.charSpacing || 0,
      strokeWidth: o.strokeWidth || 0,
      opacity: Math.round((o.opacity == null ? 1 : o.opacity) * 100),
    };
  }
  function applyProp(key, value) {
    const c = canvas.current,
      o = c?.getActiveObject();
    if (!o) return;
    if (key === "opacity") o.set("opacity", value / 100);
    else if (key === "charSpacing") o.set("charSpacing", value);
    else if (key === "strokeWidth")
      o.set({
        strokeWidth: value,
        stroke: value > 0 ? o.fill || "#101460" : o.stroke,
      });
    o.setCoords();
    c.requestRenderAll();
    setObjProps(readProps(c));
    emit();
  }
  function starPoints(spikes, outer, inner) {
    const pts = [{ x: 0, y: -outer }];
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    for (let i = 0; i < spikes; i++) {
      rot += step;
      pts.push({ x: Math.cos(rot) * inner, y: Math.sin(rot) * inner });
      rot += step;
      pts.push({ x: Math.cos(rot) * outer, y: Math.sin(rot) * outer });
    }
    return pts;
  }
  function finishAdd(obj) {
    const c = canvas.current;
    c.add(obj);
    obj.center();
    obj.setCoords();
    c.setActiveObject(obj);
    c.requestRenderAll();
    emit();
  }
  function addShape(kind) {
    if (!ready || !fabric.current) return;
    const f = fabric.current;
    const base = {
      fill: textColor,
      cornerColor: "#3442CA",
      borderColor: "#3442CA",
      transparentCorners: false,
    };
    let obj = null;
    if (kind === "rect")
      obj = new f.Rect({ ...base, width: 220, height: 150, rx: 14, ry: 14 });
    else if (kind === "circle") obj = new f.Circle({ ...base, radius: 95 });
    else if (kind === "triangle")
      obj = new f.Triangle({ ...base, width: 210, height: 180 });
    else if (kind === "star")
      obj = new f.Polygon(starPoints(5, 110, 48), base);
    else if (kind === "heart")
      obj = new f.Path(
        "M 100 170 C 20 120 0 85 0 55 C 0 22 22 0 48 0 C 70 0 90 12 100 32 C 110 12 130 0 152 0 C 178 0 200 22 200 55 C 200 85 180 120 100 170 Z",
        base,
      );
    else if (kind === "line")
      obj = new f.Line([0, 0, 280, 0], {
        ...base,
        fill: undefined,
        stroke: textColor,
        strokeWidth: 10,
      });
    if (obj) finishAdd(obj);
  }
  function addClipart(item, dy = 0) {
    if (!ready || !fabric.current) return;
    fabric.current
      .loadSVGFromString(item.svg)
      .then(({ objects, options }) => {
        const c = canvas.current;
        if (!c) return;
        const grp = fabric.current.util.groupSVGElements(objects, options);
        grp.scaleToWidth(180);
        grp.set({ cornerColor: "#3442CA", borderColor: "#3442CA", transparentCorners: false });
        c.add(grp);
        grp.center();
        if (dy) grp.set("top", grp.top + dy);
        grp.setCoords();
        c.setActiveObject(grp);
        c.requestRenderAll();
        emit();
      })
      .catch(() => setError(tr("errImageRead")));
  }
  function applyTemplate(tpl) {
    if (!ready || !fabric.current) return;
    const f = fabric.current,
      c = canvas.current;
    const clip = CLIPARTS.find((x) => x.id === tpl.clip);
    if (clip) addClipart(clip, -175);
    const title = new f.Textbox(tpl.title, {
      width: 500,
      fontSize: 66,
      fontFamily: tpl.font,
      fontWeight: "bold",
      fill: tpl.color,
      textAlign: "center",
    });
    c.add(title);
    title.center();
    title.set("top", 318);
    title.setCoords();
    const sub = new f.Textbox(tpl.sub, {
      width: 500,
      fontSize: 29,
      fontFamily: "Montserrat",
      charSpacing: 150,
      fill: tpl.color,
      textAlign: "center",
    });
    c.add(sub);
    sub.center();
    sub.set("top", 414);
    sub.setCoords();
    c.setActiveObject(title);
    c.requestRenderAll();
    emit();
  }
  useImperativeHandle(ref, () => ({
    exportJSON: () => canvas.current?.toObject(),
    exportPNG: () => capturePNG(),
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
        const selection = () => {
          const o = instance.getActiveObject();
          setSelected(Boolean(o));
          setObjProps(readProps(instance));
          if (o && ["textbox", "i-text", "text"].includes(o.type) && o.fontFamily)
            setFont(o.fontFamily);
        };
        instance.on("selection:created", selection);
        instance.on("selection:updated", selection);
        instance.on("selection:cleared", selection);
        const refresh = () => refreshLayers(instance);
        instance.on("object:added", refresh);
        instance.on("object:removed", refresh);
        instance.on("object:modified", refresh);
        instance.on("selection:created", refresh);
        instance.on("selection:updated", refresh);
        instance.on("selection:cleared", refresh);
        const snap = () => scheduleSnapshot(instance);
        instance.on("object:added", snap);
        instance.on("object:removed", snap);
        instance.on("object:modified", snap);
        instance.on("text:changed", snap);
        undoStack.current = [JSON.stringify(instance.toJSON())];
        redoStack.current = [];
        setHist({ u: 1, r: 0 });
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
    if (initialImage === lastEmit.current) return;
    const current = ++generation.current;
    fabric.current.FabricImage.fromURL(initialImage)
      .then((img) => {
        if (current !== generation.current || !canvas.current) return;
        canvas.current.clear();
        const scale =
          img.width === 600 && img.height === 720
            ? 1
            : Math.min(540 / img.width, 660 / img.height);
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
      const scale = Math.min(540 / img.width, 660 / img.height);
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
      fontFamily: font,
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
    const src = capturePNG();
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
          <select
            className="font-select"
            aria-label={tr("fontLabel")}
            value={font}
            onChange={(e) => {
              setFont(e.target.value);
              const o = canvas.current?.getActiveObject();
              if (o && ["textbox", "i-text", "text"].includes(o.type)) {
                o.set("fontFamily", e.target.value);
                canvas.current.requestRenderAll();
                emit();
              }
            }}
          >
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
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
      {objProps && (
        <div className="text-props">
          {objProps.isText && (
            <div className="prop-row">
              <span>{tr("spacingLabel")}</span>
              <input
                type="range"
                min="-20"
                max="300"
                step="5"
                value={objProps.charSpacing}
                onChange={(e) => applyProp("charSpacing", Number(e.target.value))}
              />
            </div>
          )}
          {objProps.isText && (
            <div className="prop-row">
              <span>{tr("strokeLabel")}</span>
              <input
                type="range"
                min="0"
                max="2.5"
                step="0.1"
                value={objProps.strokeWidth}
                onChange={(e) => applyProp("strokeWidth", Number(e.target.value))}
              />
            </div>
          )}
          <div className="prop-row">
            <span>{tr("opacityLabel")}</span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={objProps.opacity}
              onChange={(e) => applyProp("opacity", Number(e.target.value))}
            />
          </div>
        </div>
      )}
      <div className="element-tools">
        <div className="field-label">{tr("templatesTitle")}</div>
        <div className="template-grid">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="template-card"
              disabled={!ready || !!busy}
              onClick={() => applyTemplate(tpl)}
            >
              <span style={{ fontFamily: tpl.font }}>{tpl.title}</span>
              <small>{tpl.name}</small>
            </button>
          ))}
        </div>
        <div className="field-label">{tr("shapesTitle")}</div>
        <div className="shape-row">
          {SHAPE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className="secondary mini-btn"
              disabled={!ready || !!busy}
              onClick={() => addShape(id)}
            >
              {tr("shp" + id[0].toUpperCase() + id.slice(1))}
            </button>
          ))}
        </div>
        <div className="field-label">{tr("clipartTitle")}</div>
        <div className="clipart-grid">
          {CLIPARTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="clipart-btn"
              title={c.label}
              aria-label={c.label}
              disabled={!ready || !!busy}
              onClick={() => addClipart(c)}
              dangerouslySetInnerHTML={{ __html: c.svg }}
            />
          ))}
        </div>
      </div>
      <div className="editor-canvas-shell">
        <canvas ref={element} aria-label={tr("canvasLabel")} />
      </div>
      <div className="zoom-bar">
        <button
          type="button"
          className="icon-button mini"
          aria-label={tr("zoomOut")}
          disabled={!ready}
          onClick={() => applyZoom(zoomRef.current - 0.1)}
        >
          <Minus size={15} />
        </button>
        <input
          type="range"
          min="50"
          max="200"
          step="5"
          value={Math.round(zoom * 100)}
          aria-label={tr("zoomLabel")}
          onChange={(e) => applyZoom(Number(e.target.value) / 100)}
        />
        <button
          type="button"
          className="icon-button mini"
          aria-label={tr("zoomIn")}
          disabled={!ready}
          onClick={() => applyZoom(zoomRef.current + 0.1)}
        >
          <Plus size={15} />
        </button>
        <span className="zoom-pct">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="editor-tools">
        <button
          type="button"
          className="icon-button"
          disabled={hist.u < 2 || !!busy}
          aria-label={tr("undoLabel")}
          title={tr("undoLabel")}
          onClick={undo}
        >
          <Undo2 size={17} />
        </button>
        <button
          type="button"
          className="icon-button"
          disabled={!hist.r || !!busy}
          aria-label={tr("redoLabel")}
          title={tr("redoLabel")}
          onClick={redo}
        >
          <Redo2 size={17} />
        </button>
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
      <div className="layers-panel">
        <div className="field-label">{tr("layersTitle")}</div>
        {layers.length === 0 ? (
          <p className="small-note">{tr("layersEmpty")}</p>
        ) : (
          <ul className="layers-list">
            {layers.map((l) => (
              <li key={l.lid} className={"layer-row" + (l.active ? " active" : "")}>
                <button type="button" className="layer-name" onClick={() => selectLayer(l.obj)}>
                  {l.label}
                </button>
                <button
                  type="button"
                  className="icon-button mini"
                  aria-label={l.visible ? tr("layerHide") : tr("layerShow")}
                  title={l.visible ? tr("layerHide") : tr("layerShow")}
                  onClick={() => toggleLayer(l.obj, "visible")}
                >
                  {l.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  className="icon-button mini"
                  aria-label={l.locked ? tr("layerUnlock") : tr("layerLock")}
                  title={l.locked ? tr("layerUnlock") : tr("layerLock")}
                  onClick={() => toggleLayer(l.obj, "lock")}
                >
                  {l.locked ? <Lock size={15} /> : <LockOpen size={15} />}
                </button>
                <button
                  type="button"
                  className="icon-button mini"
                  aria-label={tr("layerForward")}
                  title={tr("layerForward")}
                  onClick={() => moveLayer(l.obj, "forward")}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  className="icon-button mini"
                  aria-label={tr("layerBackward")}
                  title={tr("layerBackward")}
                  onClick={() => moveLayer(l.obj, "backward")}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  className="icon-button mini"
                  aria-label={tr("toolDelete")}
                  title={tr("toolDelete")}
                  onClick={() => deleteLayer(l.obj)}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
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
