"use client";
import { ArrowRight, ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import { config, formatRupiah as rp, sampleBriefs } from "../lib/config";
import { translate } from "../lib/i18n";

// Beranda ala Sablon Studio (Nov 2026): hero + ticker + Koleksi kaos +
// Cara pesan dalam satu halaman. Isi & harga tetap data toko asli:
// kartu desain contoh = kaos pendek (Rp50.000) + sablon depan A4
// (Rp30.000) = Rp80.000; kartu polos = harga kaos saja.
const DESIGN_CARD_PRICE = 50000 + 30000;

export default function HomePanel({ onStudio, onUseDesign, onCustomize, onCatalog, t }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
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
            <button type="button" className="text-link" onClick={onCatalog}>
              {tr("homeCtaCatalog")} <ArrowRight size={15} />
            </button>
          </div>
          <div className="hero-note">
            <span>✳</span> {tr("homeNote")}
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/assets/mockup-kaos-putih.jpg"
            alt={tr("mockupShop")}
            className="hero-photo"
          />
          <div className="float-tag tag-ai">
            <Sparkles size={22} />
            <span>
              {tr("genHello")}
              <br />
              <b>{tr("toolAi")}</b>
            </span>
          </div>
          <div className="float-tag tag-colors">
            <span>{tr("colorLabel")}</span>
            <div>
              {config.colors.map((c) => (
                <i key={c.name} style={{ background: c.hex }} title={c.name} />
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
      <section className="home-collection">
        <div className="section-top">
          <div>
            <div className="eyebrow">{tr("homeCollEyebrow")}</div>
            <h2>{tr("homeCollTitle")}</h2>
          </div>
          <span>{tr("homeCollNote")}</span>
        </div>
        <div className="products-grid">
          {sampleBriefs.map((s) => (
            <article className="product-card" key={s.id}>
              <div className="product-image">
                <span className="badge">{s.category}</span>
                <img src={s.image} alt={s.title} loading="lazy" />
              </div>
              <h3>{s.title}</h3>
              <div className="desc">{tr("homeCollWithPrint")}</div>
              <div className="product-bottom">
                <b>{rp(DESIGN_CARD_PRICE)}</b>
                <div className="product-actions">
                  <button
                    type="button"
                    className="secondary mini-btn"
                    onClick={() => onCustomize(s)}
                  >
                    {tr("homeCollCustomize")}
                  </button>
                  <button
                    type="button"
                    className="primary mini-btn"
                    onClick={() => onUseDesign(s)}
                  >
                    {tr("homeCollUse")}
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
