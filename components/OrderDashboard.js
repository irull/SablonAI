"use client";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ClipboardList,
  Search,
  X,
} from "lucide-react";
import { formatRupiah as rp } from "../lib/config";
import { downloadJSON, orderStatuses } from "../lib/orders";

// Label sablon di dashboard: pakai quote label dulu, karena itu sudah
// termasuk ukuran cm dan, untuk order baru, orientasi (mis. "20×15 cm
// (A5, Lanskap)"). ID saja (mis. "A5") hanya fallback untuk order lama.
function printLabel(order, side) {
  if (side === "front") {
    if (order.quote && order.quote.frontPrintLabel)
      return order.quote.frontPrintLabel;
    if (order.frontPrintId) return order.frontPrintId;
    return "-";
  }
  if (order.quote && order.quote.backPrintLabel)
    return order.quote.backPrintLabel;
  if (order.backPrintId) return order.backPrintId;
  return "Tanpa sablon";
}

export default function OrderDashboard({ orders, onStatus, onNew, error }) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("Semua"),
    [detail, setDetail] = useState(null),
    [localError, setLocalError] = useState("");
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const shown = orders.filter(
    (o) =>
      (filter === "Semua" || o.status === filter) &&
      (o.customer + " " + o.id).toLowerCase().includes(query.toLowerCase()),
  );
  const selected = orders.find((o) => o.id === detail);
  async function status(id, value) {
    try {
      await onStatus(id, value);
      setLocalError("");
    } catch (e) {
      setLocalError(e.message);
    }
  }
  const download = (src, filename) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    a.click();
  };
  return (
    <section className="dashboard">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">DARI STUDIO KE ANTREAN PRODUKSI</div>
          <h2>Setiap kaos punya cerita.</h2>
          <p>Kelola order demo yang tersimpan di browser ini.</p>
        </div>
        <button
          className="secondary"
          disabled={!orders.length}
          onClick={() =>
            downloadJSON(
              { version: 1, exportedAt: new Date().toISOString(), orders },
              "sablonai-cadangan-order.json",
            )
          }
        >
          <ArrowDownToLine size={16} /> Cadangkan order
        </button>
      </div>
      <div className="dashboard-stats">
        <div className="card">
          <span>Semua order</span>
          <strong>{orders.length}</strong>
          <small>tersimpan lokal</small>
        </div>
        <div className="card">
          <span>Menunggu ditinjau</span>
          <strong>{orders.filter((o) => o.status === "Baru").length}</strong>
          <small>siap diperiksa</small>
        </div>
        <div className="card">
          <span>Total order</span>
          <strong>{rp(orders.reduce((a, o) => a + o.quote.total, 0))}</strong>
          <small>harga toko</small>
        </div>
      </div>
      <p className="notice">
        Dashboard demo lokal, belum memakai akun pemilik atau database. Order
        hanya muncul di browser dan perangkat ini. Harga sudah harga toko.
        Unduh cadangan sebelum menghapus data browser.
      </p>
      {(error || localError) && (
        <p role="alert" className="error">
          {error || localError}
        </p>
      )}
      <div className="card order-list">
        <div className="dashboard-filters">
          <label>
            <Search size={16} />
            <input
              aria-label="Cari nama atau nomor order"
              placeholder="Cari nama atau nomor order…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </label>
          <select
            aria-label="Filter status order"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>Semua</option>
            {orderStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {!shown.length ? (
          <div className="empty-orders">
            <span className="icon-tile">
              <ClipboardList size={24} />
            </span>
            <h3>
              {orders.length
                ? "Belum ada yang cocok."
                : "Cerita pertamamu dimulai di sini."}
            </h3>
            <p>
              {orders.length
                ? "Coba nama atau status lain."
                : "Buat desain, isi nama, lalu simpan order demo di studio."}
            </p>
            <button className="primary" onClick={onNew}>
              Kembali ke studio <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="order-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order / Pelanggan</th>
                  <th>Kaos & cetak</th>
                  <th>Harga toko</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className="order-person">
                        <img
                          src={o.preview}
                          alt={"Mockup order " + o.customer}
                        />
                        <div>
                          <strong>{o.customer}</strong>
                          <small>
                            {o.id} ·{" "}
                            {new Date(o.createdAt).toLocaleDateString("id-ID", {
                              timeZone: "Asia/Jakarta",
                            })}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {o.product || "Kaos"} · {o.size} · {o.color.name} ·{" "}
                      {o.quantity} pcs
                      <small>
                        Depan: {printLabel(o, "front")} · Belakang:{" "}
                        {printLabel(o, "back")}
                      </small>
                    </td>
                    <td>
                      <strong>{rp(o.quote.total)}</strong>
                      <small>{rp(o.quote.unit)} / kaos</small>
                    </td>
                    <td>
                      <select
                        aria-label={"Status " + o.id}
                        value={o.status}
                        onChange={(e) => status(o.id, e.target.value)}
                      >
                        {orderStatuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => setDetail(o.id)}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <section
            className="modal order-detail card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal icon-button"
              autoFocus
              aria-label="Tutup detail order"
              onClick={() => setDetail(null)}
            >
              <X />
            </button>
            <div className="eyebrow">{selected.id}</div>
            <h2 id="order-title">{selected.customer}</h2>
            <img src={selected.preview} alt="Mockup order tersimpan" />
            <p>
              {selected.product || "Kaos"} · {selected.size} ·{" "}
              {selected.color.name} · {selected.quantity} pcs · sablon depan{" "}
              {printLabel(selected, "front")}, belakang{" "}
              {printLabel(selected, "back")}
            </p>
            <p className="detail-price">
              {rp(selected.quote.total)} <small>harga toko</small>
            </p>
            <p className="small-note">
              {selected.design.demo
                ? "Artwork contoh/demo"
                : "Artwork dari API Meta"}{" "}
              ·{" "}
              {selected.source === "editor"
                ? "diedit di Custom Editor"
                : "AI Generate"}
              . PNG demo perlu diperiksa resolusinya sebelum produksi.
            </p>
            <div className="detail-actions">
              <button
                className="secondary"
                onClick={() =>
                  download(selected.artwork, selected.id + "-artwork.png")
                }
              >
                <ArrowDownToLine size={15} /> Artwork
              </button>
              <button
                className="secondary"
                onClick={() => downloadJSON(selected, selected.id + ".json")}
              >
                <ArrowDownToLine size={15} /> Detail lengkap
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
