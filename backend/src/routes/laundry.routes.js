const express = require("express");
const { v4: uuid } = require("uuid");
const pool = require("../../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const STATUS_FLOW = [
  "Diterima",
  "Proses Cuci",
  "Siap Diambil",
  "Selesai",
];

/**
 * GET /laundry/services
 * Ambil semua layanan laundry dari PostgreSQL
 */
router.get("/services", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        price_per_kg AS "pricePerKg",
        eta_hours AS "etaHours",
        created_at AS "createdAt"
      FROM public.laundry_services
      ORDER BY created_at ASC
    `);

    res.json({
      services: result.rows,
    });
  } catch (err) {
    console.error("GET /laundry/services error:", err);
    res.status(500).json({
      message: "Gagal mengambil layanan laundry.",
    });
  }
});

/**
 * GET /laundry
 * Ambil semua pesanan laundry
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        order_no AS "orderNo",
        customer_name AS "customerName",
        phone,
        items,
        total_amount AS total,
        payment_method AS "paymentMethod",
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM public.laundry_orders
      ORDER BY created_at DESC
    `);

    res.json({
      orders: result.rows,
    });
  } catch (err) {
    console.error("GET /laundry error:", err);
    res.status(500).json({
      message: "Gagal mengambil pesanan laundry.",
    });
  }
});

/**
 * GET /laundry/orders
 * Alias untuk daftar pesanan laundry
 */
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        order_no AS "orderNo",
        customer_name AS "customerName",
        phone,
        items,
        total_amount AS total,
        payment_method AS "paymentMethod",
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM public.laundry_orders
      ORDER BY created_at DESC
    `);

    res.json({
      orders: result.rows,
    });
  } catch (err) {
    console.error("GET /laundry/orders error:", err);
    res.status(500).json({
      message: "Gagal mengambil pesanan laundry.",
    });
  }
});

/**
 * POST /laundry
 * Membuat transaksi laundry baru
 */
router.post("/", requireAuth, async (req, res) => {
  const {
    customerName,
    phone = "",
    paymentMethod = "Cash",
    notes = "",
    items = [],
  } = req.body || {};

  if (!customerName?.trim()) {
    return res.status(400).json({
      message: "Nama pelanggan wajib diisi.",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Minimal 1 layanan laundry wajib dipilih.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /**
     * Ambil semua service yang dipilih
     */
    const serviceIds = [
      ...new Set(
        items
          .map((item) => item.serviceId)
          .filter(Boolean)
      ),
    ];

    if (serviceIds.length === 0) {
      throw new Error("Layanan laundry tidak valid.");
    }

    const serviceResult = await client.query(
      `
      SELECT
        id,
        name,
        price_per_kg,
        eta_hours
      FROM public.laundry_services
      WHERE id = ANY($1::text[])
      `,
      [serviceIds]
    );

    const serviceMap = new Map(
      serviceResult.rows.map((service) => [
        service.id,
        service,
      ])
    );

    /**
     * Normalisasi item berdasarkan harga
     * yang tersimpan di database.
     */
    const normalizedItems = [];

    for (const item of items) {
      const service = serviceMap.get(item.serviceId);

      if (!service) {
        throw new Error(
          `Layanan ${item.serviceId} tidak ditemukan.`
        );
      }

      const weightKg = Number(item.weightKg);

      if (!Number.isFinite(weightKg) || weightKg <= 0) {
        throw new Error(
          `Berat untuk layanan ${service.name} tidak valid.`
        );
      }

      const pricePerKg = Number(service.price_per_kg);
      const subtotal = Math.round(weightKg * pricePerKg);

      normalizedItems.push({
        serviceId: service.id,
        serviceName: service.name,
        weightKg,
        pricePerKg,
        subtotal,
      });
    }

    const total = normalizedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    /**
     * Generate nomor order:
     * LD-0001
     * LD-0002
     * dst.
     *
     * Mengambil nomor terbesar yang sudah ada.
     */
    const counterResult = await client.query(`
      SELECT
        COALESCE(
          MAX(
            NULLIF(
              REGEXP_REPLACE(order_no, '[^0-9]', '', 'g'),
              ''
            )::INTEGER
          ),
          0
        ) + 1 AS next_number
      FROM public.laundry_orders
      WHERE order_no LIKE 'LD-%'
    `);

    const nextNumber = Number(
      counterResult.rows[0]?.next_number || 1
    );

    const orderNo = `LD-${String(nextNumber).padStart(4, "0")}`;

    const id = uuid();

    const result = await client.query(
      `
      INSERT INTO public.laundry_orders
        (
          id,
          order_no,
          customer_name,
          phone,
          items,
          total_amount,
          payment_method,
          status,
          notes
        )
      VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5::jsonb,
          $6,
          $7,
          $8,
          $9
        )
      RETURNING
        id,
        order_no AS "orderNo",
        customer_name AS "customerName",
        phone,
        items,
        total_amount AS total,
        payment_method AS "paymentMethod",
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [
        id,
        orderNo,
        customerName.trim(),
        phone,
        JSON.stringify(normalizedItems),
        total,
        paymentMethod,
        "Diterima",
        notes,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      order: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("POST /laundry error:", err);

    res.status(500).json({
      message:
        err.message || "Gagal membuat pesanan laundry.",
    });
  } finally {
    client.release();
  }
});

/**
 * PATCH /laundry/:id/status
 * Update status pesanan
 */
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({
        message: "Status wajib diisi.",
      });
    }

    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({
        message: "Status laundry tidak valid.",
      });
    }

    const result = await pool.query(
      `
      UPDATE public.laundry_orders
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        order_no AS "orderNo",
        customer_name AS "customerName",
        phone,
        items,
        total_amount AS total,
        payment_method AS "paymentMethod",
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Pesanan laundry tidak ditemukan.",
      });
    }

    res.json({
      order: result.rows[0],
    });
  } catch (err) {
    console.error("PATCH /laundry/:id/status error:", err);

    res.status(500).json({
      message: "Gagal memperbarui status laundry.",
    });
  }
});

module.exports = router;