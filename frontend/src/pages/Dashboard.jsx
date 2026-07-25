import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TbCash, TbWashMachine, TbToolsKitchen2, TbClockHour4 } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import RevenueSplitBar from "../components/RevenueSplitBar.jsx";
import api from "../api/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then(({ data }) => setSummary(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <Topbar title={summary?.businessName || "Dashboard"} subtitle="Ringkasan operasional hari ini" />

      <main className="p-8 space-y-6">
        {loading ? (
          <p className="text-sm text-slate-400">Memuat data...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Pendapatan Hari Ini"
                value={formatRupiah(summary?.todayRevenue)}
                icon={TbCash}
                accent="neutral"
              />
              <StatCard
                label="Pesanan Laundry Aktif"
                value={summary?.activeLaundryOrders ?? 0}
                icon={TbWashMachine}
                accent="laundry"
                hint="Belum diambil pelanggan"
              />
              <StatCard
                label="Transaksi Makanan"
                value={summary?.foodOrdersToday ?? 0}
                icon={TbToolsKitchen2}
                accent="food"
                hint="Hari ini"
              />
              <StatCard
                label="Order Laundry Masuk"
                value={summary?.laundryOrdersToday ?? 0}
                icon={TbClockHour4}
                accent="laundry"
                hint="Hari ini"
              />
            </div>

            <RevenueSplitBar laundry={summary?.laundryRevenueToday || 0} food={summary?.foodRevenueToday || 0} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="font-display font-semibold text-ink">Laundry Terbaru</h2>
                  <Link to="/laundry" className="text-xs font-medium text-laundry hover:underline">
                    Lihat semua
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {(summary?.recentLaundry || []).length === 0 && (
                    <p className="p-5 text-sm text-slate-400">Belum ada transaksi laundry.</p>
                  )}
                  {(summary?.recentLaundry || []).map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{o.customerName}</p>
                        <p className="text-xs text-slate-400">
                          {o.orderNo} &middot; {o.weightKg} kg &middot; {o.serviceName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ink">{formatRupiah(o.total)}</p>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="font-display font-semibold text-ink">Transaksi Makanan Terbaru</h2>
                  <Link to="/orders" className="text-xs font-medium text-food hover:underline">
                    Lihat semua
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {(summary?.recentFood || []).length === 0 && (
                    <p className="p-5 text-sm text-slate-400">Belum ada transaksi makanan.</p>
                  )}
                  {(summary?.recentFood || []).map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{o.orderNo}</p>
                        <p className="text-xs text-slate-400">
                          {o.items.length} item &middot; {o.paymentMethod}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-ink">{formatRupiah(o.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </Layout>
  );
}
