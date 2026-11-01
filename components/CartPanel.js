"use client";
import { useState } from "react";
import {
  ArrowRight,
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  Minus,
  Plus,
  Shirt,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { formatRupiah as rp } from "../lib/config";
import { calculatePrice } from "../lib/pricing";
import { isValidPhoneId } from "../lib/whatsapp";

// Halaman Keranjang (Nov 2026): item dari Koleksi kaos + Studio DIY.
// Harga selalu dihitung ulang dari konfigurasi item, checkout membuat
// satu order per item (source "keranjang") lalu menawarkan tautan
// WhatsApp berisi ringkasan semua item.
export default function CartPanel({
  t,
  items,
  onQty,
  onRemove,
  onCheckout,
  onStudio,
  onCollection,
  onOrders,
}) {
  const tr = t;
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const lines = items.map((item) => {
    let quote = null;
    try {
      quote = calculatePrice({
        productId: item.productId,
        size: item.size,
        frontPrintId: item.frontPrintId || null,
        backPrintId: item.backPrintId || null,
        frontOrientation: item.frontOrientation || "portrait",
        backOrientation: item.backOrientation || "portrait",
        quantity: item.quantity || 1,
        allowNoPrint: true,
      });
    } catch {
      quote = null;
    }
    return { item, quote };
  });
  const total = lines.reduce((sum, l) => sum + (l.quote ? l.quote.total : 0), 0);

  async function checkout(e) {
    e.preventDefault();
    setError("");
    if (customer.trim().length < 2) {
      setError(tr("errName"));
      return;
    }
    if (!isValidPhoneId(phone)) {
      setError(tr("errPhone"));
      return;
    }
    setBusy(true);
    try {
      const res = await onCheckout({ customer: customer.trim(), phone });
      setDone(res);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="cart-page card">
        <div className="cart-done">
          <CheckCheck size={40} />
          <h2>{tr("cartTitle")}</h2>
          <p>{tr("cartSuccess")}</p>
          <div className="cart-done-actions">
            <a
              className="primary"
              href={done.waLink}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> {tr("sendWa")}
            </a>
            <button type="button" className="secondary" onClick={onOrders}>
              {tr("tabOrders")} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{tr("cartTitle")}</span>
          <h1>{tr("cartTitle")}</h1>
        </div>
        <span className="cart-count">
          {items.length} item
        </span>
      </div>
      {items.length === 0 ? (
        <div className="cart-empty card">
          <ShoppingBag size={38} />
          <h3>{tr("cartEmpty")}</h3>
          <p>{tr("cartEmptyNote")}</p>
          <div className="cart-done-actions">
            <button type="button" className="primary" onClick={onStudio}>
              {tr("tabStudio")} <ArrowRight size={15} />
            </button>
            <button type="button" className="secondary" onClick={onCollection}>
              {tr("navCollection")}
            </button>
          </div>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-list card">
            {lines.map(({ item, quote }) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-thumb">
                  {item.artwork ? (
                    <img src={item.artwork} alt="" />
                  ) : (
                    <Shirt size={26} />
                  )}
                </div>
                <div className="cart-info">
                  <h3>{item.title}</h3>
                  <p>
                    {quote ? quote.product : item.productId} · {item.size} ·{" "}
                    {item.colorName}
                  </p>
                  <p>
                    {tr("viewFront")}:{" "}
                    {quote && quote.frontPrintLabel
                      ? quote.frontPrintLabel
                      : tr("noPrint")}{" "}
                    · {tr("viewBack")}:{" "}
                    {quote && quote.backPrintLabel
                      ? quote.backPrintLabel
                      : tr("noPrint")}
                  </p>
                </div>
                <div className="qty-stepper small">
                  <button
                    type="button"
                    aria-label="−"
                    onClick={() => onQty(item.id, (item.quantity || 1) - 1)}
                  >
                    <Minus size={13} />
                  </button>
                  <span>{item.quantity || 1}</span>
                  <button
                    type="button"
                    aria-label="+"
                    onClick={() => onQty(item.id, (item.quantity || 1) + 1)}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <b className="cart-line-total">
                  {quote ? rp(quote.total) : "—"}
                </b>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={tr("cartRemove")}
                  title={tr("cartRemove")}
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
          <form className="cart-summary card" onSubmit={checkout}>
            <div className="price-line total-line">
              <span>{tr("totalLabel")}</span>
              <strong>{rp(total)}</strong>
            </div>
            <p className="price-note">
              {tr("cartNote")} · {tr("shippingNote")}
            </p>
            <label className="field-label" htmlFor="cart-customer">
              {tr("nameLabel")}
            </label>
            <input
              id="cart-customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              maxLength={80}
              placeholder={tr("namePlaceholder")}
              autoComplete="off"
            />
            <label className="field-label" htmlFor="cart-phone">
              {tr("phoneLabel")}
            </label>
            <input
              id="cart-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={17}
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
              autoComplete="tel"
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary full-width" disabled={busy} type="submit">
              {busy ? (
                <LoaderCircle size={16} className="spinner" />
              ) : (
                <ArrowRight size={16} />
              )}{" "}
              {tr("cartCheckout")}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
