# Laundry & Food POS Dashboard

Aplikasi POS (Point of Sale) full-stack untuk bisnis kombinasi **laundry & makanan**. Dibuat berdasarkan hasil review rekaman layar aplikasi referensi (dashboard, transaksi laundry, kasir makanan, karyawan, absensi, inventory, dan laporan).

## Struktur Proyek

```
laundry-food-pos/
├── backend/     # Express API + database JSON lokal (tidak perlu install MySQL/Postgres)
└── frontend/    # React + Vite + Tailwind CSS
```

## Fitur

- **Dashboard** — ringkasan pendapatan hari ini, split pendapatan laundry vs makanan, order aktif, aktivitas terbaru
- **Laundry** — keranjang multi-item (beberapa layanan sekaligus), hitung otomatis per kg, tracking status (Diterima → Proses Cuci → Siap Diambil → Selesai)
- **Food (Kasir)** — katalog produk dengan filter kategori, keranjang, checkout Cash/Transfer
- **Orders** — riwayat gabungan transaksi laundry & makanan dengan pencarian
- **Menu** — kelola produk makanan (tambah/edit/hapus/harga)
- **Karyawan** — data karyawan (nama, posisi, gaji)
- **Absensi** — catat kehadiran harian karyawan
- **Inventory** — stock barang dengan peringatan stok minimum
- **Laporan** — grafik pendapatan Harian/Bulanan/Tahunan + export CSV
- **Login** — autentikasi sederhana berbasis JWT

## Cara Menjalankan (Lokal)

Pastikan sudah terinstall **Node.js versi 18 ke atas**.

### 1. Jalankan Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Backend akan berjalan di `http://localhost:4000`. Saat pertama kali dijalankan, file `backend/data/db.json` otomatis dibuat berisi data contoh (akun login, harga layanan laundry, menu makanan, dll).

**Login default:** username `admin`, password `admin123` (bisa diganti di file `.env` sebelum menjalankan pertama kali).

### 2. Jalankan Frontend

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173` di browser. Frontend otomatis meneruskan request `/api/*` ke backend di port 4000 (sudah dikonfigurasi di `vite.config.js`).

### 3. Build untuk Produksi (opsional)

```bash
cd frontend
npm run build
```

Hasil build ada di `frontend/dist/` — bisa di-hosting di layanan static hosting mana pun (Vercel, Netlify, dsb), sedangkan backend bisa di-deploy terpisah (Railway, Render, VPS, dll).

## Kustomisasi

- **Harga & jenis layanan laundry** — edit `backend/src/db.js` bagian `settings.laundryServices`, atau hapus `backend/data/db.json` agar seed data dibuat ulang.
- **Warna & tampilan** — token warna ada di `frontend/tailwind.config.js` (`laundry` = biru, `food` = oranye).
- **Ganti database JSON ke database sungguhan** — logika baca/tulis data terpusat di `backend/src/db.js`, tinggal ganti isi `readDB()`/`writeDB()` untuk pindah ke PostgreSQL/MySQL/MongoDB tanpa mengubah routes.

## Catatan Keamanan

Proyek ini dibuat untuk penggunaan internal/lokal. Sebelum dipakai untuk data nyata atau di-deploy ke internet publik:
- Ganti `JWT_SECRET` dan password admin default di `.env`
- Pertimbangkan menambah rate-limiting & HTTPS
- Database JSON cocok untuk skala kecil (1 lokasi/single-user); untuk banyak pengguna sekaligus, migrasikan ke database sungguhan
