const express = require("express");
const { v4: uuid } = require("uuid");
const pool = require("../../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   GET PRODUCTS
   Hanya produk yang aktif yang dikirim ke kasir
========================================================= */
router.get("/products", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        category,
        price,
        stock,
        is_active AS "isActive",
        created_at AS "createdAt"
      FROM public.menu
      WHERE is_active = true
      ORDER BY category, name
    `);

    res.json({ products: rows });
  } catch (err) {
    console.error("GET /food/products:", err);

    res.status(500).json({
      message: "Gagal mengambil daftar menu.",
    });
  }
});


/* =========================================================
   GET ALL PRODUCTS
   Untuk halaman admin/manage menu
========================================================= */
router.get("/products/all", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        category,
        price,
        is_active AS "isActive",
        created_at AS "createdAt"
      FROM public.food_products
      ORDER BY category, name
    `);

    res.json({ products: rows });
  } catch (err) {
    console.error("GET /food/products/all:", err);
    res.status(500).json({
      message: "Gagal mengambil semua produk.",
    });
  }
});


/* =========================================================
   ADD PRODUCT
========================================================= */
router.post("/products", requireAuth, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
    } = req.body || {};

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        message: "Nama, kategori, dan harga wajib diisi.",
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        message: "Harga tidak valid.",
      });
    }

    const id = uuid();

    const { rows } = await pool.query(
      `
      INSERT INTO public.food_products
        (id, name, category, price, is_active)
      VALUES
        ($1, $2, $3, $4, true)
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
      product: rows[0],
    });
  } catch (err) {
    console.error("POST /food/products:", err);
    res.status(500).json({
      message: "Gagal menambahkan produk.",
    });
  }
});


/* =========================================================
   UPDATE PRODUCT
========================================================= */
router.put("/products/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

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
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan.",
      });
    }

    const product = existing.rows[0];

    const newName =
      name !== undefined
        ? String(name).trim()
        : product.name;

    const newCategory =
      category !== undefined
        ? String(category).trim()
        : product.category;

    const newPrice =
      price !== undefined
        ? Number(price)
        : Number(product.price);

    const newIsActive =
      isActive !== undefined
        ? Boolean(isActive)
        : product.is_active;

    if (!newName || !newCategory) {
      return res.status(400).json({
        message: "Nama dan kategori wajib diisi.",
      });
    }

    if (!Number.isFinite(newPrice) || newPrice < 0) {
      return res.status(400).json({
        message: "Harga tidak valid.",
      });
    }

    const { rows } = await pool.query(
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
        newName,
        newCategory,
        newPrice,
        newIsActive,
        id,
      ]
    );

    res.json({
      product: rows[0],
    });
  } catch (err) {
    console.error("PUT /food/products/:id:", err);
    res.status(500).json({
      message: "Gagal mengubah produk.",
    });
  }
});


/* =========================================================
   TOGGLE ACTIVE / NONACTIVE
========================================================= */
router.patch("/products/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive harus berupa true atau false.",
      });
    }

    const { rows } = await pool.query(
      `
      UPDATE public.food_products
      SET is_active = $1
      WHERE id = $2
      RETURNING
        id,
        name,
        category,
        price,
        is_active AS "isActive"
      `,
      [isActive, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan.",
      });
    }

    res.json({
      product: rows[0],
      message: isActive
        ? "Menu berhasil diaktifkan."
        : "Menu berhasil dinonaktifkan.",
    });
  } catch (err) {
    console.error("PATCH /food/products/:id/status:", err);
    res.status(500).json({
      message: "Gagal mengubah status menu.",
    });
  }
});


/* =========================================================
   DELETE PRODUCT
   Soft delete = nonaktifkan, bukan hapus
========================================================= */
router.delete("/products/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE public.food_products
      SET is_active = false
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      message: "Menu berhasil dinonaktifkan.",
    });
  } catch (err) {
    console.error("DELETE /food/products/:id:", err);
    res.status(500).json({
      message: "Gagal menonaktifkan produk.",
    });
  }
});


/* =========================================================
   GET FOOD ORDERS
========================================================= */
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
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

    res.json({ orders: rows });
  } catch (err) {
    console.error("GET /food/orders:", err);
    res.status(500).json({
      message: "Gagal mengambil pesanan makanan.",
    });
  }
});


/* =========================================================
   CREATE FOOD ORDER
========================================================= */
router.post("/orders", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
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

    await client.query("BEGIN");

    const normalizedItems = [];

    for (const item of items) {
      const qty = Number(item.qty);

      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error("Jumlah produk tidak valid.");
      }

      const result = await client.query(
        `
        SELECT
          id,
          name,
          price,
          is_active
        FROM public.food_products
        WHERE id = $1
        `,
        [item.productId]
      );

      if (result.rows.length === 0) {
        throw new Error(
          `Produk ${item.productId} tidak ditemukan.`
        );
      }

      const product = result.rows[0];

      if (!product.is_active) {
        throw new Error(
          `Produk ${product.name} sedang tidak tersedia.`
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

    const total = normalizedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const counterResult = await client.query(`
      SELECT order_no
      FROM public.food_orders
      WHERE order_no LIKE 'FD-%'
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
    `);

    let counter = 0;

    if (counterResult.rows.length > 0) {
      const lastNumber = Number(
        String(counterResult.rows[0].order_no)
          .replace("FD-", "")
      );

      if (Number.isFinite(lastNumber)) {
        counter = lastNumber;
      }
    }

    counter += 1;

    const orderNo =
      `FD-${String(counter).padStart(4, "0")}`;

    const orderId = uuid();

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
        ($1, $2, $3, $4, $5, $6, $7, $8)
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
        orderId,
        orderNo,
        customerName || "Pelanggan Umum",
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

    console.error("POST /food/orders:", err);

    res.status(400).json({
      message: err.message || "Gagal membuat pesanan.",
    });
  } finally {
    client.release();
  }
});


module.exports = router;