import { useEffect, useState } from "react";
import { TbUsers, TbPlus, TbX, TbTrash } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import api from "../api/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

export default function Karyawan() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", position: "", salary: "" });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/employees")
      .then(({ data }) => setEmployees(data.employees))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.position) {
      setError("Nama dan posisi wajib diisi.");
      return;
    }
    try {
      await api.post("/employees", form);
      setForm({ name: "", phone: "", position: "", salary: "" });
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menambahkan karyawan.");
    }
  }

  async function handleDelete(id) {
    await api.delete(`/employees/${id}`);
    load();
  }

  return (
    <Layout>
      <Topbar
        title="Karyawan"
        subtitle="Kelola data karyawan"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <TbPlus size={16} /> Tambah Karyawan
          </button>
        }
      />

      <main className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <TbUsers size={20} className="text-ink" />
            <h2 className="font-display font-semibold text-ink">Daftar Karyawan</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-5 text-sm text-slate-400">Memuat...</p>}
            {!loading && employees.length === 0 && (
              <p className="p-5 text-sm text-slate-400">Belum ada data karyawan.</p>
            )}
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-ink">{emp.name}</p>
                  <p className="text-xs text-slate-400">
                    {emp.position} &middot; {emp.phone || "-"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-slate-600">{formatRupiah(emp.salary)}/bln</p>
                  <button onClick={() => handleDelete(emp.id)} className="text-slate-400 hover:text-rose-500">
                    <TbTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-display font-semibold text-ink">Tambah Karyawan</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <TbX size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nama</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">No. Telepon</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Posisi</label>
                <input
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Kasir, Kurir, dll."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Gaji</label>
                <input
                  type="number"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Tambah
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
