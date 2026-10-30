"use client";
import { useMemo, useState } from "react";
import { Check, MessageCircle, Shirt } from "lucide-react";
import { config, formatRupiah as rp } from "../lib/config";
import { productPrice } from "../lib/pricing";
import { buildReadyOrder } from "../lib/orders";
import {
  buildWhatsAppOrderLink,
  isValidPhoneId,
  normalizePhoneId,
} from "../lib/whatsapp";
import { translate } from "../lib/i18n";
import OptionGroup from "./ui/OptionGroup";
import ColourGroup from "./ui/ColourGroup";

// Stage 4 irisan A: katalog produk siap pakai. Pelanggan memilih produk,
// ukuran, warna, jumlah, lalu order tersimpan seperti order studio
// (source "katalog") dan bisa diteruskan ke WhatsApp toko.
export default function CatalogPanel({ onSave, t }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const [productId, setProductId] = useState(null);
  const [size, setSize] = useState("M");
  const [color, setColor] = useState(config.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const product = useMemo(
    () => config.products.find((p) => p.id === productId) || null,
    [productId],
  );
  const unit = product ? productPrice(product, size) : 0;

  function choose(p) {
    setProductId(p.id);
    setSize(p.sizes.includes("M") ? "M" : p.sizes[0]);
    setSaved(null);
    setError("");
  }

  async function save() {
    setError("");
    if (!name.trim()) {
      setError(tr("errCatalogName"));
      return;
    }
    if (!isValidPhoneId(phone)) {
      setError(tr("errCatalogPhone"));
      return;
    }
    setBusy(true);
    try {
      const order = buildReadyOrder({
        customer: name.trim(),
        phone: normalizePhoneId(phone),
        productId,
        size,
        color,
        quantity: Number(quantity),
      });
      await onSave(order);
      setSaved(order);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="catalog-section">
      <div className="section-title">
        <div>
          <div className="eyebrow">{tr("catEyebrow")}</div>
          <h2>{tr("catTitle")}</h2>
          <p>{tr("catSub")}</p>
        </div>
      </div>
      <div className="catalog-grid">
        {config.products.map((p, i) => (
          <article
            key={p.id}
            className={"product-card" + (productId === p.id ? " selected" : "")}
          >
            <div className={"product-art art-" + (i % 3)}>
              <Shirt size={40} />
            </div>
            <strong>{p.name}</strong>
            <span className="product-meta">
              {tr("catFrom")} {rp(p.basePrice)} ·{" "}
              {tr("catSizes", { n: p.sizes.length })}
            </span>
            <button
              type="button"
              className={productId === p.id ? "secondary" : "primary"}
              onClick={() => choose(p)}
            >
              {productId === p.id ? tr("catSelected") : tr("catOrderBtn")}
            </button>
          </article>
        ))}
      </div>
      {product && (
        <div className="card catalog-form">
          <h3>
            {tr("catFormTitle")} · {product.name}
          </h3>
          <p className="small-note">{tr("catDesignNote")}</p>
          <OptionGroup
            label={tr("catSizeLabel")}
            value={size}
            onChange={setSize}
            options={product.sizes.map((s) => ({
              value: s,
              label: s + " · " + rp(productPrice(product, s)),
            }))}
          />
          <ColourGroup
            label={tr("colorLabel")}
            colors={config.colors}
            value={color}
            onChange={setColor}
            t={tr}
          />
          <div className="order-form">
            <label className="field-label" htmlFor="cat-name">
              {tr("catNameLabel")}
            </label>
            <input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr("catNamePlaceholder")}
              autoComplete="name"
            />
            <label className="field-label" htmlFor="cat-phone">
              {tr("catPhoneLabel")}
            </label>
            <input
              id="cat-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={tr("catPhonePlaceholder")}
              inputMode="tel"
              autoComplete="tel"
            />
            <label className="field-label" htmlFor="cat-qty">
              {tr("catQtyLabel")}
            </label>
            <input
              id="cat-qty"
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="catalog-total">
            <span>{tr("catTotalLabel")}</span>
            <strong>{rp(unit * (Number(quantity) || 0))}</strong>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            className="primary full"
            disabled={busy}
            onClick={save}
          >
            <Check size={16} /> {tr("catSaveBtn")}
          </button>
          {saved && (
            <div className="success-note">
              <span>{tr("catSavedNote")}</span>
              <a
                className="wa-link"
                href={buildWhatsAppOrderLink(saved)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={15} /> {tr("catWaBtn")}
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
