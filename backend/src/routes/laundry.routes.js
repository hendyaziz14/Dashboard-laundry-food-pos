const express = require("express");
const { readDB, writeDB } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { nextOrderNo } = require("../utils/id");
const { v4: uuid } = require("uuid");

const router = express.Router();

const VALID_STATUSES = ["Diterima", "Proses Cuci", "Siap Diambil", "Selesai", "Dibatalkan"];

// GET /api/laundry?status=&search=
router.get("/", requireAuth, (req, res) => {
  const db = readDB();
  const { status, search } = req.query;

  let orders = [...db.laundryOrders];

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.orderNo.toLowerCase().includes(q) ||
        (o.phone || "").includes(q)
    );
  }

  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

// GET /api/laundry/services -> list of laundry service types & prices
router.get("/services", requireAuth, (req, res) => {
  const db = readDB();
  res.json({ services: db.settings.laundryServices });
});

// POST /api/laundry -> create new laundry order (cart of one or more service items)
router.post("/", requireAuth, (req, res) => {
  const db = readDB();
  const { customerName, phone, items, paymentMethod, notes } = req.body || {};

  if (!customerName) {
    return res.status(400).json({ message: "Nama pelanggan wajib diisi." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Keranjang tidak boleh kosong. Tambahkan minimal 1 item layanan." });
  }

  const resolvedItems = [];
  let total = 0;

  for (const item of items) {
    const service = db.settings.laundryServices.find((s) => s.id === item.serviceId);
    if (!service) {
      return res.status(400).json({ message: `Jenis layanan tidak ditemukan untuk salah satu item.` });
    }
    const weight = Number(item.weightKg);
    if (Number.isNaN(weight) || weight <= 0) {
      return res.status(400).json({ message: "Berat setiap item harus berupa angka lebih dari 0." });
    }
    const subtotal = Math.round(weight * service.pricePerKg);
    total += subtotal;
    resolvedItems.push({
      serviceId: service.id,
      serviceName: service.name,
      weightKg: weight,
      pricePerKg: service.pricePerKg,
      subtotal,
    });
  }

  db._counters.laundry += 1;
  const order = {
    id: uuid(),
    orderNo: nextOrderNo("LD", db._counters.laundry),
    customerName,
    phone: phone || "",
    items: resolvedItems,
    total,
    paymentMethod: paymentMethod === "Transfer" ? "Transfer" : "Cash",
    status: "Diterima",
    notes: notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.laundryOrders.push(order);
  writeDB(db);

  res.status(201).json({ order });
});

// PATCH /api/laundry/:id/status -> update order status
router.patch("/:id/status", requireAuth, (req, res) => {
  const db = readDB();
  const { status } = req.body || {};

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Status harus salah satu dari: ${VALID_STATUSES.join(", ")}` });
  }

  const order = db.laundryOrders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan." });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ order });
});

// GET /api/laundry/:id -> detail
router.get("/:id", requireAuth, (req, res) => {
  const db = readDB();
  const order = db.laundryOrders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan." });
  }
  res.json({ order });
});

module.exports = router;
