const express = require("express");
const pool = require("../../db");
const { requireAuth } = require("../middleware/auth");
const { v4: uuid } = require("uuid");

const router = express.Router();

const VALID_STATUS = ["Hadir", "Izin", "Sakit", "Alpha"];

router.get("/", requireAuth, (req, res) => {
  const db = readDB();
  const records = [...db.attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ records });
});

router.post("/", requireAuth, (req, res) => {
  const db = readDB();
  const { employeeId, date, status, notes } = req.body || {};

  if (!employeeId || !date || !status) {
    return res.status(400).json({ message: "Karyawan, tanggal, dan status wajib diisi." });
  }
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ message: `Status harus salah satu dari: ${VALID_STATUS.join(", ")}` });
  }

  const employee = db.employees.find((e) => e.id === employeeId);
  if (!employee) {
    return res.status(400).json({ message: "Karyawan tidak ditemukan." });
  }

  const record = {
    id: uuid(),
    employeeId,
    employeeName: employee.name,
    date,
    status,
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };

  db.attendance.push(record);
  writeDB(db);
  res.status(201).json({ record });
});

module.exports = router;
