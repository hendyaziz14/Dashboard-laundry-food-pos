const statusStyles = {
  Diterima: "bg-slate-100 text-slate-600",
  "Proses Cuci": "bg-amber-50 text-amber-600",
  "Siap Diambil": "bg-laundry-light text-laundry",
  Selesai: "bg-emerald-50 text-emerald-600",
  Dibatalkan: "bg-rose-50 text-rose-500",
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}
