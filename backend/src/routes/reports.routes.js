const express = require("express");
const { readDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function dateKey(iso) {
  return new Date(iso).toISOString().slice(0, 10); // YYYY-MM-DD
}

router.get("/revenue", requireAuth, (req, res) => {
  const db = readDB();
  const days = Math.min(Number(req.query.days) || 7, 90);

  const buckets = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    buckets.push({ date: d.toISOString().slice(0, 10), laundry: 0, food: 0 });
  }
  const bucketMap = Object.fromEntries(buckets.map((b) => [b.date, b]));

  db.laundryOrders.forEach((o) => {
    const key = dateKey(o.createdAt);
    if (bucketMap[key]) bucketMap[key].laundry += o.total;
  });

  db.foodOrders.forEach((o) => {
    const key = dateKey(o.createdAt);
    if (bucketMap[key]) bucketMap[key].food += o.total;
  });

  const totalLaundry = buckets.reduce((s, b) => s + b.laundry, 0);
  const totalFood = buckets.reduce((s, b) => s + b.food, 0);

  res.json({ buckets, totalLaundry, totalFood });
});

module.exports = router;
