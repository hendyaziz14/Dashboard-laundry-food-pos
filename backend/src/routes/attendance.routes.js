const express = require("express");
const pool = require("../../db");
const { requireAuth } = require("../middleware/auth");
const { v4: uuid } = require("uuid");

const router = express.Router();

const VALID_STATUS = ["Hadir", "Izin", "Sakit", "Alpha"];

// GET semua absensi
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        employee_id AS "employeeId",
        employee_name AS "employeeName",
        date,
        status,
        notes,
        created_at AS "createdAt"
      FROM public.attendance
      ORDER BY date DESC, created_at DESC
    `);

    res.json({
      records: result.rows
    });

  } catch (err) {
    console.error("GET /attendance error:", err);

    res.status(500).json({
      message: "Gagal mengambil data absensi."
    });
  }
});


// POST absensi
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      employeeId,
      date,
      status,
      notes
    } = req.body || {};

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        message: "Karyawan, tanggal, dan status wajib diisi."
      });
    }

    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({
        message: `Status harus salah satu dari: ${VALID_STATUS.join(", ")}`
      });
    }

    // Cari employee dari PostgreSQL
    const employeeResult = await pool.query(
      `
      SELECT id, name
      FROM public.employees
      WHERE id = $1
      `,
      [employeeId]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(400).json({
        message: "Karyawan tidak ditemukan."
      });
    }

    const employee = employeeResult.rows[0];

    const id = uuid();

    const result = await pool.query(
      `
      INSERT INTO public.attendance
        (
          id,
          employee_id,
          employee_name,
          date,
          status,
          notes
        )
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        employee_id AS "employeeId",
        employee_name AS "employeeName",
        date,
        status,
        notes,
        created_at AS "createdAt"
      `,
      [
        id,
        employee.id,
        employee.name,
        date,
        status,
        notes || ""
      ]
    );

    res.status(201).json({
      record: result.rows[0]
    });

  } catch (err) {
    console.error("POST /attendance error:", err);

    res.status(500).json({
      message: "Gagal menyimpan absensi."
    });
  }
});


module.exports = router;