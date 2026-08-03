const express = require("express");
const { v4: uuid } = require("uuid");
const pool = require("../../db");
const { readDB, writeDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/products", requireAuth, (req, res) => {
  const db = readDB();
  res.json({ products: db.foodProducts.filter((p) => p.isActive !== false) });
});

router.post("/products", requireAuth, (req, res) => {
  const db = readDB();
  const { name, category, price } = req.body || {};

  if (!name || !category || price === undefined) {
    return res.status(400).json({ message: "Nama, kategori, dan harga wajib diisi." });
  }

  const product = {
    id: uuid(),
    name,
    category,
    price: Number(price),
    isActive: true,
  };

  db.foodProducts.push(product);
  writeDB(db);
  res.status(201).json({ product });
});

router.put("/products/:id", requireAuth, (req, res) => {
  const db = readDB();
  const product = db.foodProducts.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan." });

  const { name, category, price, isActive } = req.body || {};
  if (name !== undefined) product.name = name;
  if (category !== undefined) product.category = category;
  if (price !== undefined) product.price = Number(price);
  if (isActive !== undefined) product.isActive = Boolean(isActive);

  writeDB(db);
  res.json({ product });
});

router.delete("/products/:id", requireAuth, (req, res) => {
  const db = readDB();
  const idx = db.foodProducts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Produk tidak ditemukan." });

  db.foodProducts.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

router.get("/orders", requireAuth, (req, res) => {
  const db = readDB();
  const orders = [...db.foodOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

router.post("/orders", requireAuth, async (req, res) => {
  const db = readDB();
  const { items = [], paymentMethod = "Cash", customerName = "" } = req.body || {};

  if (!items.length) {
    return res.status(400).json({ message: "Keranjang wajib berisi minimal 1 item." });
  }

  const products = new Map(db.foodProducts.map((p) => [p.id, p]));
  const normalizedItems = items.map((item) => {
    const product = products.get(item.productId);
    if (!product) throw new Error(`Produk ${item.productId} tidak ditemukan`);
    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      qty: Number(item.qty) || 1,
    };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const counter = Number(db._counters?.food || 0) + 1;
  const orderNo = `FD-${String(counter).padStart(4, "0")}`;

  const order = {
    id: uuid(),
    orderNo,
    customerName,
    items: normalizedItems,
    total,
    paymentMethod,
    status: "Selesai",
    createdAt: new Date().toISOString(),
  };

  db.foodOrders.push(order);
  db._counters.food = counter;
  writeDB(db);

  try {
    await pool.query(
      `INSERT INTO public.orders (customer_name, type, items, total_amount, status, order_no, phone, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [customerName || "Pelanggan Umum", "food", JSON.stringify(normalizedItems), total, "Selesai", orderNo, "", paymentMethod, ""]
    );
  } catch (pgErr) {
    console.error("❌ Gagal menyimpan food ke PostgreSQL:", pgErr.message);
  }

  res.status(201).json({ order });
});

module.exports = router;