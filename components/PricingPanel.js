"use client";
import { useState } from "react";
import { ArrowRight, CheckCheck, LoaderCircle, Shirt, X } from "lucide-react";
import { config, formatRupiah as rp } from "../lib/config";
import { calculatePrice } from "../lib/pricing";

export default function PricingPanel({
  width,
  height,
  onWidth,
  onHeight,
  onOrder,
  onDashboard,
}) {
  const [size, setSize] = useState("L"),
    [quantity, setQuantity] = useState(1),
    [customer, setCustomer] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const quote = calculatePrice({ size, width, height, quantity });
  async function save(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (customer.trim().length < 2) {
      setError("Isi nama pelanggan, minimal 2 karakter.");
      return;
    }
    setSaving(true);
    try {
      const order = await onOrder({
        size,
        width,
        height,
        quantity,
        customer: customer.trim(),
        quote,
      });
      setSuccess("Order " + order.id + " tersimpan di browser ini.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="settings-panel card">
      <div className="panel-heading">
        <span className="icon-tile neutral">
          <Shirt size={19} />
        </span>
        <div>
          <h2>Detail kaos</h2>
          <p>Pas di badan, pas di kantong.</p>
        </div>
      </div>
      <div className="field-label" id="size-label">
        Ukuran kaos
      </div>
      <div className="size-picker" role="group" aria-labelledby="size-label">
        {Object.keys(config.shirtPrices).map((s) => (
          <button
            key={s}
            className={size === s ? "active" : ""}
            aria-pressed={size === s}
            onClick={() => {
              setSize(s);
              setSuccess("");
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="section-label spaced">
        Ukuran cetak <span>maks. 32 × 45 cm</span>
      </div>
      <div className="dimension-fields">
        <label>
          Lebar{" "}
          <span>
            <input
              aria-label="Lebar cetak"
              type="number"
              min="1"
              max="32"
              step="0.5"
              value={width}
              onChange={(e) => {
                onWidth(Math.max(1, Math.min(32, +e.target.value || 1)));
                setSuccess("");
              }}
            />
            cm
          </span>
        </label>
        <X size={13} />
        <label>
          Tinggi{" "}
          <span>
            <input
              aria-label="Tinggi cetak"
              type="number"
              min="1"
              max="45"
              step="0.5"
              value={height}
              onChange={(e) => {
                onHeight(Math.max(1, Math.min(45, +e.target.value || 1)));
                setSuccess("");
              }}
            />
            cm
          </span>
        </label>
      </div>
      <div className="quantity-field">
        <label htmlFor="quantity" className="field-label">
          Jumlah kaos
        </label>
        <div>
          <input
            id="quantity"
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => {
              setQuantity(
                Math.max(1, Math.min(100, Math.trunc(+e.target.value) || 1)),
              );
              setSuccess("");
            }}
          />
          <span>pcs</span>
        </div>
      </div>
      <div className="pricing-box" aria-live="polite">
        <div className="eyebrow">ESTIMASI HARGA · {quantity} PCS</div>
        <strong className="price">{rp(quote.total)}</strong>
        <span className="price-caption">
          {config.pricingIsExample
            ? "Contoh, belum harga toko"
            : "Estimasi, dikonfirmasi toko"}
        </span>
        <dl className="price-breakdown">
          <div>
            <dt>Kaos {size}</dt>
            <dd>{rp(quote.shirt)}</dd>
          </div>
          <div>
            <dt>Cetak {quote.area} cm²</dt>
            <dd>{rp(quote.print)}</dd>
          </div>
          <div>
            <dt>Tambahan / kaos</dt>
            <dd>{rp(quote.extra)}</dd>
          </div>
          <div className="unit-price">
            <dt>Per kaos</dt>
            <dd>{rp(quote.unit)}</dd>
          </div>
        </dl>
      </div>
      <form onSubmit={save} className="order-form">
        <label className="field-label" htmlFor="customer">
          Nama pelanggan
        </label>
        <input
          id="customer"
          value={customer}
          onChange={(e) => {
            setCustomer(e.target.value);
            setSuccess("");
          }}
          maxLength={80}
          placeholder="Nama untuk order demo"
          required
          minLength={2}
          autoComplete="off"
        />
        <button className="primary full-width" disabled={saving} type="submit">
          {saving ? (
            <LoaderCircle size={16} className="spinner" />
          ) : (
            <ArrowRight size={16} />
          )}{" "}
          Simpan order demo
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <div className="success-note" role="status">
          {success}
          <button className="text-button" onClick={onDashboard}>
            Lihat di dashboard →
          </button>
        </div>
      )}
      <div className="production-note">
        <CheckCheck size={18} />
        <p>
          <strong>Desainmu ikut tersimpan.</strong>
          <br />
          Order lokal untuk demo. Belum dikirim ke toko dan belum ada
          pembayaran.
        </p>
      </div>
    </section>
  );
}
