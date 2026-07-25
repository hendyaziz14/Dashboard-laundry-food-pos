import { useEffect, useState } from "react";
import { TbRefresh } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import api from "../api/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Riwayat() {
  const [tab, setTab] = useState("laundry");
  const [laundryOrders, setLaundryOrders] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const { data } = await api.post("/sync/orders");
      setSyncMessage(`Sinkronisasi selesai: ${data.inserted} data baru ditambahkan, ${data.skipped} dilewati.`);
      await loadOrders();
    } catch (err) {
      setSyncMessage(err.response?.data?.message || "Gagal sinkronisasi.");
    } finally {
      setSyncing(false);
    }
  }

  function loadOrders() {
    setLoading(true);
    return Promise.all([api.get("/laundry"), api.get("/food/orders")])
      .then(([laundryRes, foodRes]) => {
        setLaundryOrders(laundryRes.data.orders);
        setFoodOrders(foodRes.data.orders);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const q = search.toLowerCase();
  const filteredLaundry = laundryOrders.filter(
    (o) => o.customerName.toLowerCase().includes(q) || o.orderNo.toLowerCase().includes(q)
  );
  const filteredFood = foodOrders.filter(
    (o) =>
      o.orderNo.toLowerCase().includes(q) || (o.customerName || "").toLowerCase().includes(q)
  );

  return (
    <Layout>
      <Topbar title="Riwayat Transaksi" subtitle="Semua riwayat laundry & makanan" />

      <main className="p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("laundry")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "laundry" ? "bg-laundry text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Laundry
            </button>
            <button
              onClick={() => setTab("food")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "food" ? "bg-food text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Makanan
            </button>
          </div>
          <div className="flex items-center gap-2">
            {syncMessage && <p className="text-xs text-slate-500">{syncMessage}</p>}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 disabled:opacity-50"
            >
              <TbRefresh size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Menyinkronkan..." : "Sinkronkan"}
            </button>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / no. pesanan..."
              className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-6 text-sm text-slate-400">Memuat...</p>
          ) : tab === "laundry" ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">No. Pesanan</th>
                  <th className="px-5 py-3 font-medium">Pelanggan</th>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLaundry.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3 font-medium text-ink">{o.orderNo}</td>
                    <td className="px-5 py-3 text-slate-600">{o.customerName}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {o.items.map((i) => `${i.serviceName} (${i.weightKg}kg)`).join(", ")}
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink">{formatRupiah(o.total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-400">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {filteredLaundry.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">No. Pesanan</th>
                  <th className="px-5 py-3 font-medium">Pelanggan</th>
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Bayar</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFood.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3 font-medium text-ink">{o.orderNo}</td>
                    <td className="px-5 py-3 text-slate-600">{o.customerName || "-"}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink">{formatRupiah(o.total)}</td>
                    <td className="px-5 py-3 text-slate-500">{o.paymentMethod}</td>
                    <td className="px-5 py-3 text-slate-400">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {filteredFood.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </Layout>
  );
}
