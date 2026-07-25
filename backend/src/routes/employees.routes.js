const express = require("express");
const { readDB, writeDB } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { v4: uuid } = require("uuid");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const db = readDB();
  res.json({ employees: db.employees });
});

router.post("/", requireAuth, (req, res) => {
  const db = readDB();
  const { name, phone, position, salary } = req.body || {};

  if (!name || !position) {
    return res.status(400).json({ message: "Nama dan posisi wajib diisi." });
  }

  const employee = {
    id: uuid(),
    name,
    phone: phone || "",
    position,
    salary: Number(salary) || 0,
  };
  db.employees.push(employee);
  writeDB(db);
  res.status(201).json({ employee });
});

router.put("/:id", requireAuth, (req, res) => {
  const db = readDB();
  const employee = db.employees.find((e) => e.id === req.params.id);
  if (!employee) return res.status(404).json({ message: "Karyawan tidak ditemukan." });

  const { name, phone, position, salary } = req.body || {};
  if (name !== undefined) employee.name = name;
  if (phone !== undefined) employee.phone = phone;
  if (position !== undefined) employee.position = position;
  if (salary !== undefined) employee.salary = Number(salary);

  writeDB(db);
  res.json({ employee });
});

router.delete("/:id", requireAuth, (req, res) => {
  const db = readDB();
  const idx = db.employees.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Karyawan tidak ditemukan." });

  db.employees.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

module.exports = router;
