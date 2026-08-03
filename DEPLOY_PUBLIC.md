# Deployment Publik dengan Vercel + Backend Lokal + DB Privat

## Tujuan
- Frontend dipublish di Vercel
- Backend tetap berjalan di mesin lokal Anda
- Database PostgreSQL tetap lokal dan tidak dipublic
- Frontend bisa mengakses backend melalui URL publik yang dibuat oleh tunnel

## 1. Frontend di Vercel

### Project Settings
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

### Environment Variable
Tambahkan variabel environment pada project Vercel:

```bash
VITE_API_BASE_URL=https://your-public-backend-url
```

Contoh:

```bash
VITE_API_BASE_URL=https://pos-backend.example.com
```

---

## 2. Backend Lokal

Backend tetap berjalan di komputer Anda. Gunakan file `.env` untuk konfigurasi lokal:

```bash
PORT=4002
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_local_password
DB_NAME=laundry_food_pos
DB_SSL=false
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
JWT_SECRET=change-this-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Jalankan backend lokal

```bash
cd backend
npm install
npm start
```

---

## 3. Publish Backend ke URL Publik Tanpa Membuka DB

Karena database tetap lokal, Anda harus membuka endpoint backend ke publik lewat tunnel, misalnya:

- Cloudflare Tunnel
- Tailscale Funnel
- Ngrok

### Contoh arsitektur
- Vercel frontend: `https://nama-app.vercel.app`
- Backend tunnel: `https://pos-backend.example.com`
- Database Postgres lokal: `localhost:5432` (tidak dipublic)

Backend akan tetap menghubungi database PostgreSQL lokal di `localhost`, dan frontend Vercel akan memanggil URL publik backend yang dibentuk oleh tunnel.

---

## 4. CORS

Backend sudah menerima variabel:

```bash
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

Pastikan domain Vercel Anda dimasukkan di sana supaya browser tidak memblokir request.

---

## 5. Role Admin / Owner

Akses food-related route sudah dibatasi di frontend dan backend agar role `owner` tidak bisa mengakses fitur food/produk/order dari UI/API.

---

## 6. Checklist Akhir

- [ ] Frontend build sukses di Vercel
- [ ] `VITE_API_BASE_URL` sudah diisi
- [ ] Backend lokal berjalan
- [ ] Backend dipublic melalui tunnel
- [ ] `ALLOWED_ORIGINS` berisi domain Vercel
- [ ] Database PostgreSQL tetap lokal

---

## 7. Catatan Keamanan

- Jangan membukakan port PostgreSQL ke internet
- Gunakan HTTPS pada URL publik backend
- Ganti `JWT_SECRET` dan password default admin
- Batasi akses tunnel hanya untuk URL yang Anda perlukan
