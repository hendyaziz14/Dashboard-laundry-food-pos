import { useEffect, useState } from "react";
import { TbToolsKitchen2, TbPlus, TbX, TbTrash, TbEdit } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import api from "../api/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

const emptyForm = { name: "", category: "Makanan Berat", price: "" };

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/food/products")
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, price: product.price });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.category || form.price === "") {
      setError("Nama, kategori, dan harga wajib diisi.");
      return;
    }
    try {
      if (editingId) {
        await api.put(`/food/products/${editingId}`, form);
      } else {
        await api.post("/food/products", form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyimpan produk.");
    }
  }

  async function handleDelete(id) {
    await api.delete(`/food/products/${id}`);
    load();
  }

  return (
    <Layout>
      <Topbar
        title="Menu Makanan"
        subtitle="Kelola produk & harga menu"
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-food px-4 py-2 text-sm font-medium text-white hover:bg-food-dark transition-colors"
          >
            <TbPlus size={16} /> Tambah Produk
          </button>
        }
      />

      <main className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <TbToolsKitchen2 size={20} className="text-food" />
            <h2 className="font-display font-semibold text-ink">Daftar Menu</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="p-5 text-sm text-slate-400">Memuat...</p>}
            {!loading && products.length === 0 && (
              <p className="p-5 text-sm text-slate-400">Belum ada produk.</p>
            )}
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-food">{formatRupiah(p.price)}</p>
                  <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-ink">
                    <TbEdit size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-rose-500">
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
              <h3 className="font-display font-semibold text-ink">{editingId ? "Edit Produk" : "Tambah Produk"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <TbX size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nama Produk</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                >
                  <option>Makanan Berat</option>
                  <option>Minuman</option>
                  <option>Snack</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Harga</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-food py-2.5 text-sm font-semibold text-white hover:bg-food-dark transition-colors"
              >
                {editingId ? "Simpan Perubahan" : "Tambah"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
