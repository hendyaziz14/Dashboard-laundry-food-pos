const express = require("express");
const pool = require("../../db");
const { readDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/orders", requireAuth, async (req, res) => {
  const db = readDB();
  const candidates = [];

  db.laundryOrders.forEach((order) => {
    candidates.push({
      type: "laundry",
      orderNo: order.orderNo,
      customerName: order.customerName || "",
      items: JSON.stringify(order.items || []),
      totalAmount: Number(order.total || 0),
      status: order.status || "Diterima",
      phone: order.phone || "",
      paymentMethod: order.paymentMethod || "Cash",
      notes: order.notes || "",
    });
  });

  db.foodOrders.forEach((order) => {
    candidates.push({
      type: "food",
      orderNo: order.orderNo,
      customerName: order.customerName || "",
      items: JSON.stringify(order.items || []),
      totalAmount: Number(order.total || 0),
      status: order.status || "Selesai",
      phone: "",
      paymentMethod: order.paymentMethod || "Cash",
      notes: "",
    });
  });

  let inserted = 0;
  let skipped = 0;

  for (const record of candidates) {
    const existing = await pool.query(
      "SELECT id FROM public.orders WHERE order_no = $1 AND type = $2",
      [record.orderNo, record.type]
    );

    if (existing.rows.length > 0) {
      skipped += 1;
      continue;
    }

    await pool.query(
      `INSERT INTO public.orders (customer_name, type, items, total_amount, status, order_no, phone, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        record.customerName,
        record.type,
        record.items,
        record.totalAmount,
        record.status,
        record.orderNo,
        record.phone,
        record.paymentMethod,
        record.notes,
      ]
    );

    inserted += 1;
  }

  res.json({ inserted, skipped, total: inserted + skipped });
});

router.post("/all", requireAuth, async (req, res) => {
  const db = readDB();
  const results = {
    users: { inserted: 0, skipped: 0 },
    employees: { inserted: 0, skipped: 0 },
    attendance: { inserted: 0, skipped: 0 },
    inventory: { inserted: 0, skipped: 0 },
    foodProducts: { inserted: 0, skipped: 0 },
    laundryServices: { inserted: 0, skipped: 0 },
    laundryOrders: { inserted: 0, skipped: 0 },
    foodOrders: { inserted: 0, skipped: 0 },
    orders: { inserted: 0, skipped: 0 },
  };

  const insertRow = async (query, values) => {
    await pool.query(query, values);
  };

  for (const user of db.users || []) {
    const existing = await pool.query("SELECT id FROM public.users WHERE id = $1", [user.id]);
    if (existing.rows.length) {
      results.users.skipped += 1;
      continue;
    }
    await insertRow(
      `INSERT INTO public.users (id, username, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, user.username, user.passwordHash, user.name, user.role]
    );
    results.users.inserted += 1;
  }

  for (const employee of db.employees || []) {
    const existing = await pool.query("SELECT id FROM public.employees WHERE id = $1", [employee.id]);
    if (existing.rows.length) {
      results.employees.skipped += 1;
      continue;
    }
    await insertRow(
      `INSERT INTO public.employees (id, name, phone, position, salary, username)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [employee.id, employee.name, employee.phone, employee.position, employee.salary, employee.username || null]
    );
    results.employees.inserted += 1;
  }

  for (const attendance of db.attendance || []) {
    const existing = await pool.query("SELECT id FROM public.attendance WHERE id = $1", [attendance.id]);
    if (existing.rows.length) {
      results.attendance.skipped += 1;
      continue;
    }
    await insertRow(
      `INSERT INTO public.attendance (id, employee_id, employee_name, date, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [attendance.id, attendance.employeeId, attendance.employeeName, attendance.date, attendance.status, attendance.notes, attendance.createdAt || new Date().toISOString()]
    );
    results.attendance.inserted += 1;
  }

  for (const item of db.inventory || []) {
    const existing = await pool.query("SELECT id FROM public.inventory WHERE id = $1", [item.id]);
    if (existing.rows.length) {
      results.inventory.skipped += 1;
      continue;
    }
    await insertRow(
      `INSERT INTO public.inventory (id, name, qty, unit, min_stock)
       VALUES ($1, $2, $3, $4, $5)`,
      [item.id, item.name, item.qty, item.unit, item.minStock]
    );
    results.inventory.inserted += 1;
  }

  for (const product of db.foodProducts || []) {
    const existing = await pool.query("SELECT id FROM public.food_products WHERE id = $1", [product.id]);
    if (existing.rows.length) {
      results.foodProducts.skipped += 1;
      continue;
    }
    await insertRow(
      `INSERT INTO public.food_products (id, name, category, price, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [product.id, product.name, product.category, product.price, product.isActive !== false]
    );
    results.foodProducts.inserted += 1;
  }

  for (const service of db.settings?.laundryServices || []) {
    const existing = await pool.query("SELECT id FROM public.laundry_services WHERE id = $1", [service.id]);
    if (existing.rows.length) {
      results.laundryServices.skipped += 1;
      continue;
    }
    await insertRow(
      `INSERT INTO public.laundry_services (id, name, price_per_kg, eta_hours)
       VALUES ($1, $2, $3, $4)`,
      [service.id, service.name, service.pricePerKg, service.etaHours]
    );
    results.laundryServices.inserted += 1;
  }

  for (const order of db.laundryOrders || []) {
    const existing = await pool.query("SELECT id FROM public.laundry_orders WHERE id = $1", [order.id]);
    if (existing.rows.length) {
      results.laundryOrders.skipped += 1;
    } else {
      await insertRow(
        `INSERT INTO public.laundry_orders (id, order_no, customer_name, phone, items, total_amount, payment_method, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          order.id,
          order.orderNo,
          order.customerName,
          order.phone,
          JSON.stringify(order.items || []),
          order.total,
          order.paymentMethod,
          order.status,
          order.notes,
          order.createdAt,
          order.updatedAt,
        ]
      );
      results.laundryOrders.inserted += 1;
    }

    const generalExisting = await pool.query("SELECT id FROM public.orders WHERE order_no = $1 AND type = $2", [order.orderNo, "laundry"]);
    if (generalExisting.rows.length) {
      results.orders.skipped += 1;
    } else {
      await insertRow(
        `INSERT INTO public.orders (customer_name, type, order_no, items, total_amount, status, phone, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [order.customerName, "laundry", order.orderNo, JSON.stringify(order.items || []), order.total, order.status, order.phone, order.paymentMethod, order.notes]
      );
      results.orders.inserted += 1;
    }
  }

  for (const order of db.foodOrders || []) {
    const existing = await pool.query("SELECT id FROM public.food_orders WHERE id = $1", [order.id]);
    if (existing.rows.length) {
      results.foodOrders.skipped += 1;
    } else {
      await insertRow(
        `INSERT INTO public.food_orders (id, order_no, customer_name, items, total_amount, payment_method, status, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          order.id,
          order.orderNo,
          order.customerName,
          JSON.stringify(order.items || []),
          order.total,
          order.paymentMethod,
          order.status,
          order.notes,
          order.createdAt,
        ]
      );
      results.foodOrders.inserted += 1;
    }

    const generalExisting = await pool.query("SELECT id FROM public.orders WHERE order_no = $1 AND type = $2", [order.orderNo, "food"]);
    if (generalExisting.rows.length) {
      results.orders.skipped += 1;
    } else {
      await insertRow(
        `INSERT INTO public.orders (customer_name, type, order_no, items, total_amount, status, phone, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [order.customerName || "Pelanggan Umum", "food", order.orderNo, JSON.stringify(order.items || []), order.total, order.status, "", order.paymentMethod, order.notes || ""]
      );
      results.orders.inserted += 1;
    }
  }

  res.json({ results });
});

module.exports = router;
