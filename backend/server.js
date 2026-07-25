require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const laundryRoutes = require("./src/routes/laundry.routes");
const foodRoutes = require("./src/routes/food.routes");
const reportsRoutes = require("./src/routes/reports.routes");
const employeesRoutes = require("./src/routes/employees.routes");
const attendanceRoutes = require("./src/routes/attendance.routes");
const inventoryRoutes = require("./src/routes/inventory.routes");
const { readDB } = require("./src/db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/laundry", laundryRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/inventory", inventoryRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan pada server." });
});

readDB(); // triggers seed-data creation on first run if data/db.json doesn't exist yet

app.listen(PORT, () => {
  console.log(`Laundry & Food POS backend berjalan di http://localhost:${PORT}`);
});
