import { useEffect, useMemo, useState } from "react";
import { TbToolsKitchen2, TbTrash } from "react-icons/tb";
import Layout from "../components/Layout.jsx";
import Topbar from "../components/Topbar.jsx";
import api from "../api/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}

export default function FoodPOS() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("Semua");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
  api.get("/food/products").then(({ data }) => setProducts(data.products));
}, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Semua", ...Array.from(set)];
  }, [products]);

  const filteredProducts =
    category === "Semua" ? products : products.filter((p) => p.category === category);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  }

  function updateQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  async function handleCheckout() {
    setFormError("");
    setSuccessMsg("");
    if (cart.length === 0) {
      setFormError("Keranjang masih kosong.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/food/orders", {
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentMethod,
        customerName,
      });
      setCart([]);
      setCustomerName("");
      setPaymentMethod("Cash");
      setSuccessMsg(`Pesanan ${data.order.orderNo} berhasil dibuat.`);
    } catch (err) {
      setFormError(err.response?.data?.message || "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <Topbar title="Kasir Makanan" subtitle="Buat pesanan makanan baru" />

      <main className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <TbToolsKitchen2 className="text-food" size={20} />
              <h2 className="font-display font-semibold text-ink">Menu Tersedia</h2>
            </div>
            <div className="flex gap-2 px-5 pt-4">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    category === c ? "bg-food text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="rounded-xl border border-slate-200 p-4 text-left hover:border-food hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{p.category}</p>
                  <p className="mt-2 text-sm font-bold text-food">{formatRupiah(p.price)}</p>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-slate-400">Tidak ada produk.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-1">
          <div className="sticky top-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="rounded-t-2xl bg-food px-5 py-4">
              <h2 className="font-display font-semibold text-white">Keranjang</h2>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nama Pelanggan (opsional)</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pelanggan"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-food focus:outline-none"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Item</p>
                {cart.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                    Keranjang kosong
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-ink">{item.name}</p>
                          <p className="text-xs text-slate-400">{formatRupiah(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2 pl-2">
                          <button
                            onClick={() => updateQty(item.productId, -1)}
                            className="h-6 w-6 rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            −
                          </button>
                          <span className="w-4 text-center text-xs font-semibold">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.productId, 1)}
                            className="h-6 w-6 rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            +
                          </button>
                          <button onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-rose-500">
                            <TbTrash size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Metode Pembayaran</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Cash", "Transfer"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                        paymentMethod === m
                          ? "border-food bg-food text-white"
                          : "border-slate-300 text-slate-600 hover:border-food"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm font-medium text-slate-500">Total</p>
                <p className="font-display text-lg font-bold text-ink">{formatRupiah(total)}</p>
              </div>

              {formError && <p className="text-xs text-rose-500">{formError}</p>}
              {successMsg && <p className="text-xs text-emerald-600">{successMsg}</p>}

              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full rounded-lg bg-food py-2.5 text-sm font-semibold text-white hover:bg-food-dark transition-colors disabled:opacity-50"
              >
                {submitting ? "Memproses..." : "Buat Pesanan"}
              </button>
            </div>
          </div>
        </aside>
      </main>
    </Layout>
  );
}
