import { useEffect, useState } from "react";
import { TbBox, TbPlus, TbX, TbTrash, TbAlertTriangle } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import api from "../api/client";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", qty: "", unit: "", minStock: "" });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/inventory")
      .then(({ data }) => setItems(data.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.unit || form.qty === "") {
      setError("Nama item, jumlah, dan satuan wajib diisi.");
      return;
    }
    try {
      await api.post("/inventory", form);
      setForm({ name: "", qty: "", unit: "", minStock: "" });
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menambahkan item.");
    }
  }

  async function handleDelete(id) {
    await api.delete(`/inventory/${id}`);
    load();
  }

  return (
    <Layout>
      <Topbar
        title="Inventory"
        subtitle="Kelola stock barang"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-food px-4 py-2 text-sm font-medium text-white hover:bg-food-dark transition-colors"
          >
            <TbPlus size={16} /> Tambah Item
          </button>
        }
      />

      <main className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <TbBox size={20} className="text-food" />
            <h2 className="font-display font-semibold text-ink">Daftar Stock Barang</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-5 text-sm text-slate-400">Memuat...</p>}
            {!loading && items.length === 0 && (
              <p className="p-5 text-sm text-slate-400">Belum ada data inventory.</p>
            )}
            {items.map((item) => {
              const low = item.qty <= item.minStock;
              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                      {item.name}
                      {low && <TbAlertTriangle size={14} className="text-amber-500" />}
                    </p>
                    <p className="text-xs text-slate-400">Minimum stock: {item.minStock} {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold ${low ? "text-amber-600" : "text-ink"}`}>
                      {item.qty} {item.unit}
                    </p>
                    <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500">
                      <TbTrash size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-display font-semibold text-ink">Tambah Item</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <TbX size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nama Item</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Jumlah</label>
                <input
                  type="number"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Satuan</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg, liter, pcs, dll"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Minimum Stock</label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-food py-2.5 text-sm font-semibold text-white hover:bg-food-dark transition-colors"
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
