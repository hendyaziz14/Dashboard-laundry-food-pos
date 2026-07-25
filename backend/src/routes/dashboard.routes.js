const express = require("express");
const { readDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function isToday(isoDate) {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

router.get("/summary", requireAuth, (req, res) => {
  const db = readDB();

  const laundryToday = db.laundryOrders.filter((o) => isToday(o.createdAt));
  const foodToday = db.foodOrders.filter((o) => isToday(o.createdAt));

  const laundryRevenueToday = laundryToday.reduce((sum, o) => sum + o.total, 0);
  const foodRevenueToday = foodToday.reduce((sum, o) => sum + o.total, 0);

  const activeLaundryOrders = db.laundryOrders.filter(
    (o) => !["Selesai", "Dibatalkan"].includes(o.status)
  ).length;

  const recentLaundry = [...db.laundryOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((order) => ({
      ...order,
      customerName: order.customerName || "Pelanggan",
      orderNo: order.orderNo || "-",
      items: order.items || [],
      total: Number(order.total) || 0,
      status: order.status || "Diterima",
      serviceName: order.items?.[0]?.serviceName || "Layanan",
      weightKg: order.items?.[0]?.weightKg || 0,
    }));

  const recentFood = [...db.foodOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((order) => ({
      ...order,
      orderNo: order.orderNo || "-",
      items: order.items || [],
      total: Number(order.total) || 0,
      paymentMethod: order.paymentMethod || "Cash",
    }));

  res.json({
    businessName: db.settings.businessName,
    todayRevenue: laundryRevenueToday + foodRevenueToday,
    laundryRevenueToday,
    foodRevenueToday,
    activeLaundryOrders,
    foodOrdersToday: foodToday.length,
    laundryOrdersToday: laundryToday.length,
    totalLaundryOrders: db.laundryOrders.length,
    recentLaundry,
    recentFood,
  });
});

module.exports = router;
