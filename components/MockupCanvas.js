"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar mockup tidak dapat dibuka."));
    img.src = src;
  });
}
const makeCanvas = (w, h) =>
  Object.assign(document.createElement("canvas"), { width: w, height: h });

// Paket 1C: foto asli toko, contain-fit (bukan stretch).
// Perubahan dari versi ilustrasi: foto + mask TIDAK lagi ditarik paksa
// ke 800x740. Foto asli itu potret 1184x1722, jadi ditarik paksa akan
// menggepengkan kaos. Sekarang dipakai contain-fit: foto digambar
// sesuai proporsi di dalam kanvas 800x740, latar diisi putih, mask
// digambar di rect yang sama persis, dan area cetak dihitung dari
// rect itu (tengah horizontal, atas dada = 30% tinggi foto).
// py lama 222/740 = 0.30, jadi fraksi 0.30 ini konsisten dengan
// area cetak lama saat foto mengisi penuh tinggi kanvas.
const MockupCanvas = forwardRef(function MockupCanvas(
  { artwork, color, printWidth, printHeight, showArea, side = "front" },
  ref,
) {
  const canvas = useRef(null);
  const photoData = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const renderId = useRef(0);
  const completed = useRef(false);
  useImperativeHandle(ref, () => ({
    export: () =>
      completed.current ? canvas.current?.toDataURL("image/jpeg", 0.85) : null,
  }));

  useEffect(() => {
    let active = true;
    setReady(false);
    const back = side === "back";
    Promise.all([
      loadImage(back ? "/assets/mockup-kaos-belakang.jpg" : "/assets/mockup-kaos-putih.jpg"),
      loadImage(back ? "/assets/mockup-kaos-belakang-mask.png" : "/assets/mockup-kaos-mask.png"),
    ])
      .then(([photo, mask]) => {
        if (!active) return;
        const scale = Math.min(800 / photo.width, 740 / photo.height);
        const drawW = photo.width * scale;
        const drawH = photo.height * scale;
        const offsetX = (800 - drawW) / 2;
        const offsetY = (740 - drawH) / 2;
        const p = makeCanvas(800, 740),
          m = makeCanvas(800, 740);
        const pc = p.getContext("2d");
        pc.fillStyle = "#ffffff";
        pc.fillRect(0, 0, 800, 740);
        pc.drawImage(photo, offsetX, offsetY, drawW, drawH);
        m.getContext("2d").drawImage(mask, offsetX, offsetY, drawW, drawH);
        photoData.current = {
          photo,
          pixels: p.getContext("2d").getImageData(0, 0, 800, 740),
          mask: m.getContext("2d").getImageData(0, 0, 800, 740),
          rect: { x: offsetX, y: offsetY, w: drawW, h: drawH },
        };
        setReady(true);
      })
      .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [side]);

  useEffect(() => {
    if (!ready) return;
    const id = ++renderId.current;
    completed.current = false;
    const draw = async () => {
      try {
        const art = artwork ? await loadImage(artwork) : null;
        if (id !== renderId.current || !canvas.current) return;
        const { photo, pixels, mask, rect } = photoData.current;
        const ctx = canvas.current.getContext("2d");
        ctx.clearRect(0, 0, 800, 740);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 800, 740);
        ctx.drawImage(photo, rect.x, rect.y, rect.w, rect.h);
        const tint = makeCanvas(800, 740),
          tc = tint.getContext("2d");
        tc.fillStyle = color;
        tc.fillRect(0, 0, 800, 740);
        const rgb = tc.getImageData(0, 0, 1, 1).data;
        const recolored = ctx.createImageData(800, 740);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const light = pixels.data[i] / 245;
          for (let c = 0; c < 3; c++)
            recolored.data[i + c] = Math.min(255, rgb[c] * light);
          recolored.data[i + 3] = mask.data[i + 3];
        }
        tc.putImageData(recolored, 0, 0);
        ctx.drawImage(tint, 0, 0);
        const pw = printWidth * 7,
          ph = printHeight * 7;
        const px = rect.x + (rect.w - pw) / 2,
          py = rect.y + rect.h * (side === "back" ? 0.25 : 0.3);
        if (art) {
          const layer = makeCanvas(800, 740),
            lc = layer.getContext("2d");
          const scale = Math.min(pw / art.width, ph / art.height);
          const aw = art.width * scale,
            ah = art.height * scale;
          lc.drawImage(art, px + (pw - aw) / 2, py + (ph - ah) / 2, aw, ah);
          const original = lc.getImageData(0, 0, 800, 740);
          const displaced = lc.createImageData(800, 740);
          for (
            let y = Math.max(0, Math.floor(py) - 5);
            y < Math.min(740, py + ph + 5);
            y++
          ) {
            for (
              let x = Math.max(0, Math.floor(px) - 5);
              x < Math.min(800, px + pw + 5);
              x++
            ) {
              const i = (y * 800 + x) * 4;
              const l = pixels.data[i] / 255;
              const left = pixels.data[(y * 800 + Math.max(0, x - 4)) * 4];
              const right = pixels.data[(y * 800 + Math.min(799, x + 4)) * 4];
              const sx = Math.max(
                0,
                Math.min(
                  799,
                  Math.round(x + (right - left) * 0.12 + (l - 0.9) * 8),
                ),
              );
              const sy = Math.max(
                0,
                Math.min(739, Math.round(y + (l - 0.9) * 6)),
              );
              const s = (sy * 800 + sx) * 4;
              for (let c = 0; c < 3; c++)
                displaced.data[i + c] =
                  original.data[s + c] * (0.43 + 0.57 * l);
              displaced.data[i + 3] =
                original.data[s + 3] * (mask.data[i + 3] / 255) * 0.98;
            }
          }
          lc.putImageData(displaced, 0, 0);
          ctx.drawImage(layer, 0, 0);
          ctx.save();
          ctx.globalCompositeOperation = "overlay";
          ctx.globalAlpha = 0.055;
          ctx.drawImage(layer, 0, 0);
          ctx.restore();
        }
        if (showArea) {
          ctx.save();
          ctx.strokeStyle = "#75816d";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([7, 7]);
          ctx.strokeRect(px, py, pw, ph);
          ctx.restore();
        }
        completed.current = true;
        setError("");
      } catch (e) {
        if (id === renderId.current) setError(e.message);
      }
    };
    draw();
    return () => {
      renderId.current++;
    };
  }, [ready, artwork, color, printWidth, printHeight, showArea, side]);

  return (
    <>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <canvas
        ref={canvas}
        width="800"
        height="740"
        className="mockup-canvas"
        aria-label={`Pratinjau kaos dengan area cetak ${printWidth} kali ${printHeight} sentimeter`}
        role="img"
      />
    </>
  );
});
export default MockupCanvas;
