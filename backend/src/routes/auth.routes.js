const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  const db = readDB();
  const user = db.users.find((u) => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: "Username atau password salah." });
  }

  const secret = process.env.JWT_SECRET || "dev-secret";
  const token = jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role },
    secret,
    { expiresIn: "12h" }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
