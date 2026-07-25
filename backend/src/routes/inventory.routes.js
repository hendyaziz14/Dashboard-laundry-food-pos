const express = require("express");
const { readDB, writeDB } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { v4: uuid } = require("uuid");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const db = readDB();
  res.json({ items: db.inventory });
});

router.post("/", requireAuth, (req, res) => {
  const db = readDB();
  const { name, qty, unit, minStock } = req.body || {};

  if (!name || qty === undefined || !unit) {
    return res.status(400).json({ message: "Nama item, jumlah, dan satuan wajib diisi." });
  }

  const item = {
    id: uuid(),
    name,
    qty: Number(qty),
    unit,
    minStock: Number(minStock) || 0,
  };
  db.inventory.push(item);
  writeDB(db);
  res.status(201).json({ item });
});

router.put("/:id", requireAuth, (req, res) => {
  const db = readDB();
  const item = db.inventory.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Item tidak ditemukan." });

  const { name, qty, unit, minStock } = req.body || {};
  if (name !== undefined) item.name = name;
  if (qty !== undefined) item.qty = Number(qty);
  if (unit !== undefined) item.unit = unit;
  if (minStock !== undefined) item.minStock = Number(minStock);

  writeDB(db);
  res.json({ item });
});

router.delete("/:id", requireAuth, (req, res) => {
  const db = readDB();
  const idx = db.inventory.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Item tidak ditemukan." });

  db.inventory.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

module.exports = router;
