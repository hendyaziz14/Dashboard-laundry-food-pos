import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { TbDownload, TbChartBar } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import api from "../api/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

function groupBuckets(buckets, mode) {
  if (mode === "harian") {
    return buckets.slice(-14).map((b) => ({
      label: new Date(b.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      laundry: b.laundry,
      food: b.food,
    }));
  }

  const keyFn =
    mode === "bulanan"
      ? (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : (d) => `${d.getFullYear()}`;

  const labelFn =
    mode === "bulanan"
      ? (d) => d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
      : (d) => `${d.getFullYear()}`;

  const map = new Map();
  buckets.forEach((b) => {
    const d = new Date(b.date);
    const key = keyFn(d);
    if (!map.has(key)) map.set(key, { label: labelFn(d), laundry: 0, food: 0 });
    const entry = map.get(key);
    entry.laundry += b.laundry;
    entry.food += b.food;
  });
  return Array.from(map.values());
}

export default function Laporan() {
  const [period, setPeriod] = useState("harian");
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/reports/revenue", { params: { days: 365 } })
      .then(({ data }) => setBuckets(data.buckets))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => groupBuckets(buckets, period), [buckets, period]);
  const totalLaundry = chartData.reduce((s, b) => s + b.laundry, 0);
  const totalFood = chartData.reduce((s, b) => s + b.food, 0);

  function exportCSV() {
    const header = "Periode,Laundry,Makanan,Total\n";
    const rows = chartData
      .map((b) => `${b.label},${b.laundry},${b.food},${b.laundry + b.food}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-penjualan-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout>
      <Topbar
        title="Laporan Penjualan"
        subtitle="Analisa penjualan dan ekspor data"
        actions={
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <TbDownload size={16} /> Export CSV
          </button>
        }
      />

      <main className="p-8 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <TbChartBar className="text-ink" size={20} />
              <h2 className="font-display font-semibold text-ink">Laporan Penjualan</h2>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {[
                { key: "harian", label: "Harian" },
                { key: "bulanan", label: "Bulanan" },
                { key: "tahunan", label: "Tahunan" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPeriod(opt.key)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    period === opt.key ? "bg-white text-ink shadow-sm" : "text-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-400">Memuat data...</p>
            ) : chartData.every((b) => b.laundry === 0 && b.food === 0) ? (
              <p className="py-10 text-center text-sm text-slate-400">Belum ada data penjualan.</p>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      tickFormatter={(v) => `${Math.round(v / 1000)}rb`}
                    />
                    <Tooltip formatter={(value) => formatRupiah(value)} />
                    <Legend />
                    <Bar dataKey="laundry" name="Laundry" fill="#2D7DD2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="food" name="Makanan" fill="#E8823C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Pendapatan Laundry</p>
            <p className="mt-2 font-display text-2xl font-bold text-laundry">{formatRupiah(totalLaundry)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Pendapatan Makanan</p>
            <p className="mt-2 font-display text-2xl font-bold text-food">{formatRupiah(totalFood)}</p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
