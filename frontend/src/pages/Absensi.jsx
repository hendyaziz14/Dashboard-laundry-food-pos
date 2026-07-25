import { useEffect, useState } from "react";
import { TbCalendarStats, TbPlus, TbX } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import api from "../api/client";

const STATUS_OPTIONS = ["Hadir", "Izin", "Sakit", "Alpha"];
const statusColor = {
  Hadir: "bg-emerald-50 text-emerald-600",
  Izin: "bg-amber-50 text-amber-600",
  Sakit: "bg-laundry-light text-laundry",
  Alpha: "bg-rose-50 text-rose-500",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Absensi() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: "", date: todayStr(), status: "Hadir", notes: "" });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api.get("/employees"), api.get("/attendance")])
      .then(([empRes, attRes]) => {
        setEmployees(empRes.data.employees);
        setRecords(attRes.data.records);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!form.employeeId) {
      setError("Pilih karyawan terlebih dahulu.");
      return;
    }
    try {
      await api.post("/attendance", form);
      setForm({ employeeId: "", date: todayStr(), status: "Hadir", notes: "" });
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyimpan absensi.");
    }
  }

  return (
    <Layout>
      <Topbar
        title="Absensi Karyawan"
        subtitle="Catat kehadiran karyawan"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <TbPlus size={16} /> Catat Absensi
          </button>
        }
      />

      <main className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <TbCalendarStats size={20} className="text-ink" />
            <h2 className="font-display font-semibold text-ink">Riwayat Absensi</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-5 text-sm text-slate-400">Memuat...</p>}
            {!loading && records.length === 0 && (
              <p className="p-5 text-sm text-slate-400">Belum ada data absensi.</p>
            )}
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-ink">{r.employeeName}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    {r.notes ? ` \u00b7 ${r.notes}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[r.status]}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-display font-semibold text-ink">Catat Absensi</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <TbX size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Karyawan</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                >
                  <option value="">Pilih karyawan</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
