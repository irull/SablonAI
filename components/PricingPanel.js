"use client";
import { useState } from "react";
import { ArrowRight, CheckCheck, LoaderCircle, Shirt } from "lucide-react";
import { config, formatRupiah as rp } from "../lib/config";
import {
  calculatePrice,
  getProduct,
  productPrice,
} from "../lib/pricing";
import OptionGroup from "./ui/OptionGroup";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import {
  buildWhatsAppOrderLink,
  isValidPhoneId,
  normalizePhoneId,
} from "../lib/whatsapp";

const MASKING_IMAGES = {
  "10x10": "/assets/masking/sablon-10x10.jpg",
  A5: "/assets/masking/sablon-A5-14x21.jpg",
  A4: "/assets/masking/sablon-A4-21x28.jpg",
  A3: "/assets/masking/sablon-A3-28x42.jpg",
};

function MaskingFigure({ print, sideLabel, usedLabel }) {
  const src = MASKING_IMAGES[print.id];
  if (!src) return null;
  return (
    <figure className="masking-figure">
      <img
        src={src}
        alt={"Contoh posisi sablon " + sideLabel + " ukuran " + print.label}
        loading="lazy"
      />
      <figcaption>
        Contoh posisi sablon {sideLabel}: {print.position}. Ukuran yang
        dijual {usedLabel} — tulisan ukuran pada gambar hanya contoh
        posisi, bukan patokan.
      </figcaption>
    </figure>
  );
}

function SizeChart({ productId }) {
  const chart =
    productId === "kaos-anak"
      ? config.sizeCharts.anak
      : productId === "kaos-pendek" || productId === "kaos-panjang"
        ? config.sizeCharts.dewasa
        : null;
  if (!chart) return null;
  const img =
    productId === "kaos-anak"
      ? "/assets/size-chart/kaos-anak.jpg"
      : "/assets/size-chart/kaos-dewasa.jpg";
  return (
    <Disclosure>
      <DisclosureButton className="text-button size-chart-toggle">
        Lihat tabel ukuran
      </DisclosureButton>
      <DisclosurePanel>
        <table className="size-chart-table">
          <thead>
            <tr>
              <th>Ukuran</th>
              <th>Lebar (cm)</th>
              <th>Panjang (cm)</th>
              <th>Lengan (cm)</th>
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((r) => (
              <tr key={r.size}>
                <td>{r.size}</td>
                <td>{r.lebar}</td>
                <td>{r.panjang}</td>
                <td>{r.lengan ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small-note">{chart.note}</p>
        <img
          className="size-chart-img"
          src={img}
          alt="Gambar tabel ukuran kaos dari toko"
          loading="lazy"
        />
      </DisclosurePanel>
    </Disclosure>
  );
}

export default function PricingPanel({
  productId,
  size,
  frontPrintId,
  backPrintId,
  onProduct,
  onSize,
  onFrontPrint,
  onBackPrint,
  frontOrientation = "portrait",
  backOrientation = "portrait",
  onFrontOrientation,
  onBackOrientation,
  onOrder,
  onDashboard,
}) {
  const [quantity, setQuantity] = useState(1),
    [customer, setCustomer] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const [phone, setPhone] = useState("");
  const product = getProduct(productId);
  const productPriceForSize = (s) => {
    try {
      return productPrice(product, s);
    } catch {
      return product.basePrice;
    }
  };
  const quote = calculatePrice({
    productId,
    size,
    frontPrintId,
    backPrintId,
    frontOrientation,
    backOrientation,
    quantity,
  });
  const frontPrint = config.printSizes.find((p) => p.id === frontPrintId);
  const backPrint = backPrintId
    ? config.printSizes.find((p) => p.id === backPrintId)
    : null;
  async function save(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (customer.trim().length < 2) {
      setError("Isi nama pelanggan, minimal 2 karakter.");
      return;
    }
    if (!isValidPhoneId(phone)) {
      setError("Isi nomor WhatsApp yang valid, contoh 081234567890.");
      return;
    }
    setSaving(true);
    try {
      const order = await onOrder({
        productId,
        product: product.name,
        size,
        frontPrintId,
        backPrintId,
        frontOrientation,
        backOrientation,
        quantity,
        customer: customer.trim(),
        phone: normalizePhoneId(phone),
        quote,
      });
      setSuccess("Order " + order.id + " tersimpan di browser ini.");
      setLastOrder(order);
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
      <OptionGroup
        label="1 · Produk"
        value={productId}
        onChange={(v) => {
          onProduct(v);
          setSuccess("");
        }}
        options={config.products.map((p) => ({
          value: p.id,
          label: `${p.name} — ${rp(p.basePrice)}`,
        }))}
      />
      <OptionGroup
        label="2 · Ukuran kaos"
        value={size}
        onChange={(v) => {
          onSize(v);
          setSuccess("");
        }}
        options={product.sizes.map((s) => ({
          value: s,
          label:
            product.sizes.length === 1
              ? s
              : `${s} — ${rp(productPriceForSize(s))}`,
        }))}
      />
      <SizeChart productId={productId} />
      <OptionGroup
        label="3 · Sablon depan"
        value={frontPrintId}
        onChange={(v) => {
          onFrontPrint(v);
          setSuccess("");
        }}
        options={config.printSizes.map((p) => ({
          value: p.id,
          label: `${p.label} — ${rp(p.price)}`,
        }))}
      />
      {frontPrint && frontPrint.wCm === frontPrint.hCm ? (
        <p className="small-note">
          Kotak {frontPrint.wCm}×{frontPrint.hCm} cm — orientasi tidak
          berpengaruh.
        </p>
      ) : (
        <OptionGroup
          label="Orientasi sablon depan"
          value={frontOrientation}
          onChange={(v) => {
            onFrontOrientation(v);
            setSuccess("");
          }}
          options={
            frontPrint
              ? [
                  {
                    value: "portrait",
                    label: `Potret ${frontPrint.wCm}×${frontPrint.hCm} cm`,
                  },
                  {
                    value: "landscape",
                    label: `Lanskap ${frontPrint.hCm}×${frontPrint.wCm} cm`,
                  },
                ]
              : []
          }
        />
      )}
      <p className="small-note">
        Dipakai di mockup: {quote.frontPrintLabel} — {rp(quote.front)}.
        Harga tidak berubah antara potret dan lanskap.
      </p>
      {frontPrint && (
        <MaskingFigure
          print={frontPrint}
          sideLabel="depan"
          usedLabel={quote.frontPrintLabel}
        />
      )}
      <OptionGroup
        label="4 · Sablon belakang"
        value={backPrintId}
        onChange={(v) => {
          onBackPrint(v);
          setSuccess("");
        }}
        options={[
          { value: null, label: "Tanpa sablon — Rp0" },
          ...config.printSizes.map((p) => ({
            value: p.id,
            label: `${p.label} — ${rp(p.price)}`,
          })),
        ]}
      />
      {backPrint && backPrint.wCm === backPrint.hCm ? (
        <p className="small-note">
          Kotak {backPrint.wCm}×{backPrint.hCm} cm — orientasi tidak
          berpengaruh.
        </p>
      ) : backPrint ? (
        <OptionGroup
          label="Orientasi sablon belakang"
          value={backOrientation}
          onChange={(v) => {
            onBackOrientation(v);
            setSuccess("");
          }}
          options={[
            {
              value: "portrait",
              label: `Potret ${backPrint.wCm}×${backPrint.hCm} cm`,
            },
            {
              value: "landscape",
              label: `Lanskap ${backPrint.hCm}×${backPrint.wCm} cm`,
            },
          ]}
        />
      ) : null}
      {backPrint && (
        <p className="small-note">
          Untuk belakang: {quote.backPrintLabel} — {rp(quote.back)}.
        </p>
      )}
      {backPrint && (
        <MaskingFigure
          print={backPrint}
          sideLabel="belakang"
          usedLabel={quote.backPrintLabel}
        />
      )}
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
            : "Harga toko"}
        </span>
        <dl className="price-breakdown">
          <div>
            <dt>
              {product.name} {size}
            </dt>
            <dd>{rp(quote.shirt)}</dd>
          </div>
          <div>
            <dt>Sablon depan {frontPrint ? frontPrint.label : ""}</dt>
            <dd>{rp(quote.front)}</dd>
          </div>
          <div>
            <dt>
              Sablon belakang {backPrint ? backPrint.label : "(tanpa sablon)"}
            </dt>
            <dd>{rp(quote.back)}</dd>
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
        <label className="field-label" htmlFor="phone">
          Nomor WhatsApp
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setSuccess("");
          }}
          maxLength={17}
          placeholder="08xxxxxxxxxx"
          required
          inputMode="tel"
          autoComplete="tel"
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
          {lastOrder && (
            <a
              className="text-button"
              href={buildWhatsAppOrderLink(lastOrder)}
              target="_blank"
              rel="noreferrer"
            >
              Kirim ke toko via WhatsApp →
            </a>
          )}
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
