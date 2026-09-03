const express = require("express");
const { v4: uuid } = require("uuid");
const pool = require("../../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /food/products
 * Ambil produk makanan aktif
 */
router.get("/products", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        category,
        price,
        is_active AS "isActive",
        created_at AS "createdAt"
      FROM public.food_products
      WHERE is_active = true
      ORDER BY category ASC, name ASC
    `);

    res.json({
      products: result.rows,
    });
  } catch (err) {
    console.error("GET /food/products error:", err);

    res.status(500).json({
      message: "Gagal mengambil produk makanan.",
    });
  }
});

/**
 * POST /food/products
 * Tambah produk makanan
 */
router.post("/products", requireAuth, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
    } = req.body || {};

    if (!name?.trim() || !category?.trim() || price === undefined) {
      return res.status(400).json({
        message: "Nama, kategori, dan harga wajib diisi.",
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        message: "Harga produk tidak valid.",
      });
    }

    const id = uuid();

    const result = await pool.query(
      `
      INSERT INTO public.food_products
        (
          id,
          name,
          category,
          price,
          is_active
        )
      VALUES
        (
          $1,
          $2,
          $3,
          $4,
          true
        )
      RETURNING
        id,
        name,
        category,
        price,
        is_active AS "isActive",
        created_at AS "createdAt"
      `,
      [
        id,
        name.trim(),
        category.trim(),
        numericPrice,
      ]
    );

    res.status(201).json({
      product: result.rows[0],
    });
  } catch (err) {
    console.error("POST /food/products error:", err);

    res.status(500).json({
      message: "Gagal menambahkan produk makanan.",
    });
  }
});

/**
 * PUT /food/products/:id
 * Edit produk makanan
 */
router.put("/products/:id", requireAuth, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      isActive,
    } = req.body || {};

    const existing = await pool.query(
      `
      SELECT *
      FROM public.food_products
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan.",
      });
    }

    const current = existing.rows[0];

    const nextName =
      name !== undefined
        ? String(name).trim()
        : current.name;

    const nextCategory =
      category !== undefined
        ? String(category).trim()
        : current.category;

    const nextPrice =
      price !== undefined
        ? Number(price)
        : Number(current.price);

    const nextIsActive =
      isActive !== undefined
        ? Boolean(isActive)
        : current.is_active;

    if (!nextName || !nextCategory) {
      return res.status(400).json({
        message: "Nama dan kategori wajib diisi.",
      });
    }

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      return res.status(400).json({
        message: "Harga produk tidak valid.",
      });
    }

    const result = await pool.query(
      `
      UPDATE public.food_products
      SET
        name = $1,
        category = $2,
        price = $3,
        is_active = $4
      WHERE id = $5
      RETURNING
        id,
        name,
        category,
        price,
        is_active AS "isActive",
        created_at AS "createdAt"
      `,
      [
        nextName,
        nextCategory,
        nextPrice,
        nextIsActive,
        req.params.id,
      ]
    );

    res.json({
      product: result.rows[0],
    });
  } catch (err) {
    console.error("PUT /food/products error:", err);

    res.status(500).json({
      message: "Gagal memperbarui produk makanan.",
    });
  }
});

/**
 * DELETE /food/products/:id
 * Soft delete produk
 *
 * Produk tidak benar-benar dihapus.
 * Hanya dibuat tidak aktif.
 */
router.delete("/products/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE public.food_products
      SET is_active = false
      WHERE id = $1
      RETURNING id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan.",
      });
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("DELETE /food/products error:", err);

    res.status(500).json({
      message: "Gagal menonaktifkan produk makanan.",
    });
  }
});

/**
 * GET /food/orders
 * Ambil seluruh pesanan makanan
 */
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        order_no AS "orderNo",
        customer_name AS "customerName",
        items,
        total_amount AS total,
        payment_method AS "paymentMethod",
        status,
        notes,
        created_at AS "createdAt"
      FROM public.food_orders
      ORDER BY created_at DESC
    `);

    res.json({
      orders: result.rows,
    });
  } catch (err) {
    console.error("GET /food/orders error:", err);

    res.status(500).json({
      message: "Gagal mengambil pesanan makanan.",
    });
  }
});

/**
 * POST /food/orders
 * Membuat pesanan makanan
 */
router.post("/orders", requireAuth, async (req, res) => {
  const {
    items = [],
    paymentMethod = "Cash",
    customerName = "",
  } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Keranjang wajib berisi minimal 1 item.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /**
     * Ambil ID produk yang digunakan.
     */
    const productIds = [
      ...new Set(
        items
          .map((item) => item.productId)
          .filter(Boolean)
      ),
    ];

    if (productIds.length === 0) {
      throw new Error("Produk tidak valid.");
    }

    /**
     * Ambil harga produk langsung dari PostgreSQL.
     *
     * Jangan percaya harga dari frontend.
     */
    const productResult = await client.query(
      `
      SELECT
        id,
        name,
        price,
        is_active
      FROM public.food_products
      WHERE id = ANY($1::text[])
      `,
      [productIds]
    );

    const productMap = new Map(
      productResult.rows.map((product) => [
        product.id,
        product,
      ])
    );

    const normalizedItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error(
          `Produk ${item.productId} tidak ditemukan.`
        );
      }

      if (!product.is_active) {
        throw new Error(
          `Produk ${product.name} sedang tidak aktif.`
        );
      }

      const qty = Number(item.qty);

      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(
          `Jumlah ${product.name} tidak valid.`
        );
      }

      const price = Number(product.price);

      normalizedItems.push({
        productId: product.id,
        name: product.name,
        price,
        qty,
        subtotal: price * qty,
      });
    }

    /**
     * Hitung total dari harga database.
     */
    const total = normalizedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    /**
     * Generate nomor transaksi.
     * FD-0001
     * FD-0002
     * dst.
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
      FROM public.food_orders
      WHERE order_no LIKE 'FD-%'
    `);

    const nextNumber = Number(
      counterResult.rows[0]?.next_number || 1
    );

    const orderNo = `FD-${String(nextNumber).padStart(4, "0")}`;

    const id = uuid();

    const result = await client.query(
      `
      INSERT INTO public.food_orders
        (
          id,
          order_no,
          customer_name,
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
          $4::jsonb,
          $5,
          $6,
          $7,
          $8
        )
      RETURNING
        id,
        order_no AS "orderNo",
        customer_name AS "customerName",
        items,
        total_amount AS total,
        payment_method AS "paymentMethod",
        status,
        notes,
        created_at AS "createdAt"
      `,
      [
        id,
        orderNo,
        customerName?.trim() || "Pelanggan Umum",
        JSON.stringify(normalizedItems),
        total,
        paymentMethod,
        "Selesai",
        "",
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      order: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("POST /food/orders error:", err);

    res.status(500).json({
      message:
        err.message || "Gagal membuat pesanan makanan.",
    });
  } finally {
    client.release();
  }
});

module.exports = router;