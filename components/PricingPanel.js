"use client";
import { useState } from "react";
import { ArrowRight, CheckCheck, LoaderCircle, Pencil, Shirt, X } from "lucide-react";
import { config, formatRupiah as rp } from "../lib/config";
import {
  calculatePrice,
  getProduct,
  productPrice,
} from "../lib/pricing";
import OptionGroup from "./ui/OptionGroup";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { translate } from "../lib/i18n";
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

function MaskingFigure({ print, side, usedLabel, tr }) {
  const src = MASKING_IMAGES[print.id];
  if (!src) return null;
  const sideText = tr(side === "front" ? "sideFront" : "sideBack");
  return (
    <figure className="masking-figure">
      <img
        src={src}
        alt={tr("maskingAlt", { side: sideText, label: print.label })}
        loading="lazy"
      />
      <figcaption>
        {tr("maskingCaption", {
          side: sideText,
          position: print.position,
          used: usedLabel,
        })}
      </figcaption>
    </figure>
  );
}

function SizeChart({ productId, tr }) {
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
        {tr("sizeChartToggle")}
      </DisclosureButton>
      <DisclosurePanel>
        <table className="size-chart-table">
          <thead>
            <tr>
              <th>{tr("chartSize")}</th>
              <th>{tr("chartWidth")}</th>
              <th>{tr("chartLength")}</th>
              <th>{tr("chartSleeve")}</th>
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
          alt={tr("chartImgAlt")}
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
  t,
}) {
  const tr = t || ((key, vars) => translate("id", key, vars));
  const [quantity, setQuantity] = useState(1),
    [customer, setCustomer] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const [phone, setPhone] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
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
      setError(tr("errName"));
      return;
    }
    if (!isValidPhoneId(phone)) {
      setError(tr("errPhone"));
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
      setSuccess(tr("successSaved", { id: order.id }));
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
          <h2>{tr("ppTitle")}</h2>
          <p>{tr("ppSub")}</p>
        </div>
      </div>
      <dl className="spec-summary">
        <div>
          <dt>{tr("sumProduct")}</dt>
          <dd>
            {product.name} · {size}
          </dd>
        </div>
        <div>
          <dt>{tr("sumFront")}</dt>
          <dd>{quote.frontPrintLabel}</dd>
        </div>
        <div>
          <dt>{tr("sumBack")}</dt>
          <dd>{quote.backPrintLabel}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="secondary full-width detail-button"
        onClick={() => setDetailOpen(true)}
      >
        <Pencil size={15} /> {tr("detailEdit")}
      </button>
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        className="detail-dialog-root"
      >
        <div className="detail-backdrop" aria-hidden="true" />
        <div className="detail-wrap">
          <DialogPanel className="detail-card">
            <div className="detail-head">
              <DialogTitle>{tr("detailTitle")}</DialogTitle>
              <button
                type="button"
                className="icon-button"
                aria-label={tr("doneLabel")}
                onClick={() => setDetailOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
      <OptionGroup
        label={tr("stepProduct")}
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
        label={tr("stepSize")}
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
      <SizeChart productId={productId} tr={tr} />
      <OptionGroup
        label={tr("stepFront")}
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
          {tr("squareNote", { w: frontPrint.wCm, h: frontPrint.hCm })}
        </p>
      ) : (
        <OptionGroup
          label={tr("orientFront")}
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
                    label: `${tr("portrait")} ${frontPrint.wCm}×${frontPrint.hCm} cm`,
                  },
                  {
                    value: "landscape",
                    label: `${tr("landscape")} ${frontPrint.hCm}×${frontPrint.wCm} cm`,
                  },
                ]
              : []
          }
        />
      )}
      <p className="small-note">
        {tr("usedInMockup", {
          label: quote.frontPrintLabel,
          price: rp(quote.front),
        })}{" "}
        {tr("priceUnchanged")}
      </p>
      {frontPrint && (
        <MaskingFigure
          print={frontPrint}
          side="front"
          usedLabel={quote.frontPrintLabel}
          tr={tr}
        />
      )}
      <OptionGroup
        label={tr("stepBack")}
        value={backPrintId}
        onChange={(v) => {
          onBackPrint(v);
          setSuccess("");
        }}
        options={[
          { value: null, label: tr("noPrintOption") },
          ...config.printSizes.map((p) => ({
            value: p.id,
            label: `${p.label} — ${rp(p.price)}`,
          })),
        ]}
      />
      {backPrint && backPrint.wCm === backPrint.hCm ? (
        <p className="small-note">
          {tr("squareNote", { w: backPrint.wCm, h: backPrint.hCm })}
        </p>
      ) : backPrint ? (
        <OptionGroup
          label={tr("orientBack")}
          value={backOrientation}
          onChange={(v) => {
            onBackOrientation(v);
            setSuccess("");
          }}
          options={[
            {
              value: "portrait",
              label: `${tr("portrait")} ${backPrint.wCm}×${backPrint.hCm} cm`,
            },
            {
              value: "landscape",
              label: `${tr("landscape")} ${backPrint.hCm}×${backPrint.wCm} cm`,
            },
          ]}
        />
      ) : null}
      {backPrint && (
        <p className="small-note">
          {tr("backSummary", {
            label: quote.backPrintLabel,
            price: rp(quote.back),
          })}
        </p>
      )}
      {backPrint && (
        <MaskingFigure
          print={backPrint}
          side="back"
          usedLabel={quote.backPrintLabel}
          tr={tr}
        />
      )}
            <button
              type="button"
              className="primary full-width"
              onClick={() => setDetailOpen(false)}
            >
              {tr("doneLabel")}
            </button>
          </DialogPanel>
        </div>
      </Dialog>
      <div className="quantity-field">
        <label htmlFor="quantity" className="field-label">
          {tr("qtyLabel")}
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
        <div className="eyebrow">{tr("estimate", { qty: quantity })}</div>
        <strong className="price">{rp(quote.total)}</strong>
        <span className="price-caption">
          {config.pricingIsExample ? tr("priceExample") : tr("priceShop")}
        </span>
        <dl className="price-breakdown">
          <div>
            <dt>
              {product.name} {size}
            </dt>
            <dd>{rp(quote.shirt)}</dd>
          </div>
          <div>
            <dt>{tr("frontRow")} {frontPrint ? frontPrint.label : ""}</dt>
            <dd>{rp(quote.front)}</dd>
          </div>
          <div>
            <dt>
              {tr("backRow")} {backPrint ? backPrint.label : tr("noBackSuffix")}
            </dt>
            <dd>{rp(quote.back)}</dd>
          </div>
          <div className="unit-price">
            <dt>{tr("perShirt")}</dt>
            <dd>{rp(quote.unit)}</dd>
          </div>
        </dl>
      </div>
      <form onSubmit={save} className="order-form">
        <label className="field-label" htmlFor="customer">
          {tr("nameLabel")}
        </label>
        <input
          id="customer"
          value={customer}
          onChange={(e) => {
            setCustomer(e.target.value);
            setSuccess("");
          }}
          maxLength={80}
          placeholder={tr("namePlaceholder")}
          required
          minLength={2}
          autoComplete="off"
        />
        <label className="field-label" htmlFor="phone">
          {tr("phoneLabel")}
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
          {tr("saveOrder")}
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
            {tr("viewDashboard")}
          </button>
          {lastOrder && (
            <a
              className="text-button"
              href={buildWhatsAppOrderLink(lastOrder)}
              target="_blank"
              rel="noreferrer"
            >
              {tr("sendWa")}
            </a>
          )}
        </div>
      )}
      <div className="production-note">
        <CheckCheck size={18} />
        <p>
          <strong>{tr("productionNoteTitle")}</strong>
          <br />
          {tr("productionNote")}
        </p>
      </div>
    </section>
  );
}
