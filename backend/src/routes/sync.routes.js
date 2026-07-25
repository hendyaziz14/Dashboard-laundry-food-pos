const express = require("express");
const pool = require("../../db");
const { readDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/orders", requireAuth, async (req, res) => {
  const db = readDB();
  const candidates = [];

  db.laundryOrders.forEach((order) => {
    candidates.push({
      type: "laundry",
      orderNo: order.orderNo,
      customerName: order.customerName || "",
      items: JSON.stringify(order.items || []),
      totalAmount: Number(order.total || 0),
      status: order.status || "Diterima",
      phone: order.phone || "",
      paymentMethod: order.paymentMethod || "Cash",
      notes: order.notes || "",
    });
  });

  db.foodOrders.forEach((order) => {
    candidates.push({
      type: "food",
      orderNo: order.orderNo,
      customerName: order.customerName || "",
      items: JSON.stringify(order.items || []),
      totalAmount: Number(order.total || 0),
      status: order.status || "Selesai",
      phone: "",
      paymentMethod: order.paymentMethod || "Cash",
      notes: "",
    });
  });

  let inserted = 0;
  let skipped = 0;

  for (const record of candidates) {
    const existing = await pool.query(
      "SELECT id FROM public.orders WHERE order_no = $1 AND type = $2",
      [record.orderNo, record.type]
    );

    if (existing.rows.length > 0) {
      skipped += 1;
      continue;
    }

    await pool.query(
      `INSERT INTO public.orders (customer_name, type, items, total_amount, status, order_no, phone, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        record.customerName,
        record.type,
        record.items,
        record.totalAmount,
        record.status,
        record.orderNo,
        record.phone,
        record.paymentMethod,
        record.notes,
      ]
    );

    inserted += 1;
  }

  res.json({ inserted, skipped, total: inserted + skipped });
});

module.exports = router;
