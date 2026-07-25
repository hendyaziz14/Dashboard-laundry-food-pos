function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function RevenueSplitBar({ laundry, food }) {
  const total = laundry + food;
  const laundryPct = total > 0 ? Math.round((laundry / total) * 100) : 50;
  const foodPct = 100 - laundryPct;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">Kontribusi Pendapatan Hari Ini</p>
        <p className="font-display text-lg font-bold text-ink">{formatRupiah(total)}</p>
      </div>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {total > 0 ? (
          <>
            <div className="bg-laundry transition-all" style={{ width: `${laundryPct}%` }} />
            <div className="bg-food transition-all" style={{ width: `${foodPct}%` }} />
          </>
        ) : (
          <div className="w-full" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-laundry" />
          <span className="text-slate-600">Laundry</span>
          <span className="font-semibold text-ink">{formatRupiah(laundry)}</span>
          <span className="text-slate-400">({laundryPct}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-food" />
          <span className="text-slate-600">Makanan</span>
          <span className="font-semibold text-ink">{formatRupiah(food)}</span>
          <span className="text-slate-400">({foodPct}%)</span>
        </div>
      </div>
    </div>
  );
}
