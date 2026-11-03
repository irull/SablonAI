"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, MessageCircle, Plus, Sparkles } from "lucide-react";
import { config, formatRupiah as rp } from "../lib/config";
import { SHOP_PRODUCTS } from "../lib/shopProducts";
import { translate } from "../lib/i18n";

// Beranda ala Sablon Studio (Nov 2026): hero + ticker + Koleksi kaos +
// Cara pesan dalam satu halaman. Isi & harga tetap data toko asli:
// kartu desain contoh = kaos pendek (Rp50.000) + sablon depan A4
// (Rp30.000) = Rp80.000; kartu polos = harga kaos saja.
// Kanvas hero: foto kaos toko diwarnai ulang mengikuti warna pilihan
// (teknik sama dengan mockup 2D studio; Putih = foto asli tanpa tint
// supaya tidak jadi abu-abu). Gambar ditampilkan cover-fit.
function HeroShirt({ colorHex, alt }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const canvas = ref.current;
    if (!canvas) return;
    const load = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    (async () => {
      try {
        const [photo, mask] = await Promise.all([
          load(config.mockup.front),
          load(config.mockup.mask),
        ]);
        if (cancelled) return;
        const W = 800, H = 740;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(W / photo.width, H / photo.height);
        const dw = photo.width * scale, dh = photo.height * scale;
        const dx = (W - dw) / 2, dy = (H - dh) / 2;
        ctx.fillStyle = "#eef0e4";
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(photo, dx, dy, dw, dh);
        if ((colorHex || "").toLowerCase() === "#f2f0e8") return;
        const pc = document.createElement("canvas");
        pc.width = W; pc.height = H;
        const px = pc.getContext("2d");
        px.drawImage(photo, dx, dy, dw, dh);
        const pixels = px.getImageData(0, 0, W, H);
        const mc = document.createElement("canvas");
        mc.width = W; mc.height = H;
        const mx = mc.getContext("2d");
        mx.drawImage(mask, dx, dy, dw, dh);
        const maskData = mx.getImageData(0, 0, W, H).data;
        const hex = (colorHex || "#f2f0e8").replace("#", "");
        const cr = parseInt(hex.slice(0, 2), 16);
        const cg = parseInt(hex.slice(2, 4), 16);
        const cb = parseInt(hex.slice(4, 6), 16);
        for (let i = 0; i < pixels.data.length; i += 4) {
          if (maskData[i + 3] < 24) continue;
          const light =
            (0.2126 * pixels.data[i] +
              0.7152 * pixels.data[i + 1] +
              0.0722 * pixels.data[i + 2]) /
            245;
          pixels.data[i] = cr * light;
          pixels.data[i + 1] = cg * light;
          pixels.data[i + 2] = cb * light;
        }
        px.putImageData(pixels, 0, 0);
        ctx.drawImage(pc, 0, 0);
      } catch {
        /* foto gagal dimuat: kanvas kosong */
      }
    })();
    return () => { cancelled = true; };
  }, [colorHex]);
  return <canvas ref={ref} className="hero-photo" role="img" aria-label={alt} />;
}

export default function HomePanel({ onStudio, onUseDesign, onCustomize, onCollection, onAddCart, t }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const [heroColor, setHeroColor] = useState(config.colors[0]);
  return (
    <div className="home-panel">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="hero-dot" /> {tr("homeEyebrow")}
          </div>
          <h1>
            {tr("homeTitle")} <em>{tr("homeTitleAccent")}</em>
          </h1>
          <p>{tr("homeSub")}</p>
          <div className="hero-actions">
            <button
              type="button"
              className="primary"
              onClick={() => onStudio("ai")}
            >
              {tr("homeCtaStudio")} <ArrowUpRight size={16} />
            </button>
            <button type="button" className="text-link" onClick={onCollection}>
              {tr("homeCtaCatalog")} <ArrowRight size={15} />
            </button>
          </div>
          <div className="hero-note">
            <span>✳</span> {tr("homeNote")}
          </div>
        </div>
        <div className="hero-art">
          <HeroShirt colorHex={heroColor.hex} alt={tr("mockupShop")} />
          <div className="float-tag tag-ai">
            <Sparkles size={22} />
            <span>
              {tr("genHello")}
              <br />
              <b>{tr("toolAi")}</b>
            </span>
          </div>
          <div className="float-tag tag-colors">
            <span>{tr("colorLabel")} · {heroColor.name}</span>
            <div>
              {config.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className="hero-dot"
                  style={{ background: c.hex }}
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={heroColor.name === c.name}
                  onClick={() => setHeroColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="round-stamp">
            DESIGN YOUR
            <br />
            <b>OWN STORY</b>
            <br />✳
          </div>
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>{tr("homeTicker")} ✳ </span>
          ))}
        </div>
      </div>
      <section className="home-collection" id="koleksi">
        <div className="section-top">
          <div>
            <div className="eyebrow">{tr("homeCollEyebrow")}</div>
            <h2>{tr("homeCollTitle")}</h2>
          </div>
          <span>{tr("homeCollNote")}</span>
        </div>
        <div className="products-grid">
          {SHOP_PRODUCTS.map((p) => (
            <article className="product-card" key={p.id}>
              <div className="product-image photo">
                <img src={p.image} alt={p.name} loading="lazy" />
              </div>
              <h3>{p.name}</h3>
              <div className="desc">{p.meta}</div>
              <div className="product-bottom">
                <b className="price">{rp(p.price)}</b>
                <div className="product-actions">
                  <button
                    type="button"
                    className="secondary mini-btn"
                    onClick={() => onStudio("upload")}
                  >
                    {tr("homeCollCustomize")}
                  </button>
                  <button
                    type="button"
                    className="round-btn"
                    aria-label={tr("cartAdd") + " — " + p.name}
                    title={tr("cartAdd")}
                    onClick={() =>
                      onAddCart({
                        title: p.name,
                        designTitle: p.name,
                        artwork: p.image,
                        colorName: p.colorName,
                        frontPrintId: p.frontPrintId,
                        backPrintId: p.backPrintId,
                      })
                    }
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          <article className="product-card">
            <div className="product-image">
              <span className="badge">{tr("homeCollPlain")}</span>
              <img
                src="/assets/mockup-kaos-putih.jpg"
                alt={tr("homeCollPlain")}
                loading="lazy"
              />
            </div>
            <h3>{tr("homeCollPlain")}</h3>
            <div className="desc">{tr("colorNote")}</div>
            <div className="product-bottom">
              <b>{rp(50000)}</b>
              <div className="product-actions">
                <button
                  type="button"
                  className="primary mini-btn"
                  onClick={() => onStudio("upload")}
                >
                  {tr("homeCtaStudio")}
                </button>
                <button
                  type="button"
                  className="round-btn"
                  aria-label={tr("cartAdd") + " — " + config.products[0].name}
                  title={tr("cartAdd")}
                  onClick={() =>
                    onAddCart({
                      title: config.products[0].name,
                      designTitle: "",
                      artwork: null,
                      frontPrintId: null,
                    })
                  }
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
      <section className="home-how">
        <div>
          <div className="eyebrow">{tr("caraEyebrow")}</div>
          <h2>{tr("caraTitle")}</h2>
          <a
            className="secondary wa-cta"
            href={"https://wa.me/" + config.whatsappNumber}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={16} /> {tr("caraWa")}
          </a>
        </div>
        <article>
          <b>01 /</b>
          <h3>{tr("cara1Title")}</h3>
          <p>{tr("cara1Text")}</p>
        </article>
        <article>
          <b>02 /</b>
          <h3>{tr("cara2Title")}</h3>
          <p>{tr("cara2Text")}</p>
        </article>
        <article>
          <b>03 /</b>
          <h3>{tr("cara3Title")}</h3>
          <p>{tr("cara3Text")}</p>
        </article>
      </section>
    </div>
  );
}
