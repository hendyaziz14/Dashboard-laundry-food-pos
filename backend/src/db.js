const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

function seedData() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

  return {
    users: [
      {
        id: uuid(),
        username: adminUsername,
        passwordHash: bcrypt.hashSync(adminPassword, 10),
        name: "Admin",
        role: "owner",
      },
    ],
    settings: {
      businessName: "Laundry & Food Corner",
      laundryServices: [
        { id: "svc-kering", name: "Cuci Kering", pricePerKg: 6000, etaHours: 48 },
        { id: "svc-setrika", name: "Cuci + Setrika", pricePerKg: 8000, etaHours: 48 },
        { id: "svc-express", name: "Cuci Express (Sehari Jadi)", pricePerKg: 12000, etaHours: 24 },
        { id: "svc-setrika-saja", name: "Setrika Saja", pricePerKg: 5000, etaHours: 24 },
      ],
    },
    laundryOrders: [
      {
        id: uuid(),
        orderNo: "LD-0001",
        customerName: "Budi Santoso",
        phone: "081234567890",
        items: [
          { serviceId: "svc-express", serviceName: "Cuci Express (Sehari Jadi)", weightKg: 3.5, pricePerKg: 12000, subtotal: 42000 },
        ],
        total: 42000,
        paymentMethod: "Cash",
        status: "Selesai",
        notes: "",
        createdAt: daysAgo(1),
        updatedAt: daysAgo(0.5),
      },
      {
        id: uuid(),
        orderNo: "LD-0002",
        customerName: "Sri Wahyuni",
        phone: "081298765432",
        items: [
          { serviceId: "svc-setrika", serviceName: "Cuci + Setrika", weightKg: 5, pricePerKg: 8000, subtotal: 40000 },
        ],
        total: 40000,
        paymentMethod: "Transfer",
        status: "Proses Cuci",
        notes: "Baju putih dipisah",
        createdAt: daysAgo(0.4),
        updatedAt: daysAgo(0.4),
      },
      {
        id: uuid(),
        orderNo: "LD-0003",
        customerName: "Andi Firmansyah",
        phone: "081211122233",
        items: [
          { serviceId: "svc-kering", serviceName: "Cuci Kering", weightKg: 2, pricePerKg: 6000, subtotal: 12000 },
          { serviceId: "svc-setrika-saja", serviceName: "Setrika Saja", weightKg: 1.5, pricePerKg: 5000, subtotal: 7500 },
        ],
        total: 19500,
        paymentMethod: "Cash",
        status: "Diterima",
        notes: "",
        createdAt: daysAgo(0.1),
        updatedAt: daysAgo(0.1),
      },
    ],
    foodProducts: [
      { id: uuid(), name: "Nasi Goreng Spesial", category: "Makanan Berat", price: 18000, isActive: true },
      { id: uuid(), name: "Mie Goreng Ayam", category: "Makanan Berat", price: 16000, isActive: true },
      { id: uuid(), name: "Ayam Geprek", category: "Makanan Berat", price: 15000, isActive: true },
      { id: uuid(), name: "Es Teh Manis", category: "Minuman", price: 5000, isActive: true },
      { id: uuid(), name: "Es Jeruk", category: "Minuman", price: 6000, isActive: true },
      { id: uuid(), name: "Kopi Susu", category: "Minuman", price: 8000, isActive: true },
      { id: uuid(), name: "Pisang Goreng", category: "Snack", price: 7000, isActive: true },
      { id: uuid(), name: "Risoles", category: "Snack", price: 6000, isActive: true },
    ],
    foodOrders: [],
    employees: [
      { id: uuid(), name: "Rina Marlina", phone: "081311122233", position: "Kasir", salary: 2500000 },
      { id: uuid(), name: "Doni Prasetyo", phone: "081344455566", position: "Kurir Laundry", salary: 2300000 },
    ],
    attendance: [],
    inventory: [
      { id: uuid(), name: "Deterjen Cair", qty: 12, unit: "liter", minStock: 5 },
      { id: uuid(), name: "Pewangi Pakaian", qty: 8, unit: "liter", minStock: 4 },
      { id: uuid(), name: "Beras", qty: 20, unit: "kg", minStock: 10 },
      { id: uuid(), name: "Minyak Goreng", qty: 6, unit: "liter", minStock: 5 },
    ],
    _counters: { laundry: 3, food: 0 },
  };
}

function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = seedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

function readDB() {
  ensureDB();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB, DB_PATH };
