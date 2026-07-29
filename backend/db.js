const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function ensureTables() {
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

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Gagal terhubung ke PostgreSQL:', err.stack);
  }
  console.log('✅ Berhasil terhubung ke PostgreSQL (laundry_food_pos)!');
  release();
});

pool.ensureTables = ensureTables;
module.exports = pool;