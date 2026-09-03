import { useEffect, useState } from "react";
import {
  TbToolsKitchen2,
  TbPlus,
  TbX,
  TbTrash,
  TbEdit,
  TbPower,
} from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import api from "../api/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const emptyForm = {
  name: "",
  category: "Makanan Berat",
  price: "",
  stock: 0,
};

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // =====================================================
  // LOAD SEMUA MENU
  // =====================================================
  async function load() {
    setLoading(true);

    try {
      const { data } = await api.get("/food/products/all");
      setProducts(data.products || []);
    } catch (err) {
      console.error("Gagal mengambil menu:", err);
      setError(
        err.response?.data?.message ||
          "Gagal mengambil daftar menu."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // =====================================================
  // TAMBAH MENU
  // =====================================================
  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  // =====================================================
  // EDIT MENU
  // =====================================================
  function openEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      category: product.category || "Makanan Berat",
      price: product.price ?? "",
      stock: product.stock ?? 0,
    });

    setError("");
    setShowModal(true);
  }

  // =====================================================
  // SIMPAN MENU
  // =====================================================
  async function handleSave(e) {
    e.preventDefault();
    setError("");

    const name = form.name?.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !name ||
      !form.category ||
      Number.isNaN(price) ||
      price < 0
    ) {
      setError(
        "Nama, kategori, dan harga wajib diisi."
      );
      return;
    }

    if (Number.isNaN(stock) || stock < 0) {
      setError("Stok tidak valid.");
      return;
    }

    // ===================================================
    // CEK DUPLICATE MENU
    // ===================================================
    const duplicate = products.find(
      (p) =>
        p.name?.trim().toLowerCase() ===
          name.toLowerCase() &&
        p.id !== editingId
    );

    if (duplicate) {
      setError(
        `Menu "${duplicate.name}" sudah ada.`
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        category: form.category,
        price,
        stock,
      };

      if (editingId) {
        await api.put(
          `/food/products/${editingId}`,
          payload
        );
      } else {
        await api.post(
          "/food/products",
          payload
        );
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);

      await load();
    } catch (err) {
      console.error("Gagal menyimpan menu:", err);

      setError(
        err.response?.data?.message ||
          "Gagal menyimpan produk."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // AKTIF / NONAKTIF MENU
  // =====================================================
  async function toggleStatus(product) {
    try {
      await api.patch(
        `/food/products/${product.id}/status`,
        {
          isActive: !product.isActive,
        }
      );

      await load();
    } catch (err) {
      console.error(
        "Gagal mengubah status menu:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Gagal mengubah status menu."
      );
    }
  }

  // =====================================================
  // HAPUS MENU
  // =====================================================
  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus menu "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/food/products/${product.id}`
      );

      await load();
    } catch (err) {
      console.error("Gagal menghapus menu:", err);

      setError(
        err.response?.data?.message ||
          "Gagal menghapus menu."
      );
    }
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
            <TbPlus size={16} />
            Tambah Produk
          </button>
        }
      />

      <main className="p-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <TbToolsKitchen2
              size={20}
              className="text-food"
            />

            <h2 className="font-display font-semibold text-ink">
              Daftar Menu
            </h2>
          </div>

          {/* ERROR */}
          {error && !showModal && (
            <div className="mx-5 mt-4 rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-600">
              {error}
            </div>
          )}

          {/* LIST */}
          <div className="divide-y divide-slate-100">

            {loading && (
              <p className="p-5 text-sm text-slate-400">
                Memuat...
              </p>
            )}

            {!loading &&
              products.length === 0 && (
                <p className="p-5 text-sm text-slate-400">
                  Belum ada produk.
                </p>
              )}

            {!loading &&
              products.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                    p.isActive === false
                      ? "bg-slate-50 opacity-60"
                      : ""
                  }`}
                >

                  {/* INFO MENU */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">
                        {p.name}
                      </p>

                      {/* STATUS */}
                      {p.isActive === false ? (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          Nonaktif
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          Aktif
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">
                      {p.category}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Stok:{" "}
                      <span className="font-medium text-slate-600">
                        {p.stock ?? 0}
                      </span>
                    </p>
                  </div>

                  {/* ACTION */}
                  <div className="flex items-center gap-4">

                    <p className="text-sm font-semibold text-food">
                      {formatRupiah(p.price)}
                    </p>

                    {/* AKTIF / NONAKTIF */}
                    <button
                      onClick={() =>
                        toggleStatus(p)
                      }
                      title={
                        p.isActive === false
                          ? "Aktifkan menu"
                          : "Nonaktifkan menu"
                      }
                      className={`transition-colors ${
                        p.isActive === false
                          ? "text-slate-400 hover:text-emerald-600"
                          : "text-emerald-500 hover:text-rose-500"
                      }`}
                    >
                      <TbPower size={18} />
                    </button>

                    {/* EDIT */}
                    <button
                      onClick={() => openEdit(p)}
                      title="Edit menu"
                      className="text-slate-400 hover:text-ink"
                    >
                      <TbEdit size={16} />
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() =>
                        handleDelete(p)
                      }
                      title="Hapus menu"
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <TbTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>

      {/* =================================================
          MODAL
      ================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <h3 className="font-display font-semibold text-ink">
                {editingId
                  ? "Edit Produk"
                  : "Tambah Produk"}
              </h3>

              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="text-slate-400 hover:text-ink"
              >
                <TbX size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSave}
              className="space-y-4 p-5"
            >

              {/* NAMA */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Nama Produk
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                  autoFocus
                />
              </div>

              {/* KATEGORI */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Kategori
                </label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                >
                  <option>Makanan Berat</option>
                  <option>Minuman</option>
                  <option>Snack</option>
                </select>
              </div>

              {/* HARGA */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Harga
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                />
              </div>

              {/* STOK */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Stok
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                />
              </div>

              {/* ERROR */}
              {error && (
                <p className="text-xs text-rose-500">
                  {error}
                </p>
              )}

              {/* SAVE */}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-food py-2.5 text-sm font-semibold text-white hover:bg-food-dark transition-colors disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                  ? "Simpan Perubahan"
                  : "Tambah"}
              </button>

            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}