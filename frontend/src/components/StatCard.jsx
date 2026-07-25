const accentMap = {
  laundry: "bg-laundry-light text-laundry",
  food: "bg-food-light text-food",
  neutral: "bg-slate-100 text-ink",
};

export default function StatCard({ label, value, icon: Icon, accent = "neutral", hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentMap[accent]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
