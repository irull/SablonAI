"use client";
import { useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { localDesigns } from "../lib/designs";
import { translate } from "../lib/i18n";

// Panel Gambar Studio DIY (Nov 2026): dua sumber desain siap pakai.
// 1) "Dari kami" — desain lokal toko dari lib/designs.js (file PNG di
//    public/designs/ atau public/assets/), klik = masuk kanvas.
// 2) "Stok foto" — pencarian Pexels + Pixabay lewat /api/stock (kunci
//    API di env server). Gambar yang dipilih dimuat lewat proxy
//    /api/stock?img= supaya kanvas tidak kotor oleh CORS.
export default function DesignGallery({ onPick, t }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const [tab, setTab] = useState("local");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [configured, setConfigured] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function search(e) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/stock?q=" + encodeURIComponent(query.trim()));
      const data = await r.json();
      setConfigured(Boolean(data.configured));
      setResults(Array.isArray(data.results) ? data.results : []);
      setSearched(true);
    } catch {
      setError(tr("stockError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="design-gallery">
      <h3 className="tool-title">{tr("imgTitle")}</h3>
      <div className="seg-row" role="group" aria-label={tr("imgTitle")}>
        <button
          type="button"
          className={"seg-btn" + (tab === "local" ? " on" : "")}
          aria-pressed={tab === "local"}
          onClick={() => setTab("local")}
        >
          {tr("imgLocalTab")}
        </button>
        <button
          type="button"
          className={"seg-btn" + (tab === "stock" ? " on" : "")}
          aria-pressed={tab === "stock"}
          onClick={() => setTab("stock")}
        >
          {tr("imgStockTab")}
        </button>
      </div>
      {tab === "local" && (
        <>
          {localDesigns.length === 0 ? (
            <p className="small-note">{tr("imgLocalEmpty")}</p>
          ) : (
            <div className="design-grid">
              {localDesigns.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="design-card"
                  onClick={() => onPick(d.src)}
                  title={d.name}
                >
                  <img src={d.src} alt={d.name} loading="lazy" />
                  <span>{d.name}</span>
                </button>
              ))}
            </div>
          )}
          <p className="small-note">{tr("imgLocalNote")}</p>
        </>
      )}
      {tab === "stock" && (
        <>
          <form className="stock-search" onSubmit={search}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("stockSearchPh")}
              maxLength={80}
              aria-label={tr("stockSearchPh")}
            />
            <button
              type="submit"
              className="secondary mini-btn"
              disabled={busy || query.trim().length < 2}
            >
              {busy ? (
                <LoaderCircle size={14} className="spinner" />
              ) : (
                <Search size={14} />
              )}{" "}
              {tr("stockSearchBtn")}
            </button>
          </form>
          {busy && <p className="small-note">{tr("stockBusy")}</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {configured === false && (
            <p className="small-note">{tr("stockNeedsKey")}</p>
          )}
          {configured && searched && results.length === 0 && !busy && (
            <p className="small-note">{tr("stockEmpty")}</p>
          )}
          {results.length > 0 && (
            <div className="design-grid">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="design-card"
                  title={tr("stockCredit", { name: r.credit, src: r.source })}
                  onClick={() =>
                    onPick("/api/stock?img=" + encodeURIComponent(r.full))
                  }
                >
                  <img src={r.thumb} alt={r.alt} loading="lazy" />
                  <span>
                    {r.credit} · {r.source}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
