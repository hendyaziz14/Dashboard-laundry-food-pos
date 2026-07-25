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

async function ensureOrdersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT,
      type TEXT,
      items JSONB,
      total_amount NUMERIC(12,2) DEFAULT 0,
      status TEXT,
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

pool.ensureOrdersTable = ensureOrdersTable;
module.exports = pool;