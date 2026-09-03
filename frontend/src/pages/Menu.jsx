import { useEffect, useState } from "react";
import {
  TbPackage,
  TbPlus,
  TbX,
  TbTrash,
  TbEdit,
} from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import api from "../api/client";

const emptyForm = {
  name: "",
  qty: 0,
  unit: "pcs",
  minStock: 0,
};

export default function Menu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  async function load() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/food/inventory");

      setItems(data.items || data.inventory || []);
    } catch (err) {
      console.error("Gagal mengambil inventory:", err);

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data inventory."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // =====================================================
  // TAMBAH INVENTORY
  // =====================================================

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  // =====================================================
  // EDIT INVENTORY
  // =====================================================

  function openEdit(item) {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      qty: item.qty ?? 0,
      unit: item.unit || "pcs",
      minStock: item.minStock ?? 0,
    });

    setError("");
    setShowModal(true);
  }

  // =====================================================
  // SIMPAN INVENTORY
  // =====================================================

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    const name = form.name?.trim();
    const qty = Number(form.qty);
    const minStock = Number(form.minStock);

    if (!name) {
      setError("Nama barang wajib diisi.");
      return;
    }

    if (Number.isNaN(qty) || qty < 0) {
      setError("Jumlah stok tidak valid.");
      return;
    }

    if (Number.isNaN(minStock) || minStock < 0) {
      setError("Minimum stok tidak valid.");
      return;
    }

    if (!form.unit?.trim()) {
      setError("Satuan wajib diisi.");
      return;
    }

    // ===================================================
    // CEK DUPLICATE
    // ===================================================

    const duplicate = items.find(
      (item) =>
        item.name?.trim().toLowerCase() ===
          name.toLowerCase() &&
        item.id !== editingId
    );

    if (duplicate) {
      setError(
        `Barang "${duplicate.name}" sudah ada di inventory.`
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        qty,
        unit: form.unit.trim(),
        minStock,
      };

      if (editingId) {
        await api.put(
          `/food/inventory/${editingId}`,
          payload
        );
      } else {
        await api.post(
          "/food/inventory",
          payload
        );
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);

      await load();
    } catch (err) {
      console.error(
        "Gagal menyimpan inventory:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Gagal menyimpan inventory."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // HAPUS INVENTORY
  // =====================================================

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus "${item.name}" dari inventory?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/food/inventory/${item.id}`
      );

      await load();
    } catch (err) {
      console.error(
        "Gagal menghapus inventory:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Gagal menghapus inventory."
      );
    }
  }

  // =====================================================
  // STATUS STOK
  // =====================================================

  function getStockStatus(item) {
    const qty = Number(item.qty || 0);
    const minStock = Number(item.minStock || 0);

    if (qty <= 0) {
      return {
        label: "Habis",
        className:
          "bg-rose-100 text-rose-600",
      };
    }

    if (qty <= minStock) {
      return {
        label: "Stok Menipis",
        className:
          "bg-amber-100 text-amber-600",
      };
    }

    return {
      label: "Aman",
      className:
        "bg-emerald-100 text-emerald-600",
    };
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <Layout>
      <Topbar
        title="Inventory Makanan"
        subtitle="Kelola stok dan persediaan makanan"
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-food px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-food-dark"
          >
            <TbPlus size={16} />
            Tambah Inventory
          </button>
        }
      />

      <main className="p-8">

        {/* ERROR */}
        {error && !showModal && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-600">
            {error}
          </div>
        )}

        {/* CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">

            <TbPackage
              size={20}
              className="text-food"
            />

            <div>
              <h2 className="font-display font-semibold text-ink">
                Inventory Makanan
              </h2>

              <p className="text-xs text-slate-400">
                Persediaan dan stok barang makanan
              </p>
            </div>

          </div>

          {/* LIST */}
          <div className="divide-y divide-slate-100">

            {loading && (
              <p className="p-5 text-sm text-slate-400">
                Memuat inventory...
              </p>
            )}

            {!loading &&
              items.length === 0 && (
                <div className="p-8 text-center">

                  <TbPackage
                    size={40}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="text-sm text-slate-400">
                    Belum ada inventory.
                  </p>

                  <button
                    onClick={openAdd}
                    className="mt-3 text-xs font-medium text-food hover:underline"
                  >
                    + Tambah inventory
                  </button>

                </div>
              )}

            {!loading &&
              items.map((item) => {

                const status =
                  getStockStatus(item);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
                  >

                    {/* INFO */}
                    <div className="min-w-0">

                      <div className="flex items-center gap-2">

                        <p className="truncate text-sm font-medium text-ink">
                          {item.name}
                        </p>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>

                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        Satuan:{" "}
                        <span className="font-medium text-slate-600">
                          {item.unit || "-"}
                        </span>
                      </p>

                    </div>

                    {/* STOK */}
                    <div className="flex items-center gap-6">

                      <div className="text-right">

                        <p className="text-xs text-slate-400">
                          Stok
                        </p>

                        <p className="text-sm font-semibold text-ink">
                          {item.qty ?? 0}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            {item.unit || ""}
                          </span>
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-slate-400">
                          Minimum
                        </p>

                        <p className="text-sm font-medium text-slate-600">
                          {item.minStock ?? 0}
                        </p>

                      </div>

                      {/* EDIT */}
                      <button
                        onClick={() =>
                          openEdit(item)
                        }
                        title="Edit inventory"
                        className="text-slate-400 transition-colors hover:text-ink"
                      >
                        <TbEdit size={17} />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() =>
                          handleDelete(item)
                        }
                        title="Hapus inventory"
                        className="text-slate-400 transition-colors hover:text-rose-500"
                      >
                        <TbTrash size={17} />
                      </button>

                    </div>

                  </div>
                );
              })}

          </div>
        </div>

      </main>

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <h3 className="font-display font-semibold text-ink">
                {editingId
                  ? "Edit Inventory"
                  : "Tambah Inventory"}
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
                  Nama Barang
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Contoh: Beras"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                  autoFocus
                />

              </div>

              {/* JUMLAH */}
              <div>

                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Jumlah Stok
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.qty}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      qty: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                />

              </div>

              {/* SATUAN */}
              <div>

                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Satuan
                </label>

                <select
                  value={form.unit}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unit: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                >
                  <option value="pcs">
                    pcs
                  </option>

                  <option value="kg">
                    kg
                  </option>

                  <option value="gram">
                    gram
                  </option>

                  <option value="liter">
                    liter
                  </option>

                  <option value="ml">
                    ml
                  </option>

                  <option value="pack">
                    pack
                  </option>

                  <option value="botol">
                    botol
                  </option>

                  <option value="dus">
                    dus
                  </option>
                </select>

              </div>

              {/* MINIMUM STOK */}
              <div>

                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Minimum Stok
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minStock: e.target.value,
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
                className="w-full rounded-lg bg-food py-2.5 text-sm font-semibold text-white transition-colors hover:bg-food-dark disabled:opacity-50"
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