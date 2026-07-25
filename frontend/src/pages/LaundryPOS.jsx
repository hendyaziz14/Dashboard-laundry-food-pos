import { useEffect, useState } from "react";
import { TbWashMachine, TbTrash, TbPhone } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import api from "../api/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

const STATUS_FLOW = ["Diterima", "Proses Cuci", "Siap Diambil", "Selesai"];

export default function LaundryPOS() {
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState([]);
  const [weightDraft, setWeightDraft] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function loadOrders() {
    setLoadingOrders(true);
    api
      .get("/laundry")
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setLoadingOrders(false));
  }

  useEffect(() => {
    api.get("/laundry/services").then(({ data }) => setServices(data.services));
    loadOrders();
  }, []);

  function addToCart(service) {
    const weight = Number(weightDraft[service.id]);
    if (!weight || weight <= 0) return;

    setCart((prev) => [
      ...prev,
      {
        key: `${service.id}-${Date.now()}`,
        serviceId: service.id,
        serviceName: service.name,
        pricePerKg: service.pricePerKg,
        weightKg: weight,
        subtotal: Math.round(weight * service.pricePerKg),
      },
    ]);
    setWeightDraft((prev) => ({ ...prev, [service.id]: "" }));
  }

  function removeFromCart(key) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }

  const total = cart.reduce((sum, i) => sum + i.subtotal, 0);

  async function handleCreateOrder() {
    setFormError("");
    if (!customerName.trim()) {
      setFormError("Nama pelanggan wajib diisi.");
      return;
    }
    if (cart.length === 0) {
      setFormError("Keranjang masih kosong. Tambahkan minimal 1 layanan.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/laundry", {
        customerName,
        phone,
        paymentMethod,
        notes,
        items: cart.map((i) => ({ serviceId: i.serviceId, weightKg: i.weightKg })),
      });
      setCustomerName("");
      setPhone("");
      setNotes("");
      setPaymentMethod("Cash");
      setCart([]);
      loadOrders();
    } catch (err) {
      setFormError(err.response?.data?.message || "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function advanceStatus(order) {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    await api.patch(`/laundry/${order.id}/status`, { status: next });
    loadOrders();
  }

  return (
    <Layout>
      <Topbar title="Transaksi Laundry" subtitle="Buat pesanan laundry baru & kelola status" />

      <main className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        {/* Layanan Tersedia */}
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <TbWashMachine className="text-laundry" size={20} />
              <h2 className="font-display font-semibold text-ink">Layanan Tersedia</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              {services.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-ink">{s.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatRupiah(s.pricePerKg)}/kg &middot; Estimasi {s.etaHours} jam
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Berat (kg)"
                      value={weightDraft[s.id] || ""}
                      onChange={(e) => setWeightDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-laundry focus:outline-none"
                    />
                    <button
                      onClick={() => addToCart(s)}
                      className="shrink-0 rounded-lg bg-laundry px-3 py-2 text-sm font-medium text-white hover:bg-laundry-dark transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daftar Pesanan */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-display font-semibold text-ink">Daftar Pesanan</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {loadingOrders && <p className="p-5 text-sm text-slate-400">Memuat...</p>}
              {!loadingOrders && orders.length === 0 && (
                <p className="p-5 text-sm text-slate-400">Belum ada pesanan.</p>
              )}
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {o.customerName} <span className="text-slate-400 font-normal">&middot; {o.orderNo}</span>
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {o.items.map((i) => `${i.serviceName} (${i.weightKg}kg)`).join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-sm font-semibold text-ink">{formatRupiah(o.total)}</p>
                    <StatusBadge status={o.status} />
                    {STATUS_FLOW.indexOf(o.status) < STATUS_FLOW.length - 1 && o.status !== "Dibatalkan" && (
                      <button
                        onClick={() => advanceStatus(o)}
                        className="rounded-lg border border-laundry px-2.5 py-1.5 text-xs font-medium text-laundry hover:bg-laundry-light transition-colors"
                      >
                        Lanjut →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Keranjang */}
        <aside className="lg:col-span-1">
          <div className="sticky top-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="rounded-t-2xl bg-laundry px-5 py-4">
              <h2 className="font-display font-semibold text-white">Keranjang</h2>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nama Pelanggan</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pelanggan"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-laundry focus:outline-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-1">
                  <TbPhone size={14} /> No. Telepon
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nomor telepon"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-laundry focus:outline-none"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Item</p>
                {cart.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                    Keranjang kosong
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-ink">{item.serviceName}</p>
                          <p className="text-xs text-slate-400">
                            {item.weightKg} kg &times; {formatRupiah(item.pricePerKg)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pl-2">
                          <p className="text-xs font-semibold text-ink">{formatRupiah(item.subtotal)}</p>
                          <button onClick={() => removeFromCart(item.key)} className="text-slate-400 hover:text-rose-500">
                            <TbTrash size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Metode Pembayaran</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Cash", "Transfer"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                        paymentMethod === m
                          ? "border-laundry bg-laundry text-white"
                          : "border-slate-300 text-slate-600 hover:border-laundry"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Catatan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-laundry focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-500">Total</p>
                <p className="font-display text-lg font-bold text-ink">{formatRupiah(total)}</p>
              </div>

              {formError && <p className="text-xs text-rose-500">{formError}</p>}

              <button
                onClick={handleCreateOrder}
                disabled={submitting}
                className="w-full rounded-lg bg-laundry py-2.5 text-sm font-semibold text-white hover:bg-laundry-dark transition-colors disabled:opacity-50"
              >
                {submitting ? "Memproses..." : "Buat Pesanan"}
              </button>
            </div>
          </div>
        </aside>
      </main>
    </Layout>
  );
}
