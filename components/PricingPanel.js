"use client";
import { useRef, useState } from "react";
import { ArrowRight, CheckCheck, LoaderCircle, X } from "lucide-react";
import { config, formatRupiah as rp } from "../lib/config";
import { calculatePrice, getProduct } from "../lib/pricing";
import ColourGroup from "./ui/ColourGroup";
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

// Panel kanan Studio DIY (Nov 2026, mengikuti Sablon Studio-nya Codex):
// semua keputusan produk ada di satu panel — produk, warna, ukuran,
// ukuran sablon SISI AKTIF + checklist "Sablon sisi ini", jumlah, harga
// live, lalu form pesan. Sisi aktif disinkronkan dengan toggle
// Depan/Belakang di panggung (mockup 2D, 3D, dan editor ikut sisi ini).
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
  side = "front",
  onSide,
  color,
  onColor,
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
  // Ukuran sablon terakhir per sisi, supaya checklist yang dimatikan
  // lalu dinyalakan lagi kembali ke ukuran sebelumnya.
  const lastPrint = useRef({ front: "A4", back: "A4" });
  const product = getProduct(productId);
  const quote = calculatePrice({
    productId,
    size,
    frontPrintId,
    backPrintId,
    frontOrientation,
    backOrientation,
    quantity,
    allowNoPrint: true,
  });
  const frontPrint = frontPrintId
    ? config.printSizes.find((p) => p.id === frontPrintId)
    : null;
  const backPrint = backPrintId
    ? config.printSizes.find((p) => p.id === backPrintId)
    : null;
  const activePrintId = side === "front" ? frontPrintId : backPrintId;
  const activePrint = side === "front" ? frontPrint : backPrint;
  const activeOrientation =
    side === "front" ? frontOrientation : backOrientation;
  const setActivePrint = (id) => {
    if (id) lastPrint.current[side] = id;
    if (side === "front") onFrontPrint(id);
    else onBackPrint(id);
    setSuccess("");
  };
  const setActiveOrientation = (v) => {
    if (side === "front") onFrontOrientation(v);
    else onBackOrientation(v);
    setSuccess("");
  };
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
    <section className="settings-panel card studio-settings">
      <span className="eyebrow">{tr("canvasYours")}</span>
      <h3 className="settings-product">{product.name}</h3>
      <label className="field-label" htmlFor="pp-product">
        {tr("stepProduct")}
      </label>
      <select
        id="pp-product"
        className="settings-select"
        value={productId}
        onChange={(e) => {
          onProduct(e.target.value);
          setSuccess("");
        }}
      >
        {config.products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {rp(p.basePrice)}
          </option>
        ))}
      </select>
      <ColourGroup t={tr} value={color} onChange={onColor} colors={config.colors} />
      <div className="label-row">
        <span className="field-label">{tr("stepSize")}</span>
        <button
          type="button"
          className="link-button"
          onClick={() => setDetailOpen(true)}
        >
          {tr("sizeChartLink")} ↗
        </button>
      </div>
      <div className="size-pills" role="group" aria-label={tr("stepSize")}>
        {product.sizes.map((s) => (
          <button
            key={s}
            type="button"
            className={"size-pill" + (size === s ? " on" : "")}
            aria-pressed={size === s}
            onClick={() => {
              onSize(s);
              setSuccess("");
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="field-label">{tr("activeSideLabel")}</div>
      <div className="seg-row" role="group" aria-label={tr("activeSideLabel")}>
        <button
          type="button"
          className={"seg-btn" + (side === "front" ? " on" : "")}
          aria-pressed={side === "front"}
          onClick={() => onSide("front")}
        >
          {tr("viewFront")}
        </button>
        <button
          type="button"
          className={"seg-btn" + (side === "back" ? " on" : "")}
          aria-pressed={side === "back"}
          onClick={() => onSide("back")}
        >
          {tr("viewBack")}
        </button>
      </div>
      <label className="field-label" htmlFor="pp-print">
        {tr("printSizeFor", {
          side: tr(side === "front" ? "sideFront" : "sideBack").toLowerCase(),
        })}
      </label>
      <select
        id="pp-print"
        className="settings-select"
        value={activePrintId ?? ""}
        onChange={(e) => setActivePrint(e.target.value || null)}
      >
        <option value="">{tr("noPrintOption")}</option>
        {config.printSizes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label} — {rp(p.price)}
          </option>
        ))}
      </select>
      {activePrint && activePrint.wCm !== activePrint.hCm && (
        <div className="seg-row" role="group" aria-label={tr("orientFront")}>
          <button
            type="button"
            className={"seg-btn" + (activeOrientation === "portrait" ? " on" : "")}
            aria-pressed={activeOrientation === "portrait"}
            onClick={() => setActiveOrientation("portrait")}
          >
            {tr("portrait")} {activePrint.wCm}×{activePrint.hCm}
          </button>
          <button
            type="button"
            className={"seg-btn" + (activeOrientation === "landscape" ? " on" : "")}
            aria-pressed={activeOrientation === "landscape"}
            onClick={() => setActiveOrientation("landscape")}
          >
            {tr("landscape")} {activePrint.hCm}×{activePrint.wCm}
          </button>
        </div>
      )}
      <label className="check-row">
        <input
          type="checkbox"
          checked={activePrintId != null}
          onChange={(e) =>
            setActivePrint(e.target.checked ? lastPrint.current[side] : null)
          }
        />
        {tr("printThisSide")}
      </label>
      <p className="small-note">{tr("printSideNote")}</p>
      {activePrint && (
        <MaskingFigure
          print={activePrint}
          side={side}
          usedLabel={
            side === "front" ? quote.frontPrintLabel : quote.backPrintLabel
          }
          tr={tr}
        />
      )}
      <div className="field-label">{tr("qtyLabel")}</div>
      <div className="qty-stepper">
        <button
          type="button"
          aria-label="−"
          onClick={() => {
            setQuantity((q) => Math.max(1, q - 1));
            setSuccess("");
          }}
        >
          −
        </button>
        <output aria-live="polite">{quantity}</output>
        <button
          type="button"
          aria-label="+"
          onClick={() => {
            setQuantity((q) => Math.min(100, q + 1));
            setSuccess("");
          }}
        >
          +
        </button>
      </div>
      <div className="price-box-v2" aria-live="polite">
        <div className="price-line">
          <span>
            {product.name} · {size}
          </span>
          <b>{rp(quote.shirt)}</b>
        </div>
        <div className="price-line">
          <span>
            {tr("frontRow")} {frontPrint ? frontPrint.label : ""}
          </span>
          <b>{frontPrintId ? rp(quote.front) : "—"}</b>
        </div>
        <div className="price-line">
          <span>
            {tr("backRow")} {backPrint ? backPrint.label : ""}
          </span>
          <b>{backPrintId ? rp(quote.back) : "—"}</b>
        </div>
        <hr />
        <div className="price-line total">
          <span>
            {tr("totalLabel")} <small>{tr("estimate", { qty: quantity })}</small>
          </span>
          <strong>{rp(quote.total)}</strong>
        </div>
        <p className="price-note">
          {config.pricingIsExample ? tr("priceExample") : tr("priceShop")} ·{" "}
          {tr("shippingNote")}
        </p>
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
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        className="detail-dialog-root"
      >
        <div className="detail-backdrop" aria-hidden="true" />
        <div className="detail-wrap">
          <DialogPanel className="detail-card">
            <div className="detail-head">
              <DialogTitle>{tr("sizeChartLink")}</DialogTitle>
              <button
                type="button"
                className="icon-button"
                aria-label={tr("doneLabel")}
                onClick={() => setDetailOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="detail-group">
              <SizeChart productId={productId} tr={tr} />
            </div>
            {frontPrint && (
              <MaskingFigure
                print={frontPrint}
                side="front"
                usedLabel={quote.frontPrintLabel}
                tr={tr}
              />
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
    </section>
  );
}
