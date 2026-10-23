# ⚡ Klikin - Micro-SaaS Link-in-Bio Platform

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat-square&logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql)](https://supabase.com)
[![Payment Gateway](https://img.shields.io/badge/Midtrans-Snap%20%26%20Core%20API-002855?style=flat-square)](https://midtrans.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

> Platform **Link-in-Bio micro-SaaS** modern, berkinerja tinggi, dan terjangkau khusus UMKM, influencer, dan kreator konten digital. Dibangun dengan backend Go berarsitektur MVC berlapis dan frontend React modular, terintegrasi penuh dengan payment gateway Midtrans dan database cloud Supabase PostgreSQL.

---

## 📑 Daftar Isi

- [1. Ringkasan Eksekutif & Value Proposition](#1-ringkasan-eksekutif--value-proposition)
- [2. Arsitektur Sistem & Tech Stack](#2-arsitektur-sistem--tech-stack)
- [3. Matriks Peran Pengguna (RBAC)](#3-matriks-peran-pengguna-rbac)
- [4. Fitur Utama Platform](#4-fitur-utama-platform)
  - [4.1 Account Owner (Kreator & UMKM)](#41-account-owner-kreator--umkm)
  - [4.2 Super Admin (Pengelola Platform)](#42-super-admin-pengelola-platform)
- [5. Siklus Transaksi Midtrans & Sistem Auto-Cancel](#5-siklus-transaksi-midtrans--sistem-auto-cancel)
- [6. Struktur Direktori Repositori](#6-struktur-direktori-repositori)
- [7. Panduan Instalasi & Menjalankan Aplikasi](#7-panduan-instalasi--menjalankan-aplikasi)
- [8. Referensi REST API](#8-referensi-rest-api)
- [9. Kriteria Kualitas & Keamanan](#9-kriteria-kualitas--keamanan)

---

## 1. Ringkasan Eksekutif & Value Proposition

### 1.1 Masalah Pasar vs Solusi Klikin

| Kebutuhan Pasar | Keterbatasan Solusi Eksisting (e.g. Linktree) | Solusi Unggulan Klikin |
| :--- | :--- | :--- |
| **Keterbatasan Link Sosial** | Bio Instagram, TikTok, & X hanya mengizinkan 1 tautan URL. | Satu URL bio interaktif (`klikin.id/username` atau domain kustom). |
| **Beban Biaya Langganan** | Paket Pro kompetitor luar negeri berkisar $5-$10/bulan (~Rp80.000-Rp160.000). | Harga terjangkau untuk pasar lokal: **Rp29.000/bulan** atau **Rp290.000/tahun**. |
| **Kustomisasi Desain** | Tampilan kaku, template generik dan tidak mencerminkan brand lokal. | Editor drag-and-drop, palet warna kustom, tombol dinamis, dan live mobile preview. |
| **Pembayaran Lokal** | Sering kali hanya mendukung kartu kredit internasional (Stripe/PayPal). | Mendukung **QRIS (GoPay, OVO, ShopeePay, DANA)**, Virtual Account BCA/BNI/BRI/Mandiri via Midtrans. |
| **Transparansi Analitik** | Analitik dibatasi atau rumit dipahami kreator pemula. | Dashboard performa: views, clicks, CTR, calendar filtering, sumber trafik, geo, dan perangkat. |
| **Konversi Penjualan** | Pengunjung sosmed sering hilang tanpa follow-up. | Form capture email leads dengan integrasi export CSV & direct WhatsApp CTA. |

### 1.2 Target Pengguna
- **Micro-Influencer & Content Creator (1K - 100K followers):** Mengorganisir tautan sponsor, portofolio, dan media sosial.
- **UMKM & Online Shop:** Menghubungkan katalog produk, lokasi toko, dan tombol langsung WhatsApp Checkout.
- **Freelancer & Professional:** Kartu nama digital dan etalase portofolio portabel.

---

## 2. Arsitektur Sistem & Tech Stack

```
[ Browser / Mobile Client ]
             │
             ▼
[ Frontend: React 18 + Vite + Tailwind CSS ]
             │  (REST API calls with JWT Bearer Token)
             ▼
[ Reverse Proxy / API Gateway : Go net/http Router ]
  ├── CORS & Security Middleware
  ├── JWT Auth & Role-Based Access Control (RBAC)
  ├── Rate Limiter & IP Blacklist Protection
  └── Maintenance Mode Interceptor
             │
             ├──► [ Controllers (HTTP Handler Layer) ]
             │            │
             │            ▼
             ├──► [ Services (Business Logic Layer) ]
             │            │
             │            ├──► [ Supabase PostgreSQL (via GORM) ]
             │            │
             │            ├──► [ Midtrans API (Snap, Core API, Webhook) ]
             │            │
             │            └──► [ Periodic Background Sweeper (Auto-Cancel) ]
```

### Rincian Teknologi:
- **Backend Language:** Go (Golang) 1.22+
  - **HTTP Router:** Go 1.22 Standard Library `http.ServeMux` (routing terstruktur method-based).
  - **ORM:** GORM v1.25 dengan driver PostgreSQL.
  - **Autentikasi:** JWT stateless tokens dengan hashing argon2/bcrypt dan validasi klaim RBAC.
  - **Payment Gateway:** Midtrans Snap API + Midtrans Core Status API + SHA-512 cryptographic webhook validation.
- **Frontend Architecture:** React 18 + Vite + Tailwind CSS v4
  - **State Management:** React Hooks dengan optimistic UI update.
  - **Icons:** Lucide Icons & SVG Design Kit.
  - **Design System:** Mobile-first, responsive grid, glassmorphism, semantic badges.
- **Database:** Supabase Cloud PostgreSQL (Transaction Pooler port 5432).

---

## 3. Matriks Peran Pengguna (RBAC)

Sistem menerapkan **Role-Based Access Control (RBAC)** ketat dengan 2 level hak akses:

| Kemampuan & Akses Modul | Super Admin | Account Owner | Pengunjung Publik |
| :--- | :---: | :---: | :---: |
| Mengakses Halaman Bio Publik (`/p/:slug`) | ✅ | ✅ | ✅ |
| Mencatat Event Analitik (View & Click) | ✅ | ✅ | ✅ |
| Mengelola Profil & Tautan Sendiri | ✅ | ✅ | ❌ |
| Kustomisasi Tema & Drag-and-Drop Blok | ✅ | ✅ | ❌ |
| Melihat Analitik Halaman Pribadi | ✅ | ✅ (Fitur lanjutan khusus Pro) | ❌ |
| Upgrade Langganan via Midtrans Snap | ❌ | ✅ | ❌ |
| Membatalkan Invoice Pending Mandiri | ❌ | ✅ | ❌ |
| Mengajukan Tiket Bantuan (Support Ticket) | ❌ | ✅ | ❌ |
| Manajemen Seluruh Pengguna Platform | ✅ | ❌ | ❌ |
| Impersonasi Akun Owner (Support Mode) | ✅ | ❌ | ❌ |
| Manajemen Keuangan & Audit Log Transaksi | ✅ | ❌ | ❌ |
| Moderasi Konten & Take Down Halaman | ✅ | ❌ | ❌ |
| Konfigurasi Domain Kustom & Platform Settings | ✅ | ❌ | ❌ |

---

## 4. Fitur Utama Platform

### 4.1 Account Owner (Kreator & UMKM)

1. **Editor Halaman Bio Interaktif:**
   - Visual drag-and-drop editor dengan live preview bingkai mobile.
   - Pilihan variasi tema (tema dasar untuk Free, tema premium & custom CSS untuk Pro).
   - Pengaturan avatar, nama tampilan, bio, warna latar, tipografi, dan radius tombol.
2. **Manajemen Blok & Tautan:**
   - Blok Tautan Standar (judul, URL, thumbnail kustom, favicon auto-fetch).
   - Blok Khusus: Header section, Divider garis, Paragraf teks bebas.
   - Blok Interaktif: Tombol Direct WhatsApp, Email CTA, YouTube embed, Spotify embed, TikTok embed.
   - Penjadwalan tautan dan grup kategori tautan (fitur Pro).
3. **Analitik Performa Halaman:**
   - Metrik Inti: Total Views, Total Clicks, Click-Through Rate (CTR).
   - Filter Kalender Dinamis: 7 Hari Terakhir, 30 Hari Terakhir, Bulan Ini, atau Custom Range.
   - Analisis Pro: Breakdown sumber trafik (Instagram, TikTok, Direct, Referral), negara/kota, perangkat (Mobile vs Desktop), dan browser.
   - Paywall UI elegan untuk pengguna paket Free.
4. **Domain Kustom (Pro):**
   - Menghubungkan domain pribadi (misal: `links.brandanda.com`).
   - Panduan DNS otomatis (rekaman CNAME & TXT) dengan pengecekan status verifikasi instan.
5. **Billing & Langganan Midtrans:**
   - Pilihan paket transparan (Bulanan Rp29.000 / Tahunan Rp290.000).
   - Pembayaran instan via Midtrans Snap (QRIS, GoPay, ShopeePay, Virtual Account).
   - Riwayat faktur terperinci dengan status dinamis: `LUNAS`, `MENUNGGU`, `DIBATALKAN`, dan `KEDALUWARSA`.
   - Cetak kwitansi resmi dengan kop surat pajak PT Klikin Solusi Digital.
   - Tombol pembatalan mandiri untuk invoice pending.
6. **Koleksi Email Leads (Pro):**
   - Blok formulir pengumpulan email pengunjung bio page.
   - Tabel manajemen leads dengan ekspor data ke format CSV.
7. **Pengaturan Halaman & Keamanan:**
   - Kustomisasi username/slug dengan validasi keunikan.
   - Proteksi halaman dengan kata sandi (fitur Pro).
   - Custom 404 redirect.
   - Integrasi tracking pixel (Google Analytics GA4, Meta Pixel, TikTok Pixel).
8. **Pusat Bantuan & Tiket:**
   - Pengajuan tiket bantuan dengan kategori teknis/billing.
   - Riwayat status tiket dan balasan admin.

---

### 4.2 Super Admin (Pengelola Platform)

1. **Dashboard Eksekutif Platform:**
   - Statistik real-time: Total Pengguna, Subscriber Aktif, Monthly Recurring Revenue (MRR), Churn Rate, Uji Coba Aktif, dan Total Page Views.
   - Grafik pertumbuhan pengguna baru vs subscriber baru (30 hari) dan tren revenue tahunan.
2. **Manajemen Pengguna (User Directory):**
   - Pencarian, filter status akun (Active, Suspended, Banned), dan filter paket langganan.
   - Aksi cepat: Edit profil, Reset password, Suspend sementara, Ban permanen, dan Impersonasi (login sebagai user).
3. **Manajemen Langganan & Finansial:**
   - Pengawasan status langganan seluruh akun owner.
   - Penyesuaian paket manual (upgrade/downgrade tanpa gateway untuk kebutuhan goodwill).
   - Pengelolaan kode promo/diskon dan pencatatan audit log finansial.
4. **Moderasi Konten & Keamanan:**
   - Daftar inspeksi halaman publik live.
   - Fitur flagging (Spam, Phishing, Adult, Perjudian) dan aksi take-down seketika.
   - Blacklist URL tujuan atau domain mencurigakan.
5. **Manajemen Domain Kustom:**
   - Monitoring verifikasi DNS domain kustom seluruh pengguna.
   - Trigger ulang provisioning SSL dan pelepasan domain jika terjadi pelanggaran TOS.
6. **Platform Settings & Maintenance:**
   - Konfigurasi kredensial Midtrans (Merchant ID, Client Key, Server Key, Production Toggle).
   - Mode pemeliharaan sistem (Maintenance Mode) dengan pesan kustom untuk pengunjung publik.
   - Pengaturan harga paket dan durasi masa uji coba.

---

## 5. Siklus Transaksi Midtrans & Sistem Auto-Cancel

Sistem Klikin menerapkan penanganan transaksi tangguh agar tagihan tidak menggantung:

```
[ Owner Klik Upgrade ]
          │
          ▼
[ Backend: Create Snap Token ] ──► Set Expiry: 24 Jam (QRIS Midtrans: 15 Menit)
          │
          ▼
[ Status Invoice: PENDING ]
          │
          ├──────────────────────────────────────────────────────┐
          │                                                      │
[ Skenario A: Pembayaran Sukses ]                       [ Skenario B: Dibatalkan / Expired ]
          │                                                      │
          ▼                                                      ▼
Midtrans Webhook / Verify                               - Webhook: 'expire' / 'cancel' / 'deny'
Status: settlement / capture                            - Owner menekan tombol "Batalkan"
          │                                             - Live Core API Check: 'cancel' / 'expire'
          ▼                                             - Background Sweeper: > 24 Jam atau > 10 Min (Abandoned)
Status Invoice -> LUNAS                                          │
Paket Pro Aktif Otomatis                                         ▼
                                                        Status Invoice -> DIBATALKAN
                                                        Trx Midtrans dibatalkan via Core API
```

### Mekanisme Proteksi Otomatis:
1. **Snap Transaction Expiry:** Setiap pembuatan sesi pembayaran menyertakan parameter `expiry: { unit: "hour", duration: 24 }`. Untuk pembayaran QRIS, Midtrans otomatis memberlakukan batas 15 menit.
2. **Webhook Listener:** Mengubah status invoice menjadi `cancelled` saat Midtrans mengirimkan notifikasi berstatus `expire`, `cancel`, atau `deny`. Validasi signature SHA-512 memastikan notifikasi asli dari server Midtrans.
3. **Automated Background Sweeper:**
   - Berjalan secara otomatis setiap **3 menit** via Go routine scheduler.
   - Dieksekusi seketika saat server boot dan saat owner membuka halaman billing.
   - Memeriksa endpoint Core API Midtrans (`/v2/{order_id}/status`) dan meng-cancel otomatis tagihan yang kedaluwarsa atau tidak diselesaikan dalam 10 menit.
4. **Manual Cancellation Endpoint:** Endpoint `POST /api/owner/billing/invoices/cancel` mengizinkan owner membatalkan tagihan pending kapan saja dan mengirimkan sinyal pembatalan ke Midtrans Core API.

---

## 6. Struktur Direktori Repositori

```
klikin/
├── backend/                             # Golang REST API Server (MVC Architecture)
│   ├── config/                          # Konfigurasi database, env, JWT, dan seeder
│   │   ├── config.go
│   │   ├── database.go
│   │   ├── jwt.go
│   │   └── seeder.go
│   ├── controllers/                     # HTTP Request Handlers
│   │   ├── admin/                       # Controller khusus Super Admin (10 modul)
│   │   ├── owner/                       # Controller khusus Account Owner (Billing, Leads, dll)
│   │   └── public/                      # Controller halaman publik & biodata
│   ├── middlewares/                     # HTTP Middlewares (Auth, RBAC, CORS, Logger)
│   ├── models/                          # Definisi Schema Tabel GORM
│   ├── routes/                          # Pemetaan Rute HTTP (Go 1.22 ServeMux)
│   ├── services/                        # Business Logic Layer
│   │   ├── admin/                       # Layanan analitik platform, moderasi, audit
│   │   ├── billing/                     # Midtrans Service & Billing Engine
│   │   ├── analytics/                   # Realtime event tracking & metrics
│   │   └── ...
│   ├── views/                           # JSON Presenter & Standardized DTOs
│   ├── .env.example
│   ├── go.mod
│   ├── go.sum
│   └── main.go                          # Entry point aplikasi Go
│
├── frontend/                            # Single Page Application (SPA)
│   ├── public/                          # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                   # Komponen Super Admin (Overview, User, Moderasi, Finance)
│   │   │   ├── owner/                   # Komponen Account Owner (Editor, Billing, Leads, Domain)
│   │   │   ├── AuthPage.jsx             # Autentikasi terpadu (Login, Register, Reset)
│   │   │   ├── BioEditor.jsx            # Drag-and-drop Bio Page Builder
│   │   │   ├── Dashboard.jsx            # Switcher role & routing dashboard
│   │   │   ├── PublicBioPage.jsx        # Halaman publik pengunjung (/p/:slug)
│   │   │   └── Icons.jsx                # Icon set
│   │   ├── App.jsx                      # Root application & client routing
│   │   ├── main.jsx                     # Vite mount point
│   │   └── index.css                    # Tailwind CSS tokens & styling
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── readme.md                            # Dokumentasi utama platform
```

---

## 7. Panduan Instalasi & Menjalankan Aplikasi

### 7.1 Prasyarat Sistem
- **Go:** Versi 1.22 atau lebih baru.
- **Node.js:** Versi 18.x atau lebih baru (npm v9+).
- **PostgreSQL:** Instance Supabase atau PostgreSQL lokal v14+.

---

### 7.2 Menjalankan Backend (Golang)

1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Buat file konfigurasi `.env` dari template:
   ```bash
   cp .env.example .env
   ```
3. Sesuaikan parameter pada `.env`:
   ```ini
   PORT=8080
   APP_ENV=development
   CLIENT_ORIGIN=http://localhost:5173

   # Database Supabase PostgreSQL
   DATABASE_URL="postgresql://user:password@host:5432/postgres?sslmode=require"

   # Midtrans Gateway (Sandbox / Dynamic Platform Settings)
   MIDTRANS_MERCHANT_ID="your_merchant_id"
   MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"
   MIDTRANS_SERVER_KEY="SB-Mid-server-xxxx"
   MIDTRANS_IS_PRODUCTION=false
   ```
4. Jalankan kompilasi dan start server:
   ```bash
   go run .
   ```
   Server backend akan aktif di `http://localhost:8080`.

---

### 7.3 Menjalankan Frontend (React + Vite)

1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Buat file `.env`:
   ```bash
   cp .env.example .env
   ```
3. Sesuaikan endpoint API pada `.env`:
   ```ini
   VITE_API_URL=http://localhost:8080/api
   ```
4. Instal dependensi dan jalankan server pengembangan:
   ```bash
   npm install
   npm run dev
   ```
   Aplikasi frontend dapat diakses melalui browser di `http://localhost:5173`.

---

### 7.4 Akun Seeder Pengujian

Database telah dilengkapi dengan akun bawaan untuk pengujian:

| Role | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@klikin.id` | `admin123` | Akses penuh dashboard administrasi |
| **Account Owner** | `owner@klikin.id` | `owner123` | Akun kreator dengan halaman demo aktif |

---

## 8. Referensi REST API

### 8.1 Publik & Halaman Bio
- `GET /api/health` - Status operasional API & koneksi database.
- `GET /api/pages/:slug` - Mengambil struktur konten halaman bio publik.
- `POST /api/pages/:slug/events` - Mencatat metrik impresi halaman atau klik tautan.
- `POST /api/pages/:slug/leads` - Menerima submit form email leads dari pengunjung.

### 8.2 Autentikasi & Akun
- `POST /api/auth/register` - Registrasi akun baru (Account Owner).
- `POST /api/auth/login` - Login email/password dan penerbitan token JWT.
- `POST /api/auth/google` - Login / pendaftaran via Google OAuth.
- `GET /api/user/profile` - Mengambil profil dan metadata akun login saat ini.

### 8.3 Account Owner (Billing & Bio)
- `GET /api/owner/billing` - Ringkasan status langganan, paket aktif, dan preferensi pembayaran.
- `POST /api/owner/billing/upgrade` - Membuat sesi transaksi baru via Midtrans Snap.
- `GET /api/owner/billing/invoices` - Mengambil riwayat seluruh invoice dan kwitansi.
- `GET /api/owner/billing/invoices/:id` - Mengambil rincian faktur untuk kwitansi resmi.
- `POST /api/owner/billing/invoices/cancel` - Membatalkan invoice pending secara manual.
- `POST /api/owner/billing/verify-midtrans` - Memverifikasi status penyelesaian pembayaran Midtrans.
- `GET /api/owner/analytics` - Mengambil metrik analitik halaman pribadi (views, clicks, CTR, geo, device).
- `GET /api/owner/leads` - Mengambil daftar leads email yang terkumpul.
- `GET /api/owner/domains` - Pengelolaan domain kustom dan pengecekan verifikasi DNS.

### 8.4 Webhook Gateway
- `POST /api/webhooks/midtrans` - Penerima notifikasi pembayaran Midtrans (dengan validasi kriptografi SHA-512).

### 8.5 Super Admin (Manajemen Platform)
- `GET /api/admin/overview` - Metrik agregat platform (MRR, total user, active subs, server health).
- `GET /api/admin/users` - Pencarian dan filter daftar seluruh pengguna.
- `PUT /api/admin/users/:id/status` - Mengubah status akun user (Active, Suspended, Banned).
- `POST /api/admin/users/:id/impersonate` - Menghasilkan token sesi untuk impersonasi user.
- `GET /api/admin/subscriptions` - Monitoring status langganan seluruh akun.
- `GET /api/admin/moderation/pages` - Daftar halaman bio untuk peninjauan moderasi konten.
- `POST /api/admin/moderation/pages/:id/takedown` - Membekukan atau menghapus halaman bio pelanggar TOS.
- `GET /api/admin/finance/kpi` - Metrik keuangan mendalam dan analisis margin keuntungan platform.

---

## 9. Kriteria Kualitas & Keamanan

1. **Performa Tinggi:** Waktu muat halaman publik dioptimalkan di bawah **1 detik** untuk jaringan seluler.
2. **Kriptografi & Verifikasi:** Notifikasi Midtrans wajib lolos uji signature SHA-512 yang memadukan Order ID, Status Code, Gross Amount, dan Server Key.
3. **Proteksi Injeksi & Sanitasi:** Seluruh input URL tautan dan data profil divalidasi dan disanitasi sebelum disimpan ke basis data.
4. **Audit Finansial:** Setiap perubahan status pembayaran atau goodwill perpanjangan dicatat dalam tabel audit log finansial permanen.
5. **Zero Zombie Transactions:** Mekanisme background sweeper menjamin tidak ada faktur berstatus pending yang menggantung melebihi masa berlakunya.

---

<p align="center">
  Dikelola dan dikembangkan oleh <strong>Tim Rekayasa Klikin</strong>.<br/>
  &copy; 2026 PT Klikin Solusi Digital. Hak cipta dilindungi undang-undang.
</p>