"use client";
import { useState } from "react";
import { Check, PackageSearch } from "lucide-react";
import { formatRupiah as rp } from "../lib/config";
import { findTrackedOrder, orderStatuses, trackingStepIndex } from "../lib/orders";
import { statusLabel, translate } from "../lib/i18n";

// Stage 4 irisan B: lacak order untuk pelanggan. Cukup nomor order +
// nomor WhatsApp yang dipakai saat pesan; progres tampil sebagai
// langkah 5 tahap yang sama dengan dashboard pemilik.
export default function TrackingPanel({ orders, t, lang }) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const uiLang = lang || "id";
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [found, setFound] = useState(null);

  function search(e) {
    e.preventDefault();
    const order = findTrackedOrder(orders, orderId, phone);
    setFound(order);
    setError(order ? "" : tr("trkNotFound"));
  }

  const step = found ? trackingStepIndex(found) : -1;

  return (
    <section className="tracking-section">
      <div className="section-title">
        <div>
          <div className="eyebrow">{tr("trkEyebrow")}</div>
          <h2>{tr("trkTitle")}</h2>
          <p>{tr("trkSub")}</p>
        </div>
      </div>
      <form className="card tracking-form" onSubmit={search}>
        <div className="order-form">
          <label className="field-label" htmlFor="trk-id">
            {tr("trkIdLabel")}
          </label>
          <input
            id="trk-id"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={tr("trkIdPlaceholder")}
            autoComplete="off"
          />
          <label className="field-label" htmlFor="trk-phone">
            {tr("catPhoneLabel")}
          </label>
          <input
            id="trk-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={tr("catPhonePlaceholder")}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="primary full">
          <PackageSearch size={16} /> {tr("trkBtn")}
        </button>
      </form>
      {found && (
        <div className="card tracking-result">
          <div className="tracking-head">
            <div>
              <strong>{found.id}</strong>
              <span>
                {found.product} · {found.size} · {found.color.name} ·{" "}
                {found.quantity} pcs
              </span>
            </div>
            <div className="tracking-total">
              <span>{tr("catTotalLabel")}</span>
              <strong>{rp(found.quote.total)}</strong>
            </div>
          </div>
          <p className="small-note">
            {tr("trkStepOf", { a: step + 1, b: orderStatuses.length })} ·{" "}
            {new Date(found.createdAt).toLocaleDateString(
              uiLang === "en" ? "en-GB" : "id-ID",
              { timeZone: "Asia/Jakarta" },
            )}
          </p>
          <ol className="track-steps">
            {orderStatuses.map((s, i) => (
              <li
                key={s}
                className={
                  "track-step" +
                  (i < step ? " done" : i === step ? " current" : "")
                }
              >
                <span className="track-dot">
                  {i < step ? <Check size={14} strokeWidth={3.5} /> : i + 1}
                </span>
                <span className="track-label">{statusLabel(uiLang, s)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
