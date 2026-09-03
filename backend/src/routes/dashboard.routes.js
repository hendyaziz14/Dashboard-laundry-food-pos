const express = require("express");
const pool = require("../../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// =====================================================
// DASHBOARD SUMMARY
// =====================================================

router.get("/summary", requireAuth, async (req, res) => {
  try {
    // ===================================================
    // BUSINESS NAME
    // ===================================================

    const settingsResult = await pool.query(`
      SELECT value
      FROM public.settings
      WHERE key = 'business_name'
      LIMIT 1
    `);

    const businessName =
      settingsResult.rows[0]?.value ||
      "Laundry & Food Corner";

    // ===================================================
    // LAUNDRY HARI INI
    // ===================================================

    const laundryTodayResult = await pool.query(`
      SELECT
        id,
        order_no,
        customer_name,
        items,
        total_amount,
        status,
        payment_method,
        created_at
      FROM public.laundry_orders
      WHERE created_at >= CURRENT_DATE
        AND created_at < CURRENT_DATE + INTERVAL '1 day'
      ORDER BY created_at DESC
    `);

    const laundryToday = laundryTodayResult.rows;

    // ===================================================
    // FOOD HARI INI
    // ===================================================

    const foodTodayResult = await pool.query(`
      SELECT
        id,
        order_no,
        customer_name,
        items,
        total_amount,
        status,
        payment_method,
        created_at
      FROM public.food_orders
      WHERE created_at >= CURRENT_DATE
        AND created_at < CURRENT_DATE + INTERVAL '1 day'
      ORDER BY created_at DESC
    `);

    const foodToday = foodTodayResult.rows;

    // ===================================================
    // REVENUE
    // ===================================================

    const laundryRevenueToday =
      laundryToday.reduce(
        (sum, order) =>
          sum + Number(order.total_amount || 0),
        0
      );

    const foodRevenueToday =
      foodToday.reduce(
        (sum, order) =>
          sum + Number(order.total_amount || 0),
        0
      );

    // ===================================================
    // LAUNDRY AKTIF
    // ===================================================

    const activeLaundryResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM public.laundry_orders
      WHERE status NOT IN ('Selesai', 'Dibatalkan')
    `);

    const activeLaundryOrders =
      Number(activeLaundryResult.rows[0]?.total || 0);

    // ===================================================
    // TOTAL LAUNDRY
    // ===================================================

    const totalLaundryResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM public.laundry_orders
    `);

    const totalLaundryOrders =
      Number(totalLaundryResult.rows[0]?.total || 0);

    // ===================================================
    // RECENT LAUNDRY
    // ===================================================

    const recentLaundryResult = await pool.query(`
      SELECT
        id,
        order_no,
        customer_name,
        items,
        total_amount,
        status,
        payment_method,
        created_at
      FROM public.laundry_orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const recentLaundry =
      recentLaundryResult.rows.map((order) => {

        const items = Array.isArray(order.items)
          ? order.items
          : [];

        const firstItem = items[0] || {};

        return {
          id: order.id,

          customerName:
            order.customer_name ||
            "Pelanggan",

          orderNo:
            order.order_no ||
            "-",

          items,

          total:
            Number(order.total_amount) || 0,

          status:
            order.status ||
            "Diterima",

          paymentMethod:
            order.payment_method ||
            "Cash",

          createdAt:
            order.created_at,

          serviceName:
            firstItem.serviceName ||
            "Layanan",

          weightKg:
            Number(firstItem.weightKg) || 0,
        };
      });

    // ===================================================
    // RECENT FOOD
    // ===================================================

    const recentFoodResult = await pool.query(`
      SELECT
        id,
        order_no,
        customer_name,
        items,
        total_amount,
        status,
        payment_method,
        created_at
      FROM public.food_orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const recentFood =
      recentFoodResult.rows.map((order) => {

        const items = Array.isArray(order.items)
          ? order.items
          : [];

        return {
          id: order.id,

          orderNo:
            order.order_no ||
            "-",

          customerName:
            order.customer_name ||
            "Pelanggan",

          items,

          total:
            Number(order.total_amount) || 0,

          status:
            order.status ||
            "Selesai",

          paymentMethod:
            order.payment_method ||
            "Cash",

          createdAt:
            order.created_at,
        };
      });

    // ===================================================
    // RESPONSE
    // ===================================================

    res.json({
      businessName,

      todayRevenue:
        laundryRevenueToday +
        foodRevenueToday,

      laundryRevenueToday,

      foodRevenueToday,

      activeLaundryOrders,

      foodOrdersToday:
        foodToday.length,

      laundryOrdersToday:
        laundryToday.length,

      totalLaundryOrders,

      recentLaundry,

      recentFood,
    });

  } catch (error) {

    console.error(
      "❌ Dashboard error:",
      error
    );

    res.status(500).json({
      message:
        "Gagal mengambil data dashboard.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

module.exports = router;