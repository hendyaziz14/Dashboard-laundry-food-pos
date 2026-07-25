const express = require("express");
const { v4: uuid } = require("uuid");
const pool = require("../../db");
const { readDB, writeDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/services", requireAuth, (req, res) => {
  const db = readDB();
  res.json({ services: db.settings.laundryServices });
});

router.get("/", requireAuth, (req, res) => {
  const db = readDB();
  const orders = [...db.laundryOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

router.get("/orders", requireAuth, (req, res) => {
  const db = readDB();
  const orders = [...db.laundryOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

router.post("/", requireAuth, async (req, res) => {
  const db = readDB();
  const { customerName, phone = "", paymentMethod = "Cash", notes = "", items = [] } = req.body || {};

  if (!customerName || !items.length) {
    return res.status(400).json({ message: "Nama pelanggan dan minimal 1 layanan wajib diisi." });
  }

  const services = new Map(db.settings.laundryServices.map((service) => [service.id, service]));
  const normalizedItems = items.map((item) => {
    const service = services.get(item.serviceId);
    if (!service) throw new Error(`Layanan ${item.serviceId} tidak ditemukan`);

    const weightKg = Number(item.weightKg) || 0;
    return {
      serviceId: service.id,
      serviceName: service.name,
      weightKg,
      pricePerKg: Number(service.pricePerKg),
      subtotal: Math.round(weightKg * Number(service.pricePerKg)),
    };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const counter = Number(db._counters?.laundry || 0) + 1;
  const orderNo = `LD-${String(counter).padStart(4, "0")}`;

  const order = {
    id: uuid(),
    orderNo,
    customerName,
    phone,
    items: normalizedItems,
    total,
    paymentMethod,
    status: "Diterima",
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.laundryOrders.push(order);
  db._counters.laundry = counter;
  writeDB(db);

  try {
    await pool.query(
      `INSERT INTO public.orders (customer_name, type, items, total_amount, status, order_no, phone, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [customerName, "laundry", JSON.stringify(normalizedItems), total, "Diterima", orderNo, phone, paymentMethod, notes]
    );
  } catch (pgErr) {
    console.error("❌ Gagal menyimpan laundry ke PostgreSQL:", pgErr.message);
  }

  res.status(201).json({ order });
});

router.patch("/:id/status", requireAuth, (req, res) => {
  const db = readDB();
  const order = db.laundryOrders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ message: "Pesanan laundry tidak ditemukan." });

  order.status = req.body?.status || order.status;
  order.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ order });
});

module.exports = router;