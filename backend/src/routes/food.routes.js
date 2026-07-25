const express = require("express");
const { readDB, writeDB } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { nextOrderNo } = require("../utils/id");
const { v4: uuid } = require("uuid");

const router = express.Router();

// ---------- Products ----------

router.get("/products", requireAuth, (req, res) => {
  const db = readDB();
  res.json({ products: db.foodProducts });
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
  if (isActive !== undefined) product.isActive = isActive;

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

// ---------- Orders (Kasir) ----------

router.get("/orders", requireAuth, (req, res) => {
  const db = readDB();
  let orders = [...db.foodOrders];
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

router.post("/orders", requireAuth, (req, res) => {
  const db = readDB();
  const { items, paymentMethod, customerName } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Keranjang tidak boleh kosong." });
  }

  let total = 0;
  const resolvedItems = [];
  for (const item of items) {
    const product = db.foodProducts.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ message: `Produk dengan id ${item.productId} tidak ditemukan.` });
    }
    const qty = Number(item.qty) || 1;
    total += product.price * qty;
    resolvedItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty,
    });
  }

  db._counters.food += 1;
  const order = {
    id: uuid(),
    orderNo: nextOrderNo("FD", db._counters.food),
    items: resolvedItems,
    total,
    paymentMethod: paymentMethod === "Transfer" ? "Transfer" : "Cash",
    customerName: customerName || "",
    status: "Selesai",
    createdAt: new Date().toISOString(),
  };

  db.foodOrders.push(order);
  writeDB(db);

  res.status(201).json({ order });
});

module.exports = router;
