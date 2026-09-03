const express = require("express");
const { v4: uuid } = require("uuid");

const pool = require("../../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();


// GET semua karyawan
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        phone,
        position,
        salary,
        username,
        created_at
      FROM public.employees
      ORDER BY created_at DESC
    `);

    res.json({ employees: result.rows });
  } catch (err) {
    console.error("GET /employees error:", err);
    res.status(500).json({
      message: "Gagal mengambil data karyawan."
    });
  }
});


// ADD karyawan
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, phone, position, salary, username } = req.body || {};

    if (!name || !position) {
      return res.status(400).json({
        message: "Nama dan posisi wajib diisi."
      });
    }

    const id = uuid();

    const result = await pool.query(
      `
      INSERT INTO public.employees
        (id, name, phone, position, salary, username)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        id,
        name,
        phone || "",
        position,
        Number(salary) || 0,
        username || null
      ]
    );

    res.status(201).json({
      employee: result.rows[0]
    });

  } catch (err) {
    console.error("POST /employees error:", err);

    res.status(500).json({
      message: "Gagal menambahkan karyawan."
    });
  }
});


// UPDATE karyawan
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { name, phone, position, salary, username } = req.body || {};

    const result = await pool.query(
      `
      UPDATE public.employees
      SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        position = COALESCE($3, position),
        salary = COALESCE($4, salary),
        username = COALESCE($5, username)
      WHERE id = $6
      RETURNING *
      `,
      [
        name ?? null,
        phone ?? null,
        position ?? null,
        salary !== undefined ? Number(salary) : null,
        username ?? null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Karyawan tidak ditemukan."
      });
    }

    res.json({
      employee: result.rows[0]
    });

  } catch (err) {
    console.error("PUT /employees error:", err);

    res.status(500).json({
      message: "Gagal memperbarui karyawan."
    });
  }
});


// DELETE karyawan
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM public.employees
      WHERE id = $1
      RETURNING id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Karyawan tidak ditemukan."
      });
    }

    res.json({
      success: true
    });

  } catch (err) {
    console.error("DELETE /employees error:", err);

    res.status(500).json({
      message: "Gagal menghapus karyawan."
    });
  }
});


module.exports = router;