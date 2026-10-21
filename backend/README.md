# 🚀 Klikin Backend (Golang MVC)

Backend REST API untuk platform **Klikin** menggunakan bahasa Go dengan arsitektur **Model-View-Controller (MVC)**.

---

## 📁 Struktur Direktori MVC

```
backend/
├── config/             # Pengaturan konfigurasi & environment
│   └── config.go
├── controllers/        # Logika controller penanganan HTTP request
│   ├── health_controller.go
│   ├── page_controller.go
│   └── user_controller.go
├── middlewares/        # Middlewares HTTP (CORS, Logger, dll.)
│   ├── cors.go
│   └── logger.go
├── models/             # Representasi entitas data / domain models
│   ├── link.go
│   ├── page.go
│   └── user.go
├── routes/             # Pemetaan endpoint HTTP ke controller
│   └── routes.go
├── views/              # Presentasi & format response (JSON Presenter/DTOs)
│   └── response.go
├── .env.example        # Template konfigurasi environment
├── .gitignore
├── go.mod
└── main.go             # Entry point aplikasi & server lifecycle
```

---

## ⚙️ Cara Menjalankan Backend

### 1. Masuk ke folder backend
```bash
cd backend
```

### 2. (Opsional) Salin file environment
```bash
cp .env.example .env
```

### 3. Jalankan server
```bash
go run .
```

Server akan aktif secara default di `http://localhost:8080`.

---

## 📡 Endpoint Awal yang Tersedia

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/health` | Health check service & status |
| `GET` | `/api/user/profile` | Profil akun pengguna |
| `GET` | `/api/pages/{slug}` | Data bio page publik & daftar links (contoh: `/api/pages/demo`) |
