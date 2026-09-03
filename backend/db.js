const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      position TEXT,
      salary NUMERIC DEFAULT 0,
      username TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      date DATE,
      status TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      qty NUMERIC DEFAULT 0,
      unit TEXT,
      min_stock NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.food_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price NUMERIC DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.laundry_services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_per_kg NUMERIC DEFAULT 0,
      eta_hours INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT,
      type TEXT,
      order_no TEXT,
      items JSONB,
      total_amount NUMERIC(12,2) DEFAULT 0,
      status TEXT,
      phone TEXT,
      payment_method TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(order_no, type)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.laundry_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE,
      customer_name TEXT,
      phone TEXT,
      items JSONB,
      total_amount NUMERIC DEFAULT 0,
      payment_method TEXT,
      status TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.food_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE,
      customer_name TEXT,
      items JSONB,
      total_amount NUMERIC DEFAULT 0,
      payment_method TEXT,
      status TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function seedInitialData() {
  const defaultSettings = [
    { key: 'business_name', value: 'Laundry & Food Corner' },
  ];

  for (const item of defaultSettings) {
    await pool.query(
      `INSERT INTO public.settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING;`,
      [item.key, item.value]
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminHash = bcrypt.hashSync(adminPassword, 10);
  await pool.query(
    `INSERT INTO public.users (id, username, password_hash, name, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username) DO NOTHING;`,
    ['admin', process.env.ADMIN_USERNAME || 'admin', adminHash, 'Admin', 'owner']
  );

  const laundryServices = [
    { id: 'svc-kering', name: 'Cuci Kering', price_per_kg: 6000, eta_hours: 48 },
    { id: 'svc-setrika', name: 'Cuci + Setrika', price_per_kg: 8000, eta_hours: 48 },
    { id: 'svc-express', name: 'Cuci Express (Sehari Jadi)', price_per_kg: 12000, eta_hours: 24 },
    { id: 'svc-setrika-saja', name: 'Setrika Saja', price_per_kg: 5000, eta_hours: 24 },
  ];

  for (const service of laundryServices) {
    await pool.query(
      `INSERT INTO public.laundry_services (id, name, price_per_kg, eta_hours)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING;`,
      [service.id, service.name, service.price_per_kg, service.eta_hours]
    );
  }

  const defaultProducts = [
  {
    id: "food-nasi-goreng-spesial",
    name: "Nasi Goreng Spesial",
    category: "Makanan Berat",
    price: 18000,
  },
  {
    id: "food-mie-goreng-ayam",
    name: "Mie Goreng Ayam",
    category: "Makanan Berat",
    price: 16000,
  },
  {
    id: "food-ayam-geprek",
    name: "Ayam Geprek",
    category: "Makanan Berat",
    price: 15000,
  },
  {
    id: "food-es-teh-manis",
    name: "Es Teh Manis",
    category: "Minuman",
    price: 5000,
  },
  {
    id: "food-es-jeruk",
    name: "Es Jeruk",
    category: "Minuman",
    price: 6000,
  },
  {
    id: "food-kopi-susu",
    name: "Kopi Susu",
    category: "Minuman",
    price: 8000,
  },
  {
    id: "food-pisang-goreng",
    name: "Pisang Goreng",
    category: "Snack",
    price: 7000,
  },
  {
    id: "food-risoles",
    name: "Risoles",
    category: "Snack",
    price: 6000,
  },
];

  for (const product of defaultProducts) {
    await pool.query(
      `INSERT INTO public.food_products (id, name, category, price, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (id) DO NOTHING;`,
      [product.id, product.name, product.category, product.price]
    );
  }
}

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Gagal terhubung ke PostgreSQL:', err.stack);
  }
  console.log('✅ Berhasil terhubung ke PostgreSQL (laundry_food_pos)!');
  release();
});

pool.ensureTables = ensureTables;
pool.seedInitialData = seedInitialData;
module.exports = pool;