const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const pool = require("./db"); // Import koneksi PostgreSQL

// Import modul routes bawaan project Anda
const authRoutes = require("./src/routes/auth.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const laundryRoutes = require("./src/routes/laundry.routes");
const foodRoutes = require("./src/routes/food.routes");
const reportsRoutes = require("./src/routes/reports.routes");
const employeesRoutes = require("./src/routes/employees.routes");
const attendanceRoutes = require("./src/routes/attendance.routes");
const inventoryRoutes = require("./src/routes/inventory.routes");
const syncRoutes = require("./src/routes/sync.routes");

const app = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Direct PostgreSQL Orders Endpoints
app.post("/api/orders", async (req, res) => {
  const { customer_name, type, items, total_amount, status } = req.body;

  try {
    const queryText = `
      INSERT INTO orders (customer_name, type, items, total_amount, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    
    const values = [
      customer_name || "Pelanggan Umum",
      type || "food",
      JSON.stringify(items || []),
      total_amount || 0,
      status || "completed"
    ];

    const result = await pool.query(queryText, values);
    console.log("✅ Transaksi berhasil disimpan ke DB:", result.rows[0]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("❌ Gagal menyimpan transaksi:", err.message);
    res.status(500).json({ error: "Gagal menyimpan transaksi ke database" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Gagal mengambil transaksi:", err.message);
    res.status(500).json({ error: "Gagal mengambil data transaksi" });
  }
});

// 3. Register Application Modular Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/laundry", laundryRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sync", syncRoutes);

// 4. 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
});

// 5. Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan pada server." });
});

// 6. Start Single Server Instance
async function start() {
  try {
    await pool.ensureTables();
    app.listen(PORT, () => {
      console.log(`✅ Laundry & Food POS backend berjalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Gagal menyiapkan tabel PostgreSQL:", err.message);
    process.exit(1);
  }
}

start();