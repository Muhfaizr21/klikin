# 📘 README — Klikin

---

# 🎯 1. MAKSUD & TUJUAN APLIKASI

## 1.1 Apa Aplikasi Ini?

Platform **Link-in-Bio micro-SaaS** berlangganan — alat untuk membuat satu halaman web yang menampung banyak tautan, digunakan di bio Instagram, TikTok, Twitter/X, dan media sosial lainnya.

Pengguna (influencer kecil & UMKM) membuat satu URL (misal `namakamu.klikin.id` atau domain sendiri), lalu mengisi halaman tersebut dengan tautan ke toko online, WhatsApp, YouTube, produk digital, dan lainnya.

## 1.2 Masalah yang Diselesaikan

| Masalah | Solusi Aplikasi |
|---|---|
| Bio media sosial hanya bisa 1 link | Satu halaman berisi banyak link |
| Linktree terasa mahal untuk kreator kecil | Harga Rp29.000/bulan, jauh lebih murah |
| Tampilan Linktree seragam & membosankan | Editor drag-and-drop + tema kustom |
| Kreator tidak tahu link mana yang diklik | Analitik lengkap: klik per link, sumber trafik, geo, device |
| Brand butuh URL profesional | Domain kustom (misal `links.namabrand.com`) |
| Kehilangan audiens karena hanya di sosmed | Form email capture untuk kumpulkan leads |

## 1.3 Tujuan Bisnis

- **Model:** Freemium berlangganan (Free + Pro Rp29.000/bulan)
- **Target:** ~5.200 subscriber aktif dalam 6–12 bulan (≈ Rp150 juta/bulan ≈ Rp5 juta/hari)
- **Strategi akuisisi:** Viral loop (badge platform di halaman Free) + SEO + iklan kecil
- **Fokus retensi:** Analitik & domain kustom sebagai alasan upgrade & bertahan

## 1.4 Siapa Penggunanya

| Segmen | Kebutuhan |
|---|---|
| Influencer kecil (1K–100K follower) | Halaman bio rapi + analitik klik |
| UMKM / toko online | Satu link untuk semua channel jualan |
| Kreator konten | Kumpulkan leads & arahkan ke produk |
| Freelancer / personal brand | Portofolio link dalam satu halaman |

## 1.5 Prinsip Produk

1. **Cepat** — halaman publik harus loading < 1 detik
2. **Mudah** — pengguna baru bisa publish halaman dalam < 3 menit
3. **Indah** — tampilan bisa dikustomisasi, tidak seragam
4. **Terukur** — analitik jelas agar pengguna tahu apa yang berhasil
5. **Terjangkau** — harga Rp29.000/bulan, ramah kreator kecil

---

# 👥 2. ROLE PENGGUNA

Hanya **2 role**:

| Role | Siapa | Cakupan Akses |
|---|---|---|
| **Super Admin** | Founder/tim internal platform | Semua data & pengaturan platform |
| **Account Owner** | Customer pemilik halaman bio | Hanya halaman & data miliknya sendiri |

**Aturan penting:**
- Account Owner **BISA** melihat analitik halamannya sendiri
- Account Owner **TIDAK BISA** melihat data user lain, analitik global, atau pengaturan platform
- Super Admin **BISA** impersonate Account Owner untuk troubleshooting

---

# 🛡️ 3. FITUR — SUPER ADMIN

Admin internal platform. 10 modul, ~80 fitur.

## 3.1 Dashboard Overview
- Statistik ringkas: total user, subscriber aktif, MRR, churn, trial aktif, page views hari ini
- Grafik pertumbuhan: user baru vs subscriber baru (30 hari), revenue per bulan (12 bulan), distribusi paket
- Feed aktivitas terbaru: user daftar, upgrade, cancel, domain error
- Alert sistem: pembayaran gagal, domain pending, tiket belum dijawab
- Quick action: broadcast email, maintenance mode

## 3.2 Manajemen User
- Lihat semua user (search, filter status/paket, sort, pagination)
- Detail user: profil, halaman bio, langganan, analitik, log aktivitas, catatan internal
- Edit user: email, username, reset password
- Suspend user (sementara)
- Ban user (permanen)
- Hapus user (soft + hard delete)
- Impersonate user (login sebagai user)
- Verifikasi manual (badge)
- Export data user (CSV)

## 3.3 Manajemen Langganan
- Lihat semua langganan (status: trial/active/past_due/canceled/expired)
- Ubah paket manual (upgrade/downgrade tanpa Stripe)
- Perpanjang manual (goodwill)
- Batalkan langganan
- Proses refund
- Lihat invoice per user
- Kelola trial: perpanjang, shorten, konversi ke paid
- Kupon & diskon: buat, atur, lihat penggunaan
- Dunning: lihat pembayaran gagal, kirim reminder manual

## 3.4 Manajemen Domain Kustom
- Daftar semua domain kustom
- Status: pending, verifying, active, error, expired
- Re-verify DNS manual
- Trigger ulang provisioning SSL
- Lepas domain (jika abuse)
- Log error DNS
- Kirim panduan DNS ke user

## 3.5 Moderasi Konten
- Daftar halaman publik live
- Flag konten (phishing, spam, adult, judi)
- Review laporan dari pengunjung
- Take down halaman
- Ban user pelanggar
- Blacklist URL/domain berbahaya
- Log riwayat moderasi

## 3.6 Analitik Platform
- Total page views & clicks platform (agregat)
- Top halaman & top user
- Traffic source global (IG, TikTok, Direct, Referral)
- Geo global (top negara/kota)
- Device & browser breakdown
- Error rate, uptime monitoring
- Filter 7/30/90 hari, export CSV

## 3.7 Keuangan
- MRR, ARR projection, ARPU, LTV, Churn, Net Revenue
- Grafik MRR growth & churn vs new subscriber
- Input biaya infrastruktur manual
- Kalkulasi profit margin otomatis
- Export laporan (CSV/PDF)

## 3.8 Support & Komunikasi
- Kotak masuk tiket (filter status/kategori)
- Detail tiket + balas (via dashboard/email)
- Ubah status & prioritas
- Canned responses (template balasan)
- Broadcast email ke user/segmen
- Notifikasi in-app ke user
- Log komunikasi

## 3.9 Pengaturan Platform
- Umum: nama platform, logo, maintenance mode, bahasa default
- Trial & harga: durasi trial, harga paket, feature flags per paket
- Email: SMTP, template transaksional, test kirim
- Pembayaran: Stripe keys, webhook secret, test mode
- Domain: subdomain default, batas domain kustom per paket
- SEO: meta default, sitemap, robots.txt

## 3.10 Audit & Keamanan
- Log audit: siapa, kapan, aksi apa
- Log login user + IP
- Log error aplikasi (stack trace)
- Rate limit monitor
- Blacklist IP
- 2FA wajib untuk super admin
- Manajemen sesi admin (lihat/terminate)
- Trigger backup data manual

---

# 👤 4. FITUR — ACCOUNT OWNER

Customer pemilik halaman bio. 8 modul, ~110 fitur.

## 4.1 Onboarding & Akun
- Registrasi via email/password
- Registrasi via Google OAuth
- Verifikasi email
- Pilih username (cek ketersediaan subdomain)
- Wizard onboarding 3 langkah: pilih tema → tambah link → publish
- Login email/password + Google OAuth
- Lupa password (reset via email)
- Ubah password
- Verifikasi 2FA (opsional)
- Hapus akun (self-service dengan konfirmasi)
- Pengaturan profil: nama, email, foto, bahasa

## 4.2 Editor Halaman Bio
- Edit profil halaman: avatar, nama tampilan, bio
- Upload & crop avatar otomatis
- Pilih tema (10–15 tema dasar di Free, lebih banyak di Pro)
- Kustomisasi tema dasar: warna background, warna tombol, font, radius tombol
- Kustomisasi Pro: CSS custom, spacing, shadow, background image/video, favicon
- Drag-and-drop blok: Link, Header, Divider, Teks, Sosmed, Embed
- Urutkan blok naik/turun
- Hapus blok
- Duplikat blok
- Pratinjau real-time (bingkai mobile)
- Preview mode sebelum publish
- Publish/unpublish halaman
- SEO halaman: meta title, meta description, OG image

## 4.3 Manajemen Link
- Tambah link: judul, URL, thumbnail, deskripsi
- Edit link
- Hapus link
- Urutkan link (drag up/down)
- Aktif/nonaktifkan link tanpa hapus
- Ikon otomatis (deteksi favicon dari URL)
- Upload thumbnail kustom
- Short link (opsional)
- UTM builder (parameter UTM)
- Deep link detection (IG, TikTok, dll)
- Penjadwalan link (Pro): muncul/sembunyi otomatis
- Statistik per link (klik, CTR, device, geo)
- Grup/kategori link (folder)

## 4.4 Blok Khusus
- Blok header (judul section)
- Blok divider (pemisah visual)
- Blok teks (paragraf bebas)
- Blok sosmed (ikon IG, TikTok, X, FB, dll)
- Blok WhatsApp CTA (chat langsung)
- Blok email CTA (tombol kirim email)
- Blok embed YouTube
- Blok embed Spotify
- Blok embed TikTok
- Blok formulir email (Pro) — kumpulkan email pengunjung
- Blok tip jar (V3) — donasi
- Blok produk digital (V3) — jual produk
- Blok tautan berbayar (V3) — gate link

## 4.5 Analitik (Halaman Sendiri) ✅
- Page views (total tampilan halaman)
- Total klik (agregat)
- CTR (persentase klik/tampilan)
- Statistik per link
- Grafik harian (BISA DI SET SESAUI KALENDER)
- Sumber trafik (Pro): IG, TikTok, Direct, Referral
- Geo (Pro): negara/kota
- Device (Pro): mobile vs desktop
- Browser (Pro)
- Referrer
- Export CSV (Pro)
- Realtime view (opsional)

**Paywall Free:** Free hanya bisa lihat views, klik, CTR, 7 hari. Fitur Pro (source/geo/device/export) memunculkan modal upgrade.

## 4.6 Domain Kustom (Pro)
- Tambah domain sendiri
- Instruksi DNS step-by-step (CNAME/TXT)
- Cek status: pending, verifying, active, error
- Re-verifikasi DNS
- SSL otomatis (status provisioning)
- Hapus domain
- Redirect www toggle
- Fallback ke subdomain platform jika domain error

## 4.7 Langganan & Billing
- Lihat perbandingan paket (Free vs Pro vs Agensi)
- Upgrade (Free → Pro via Stripe Checkout)
- Downgrade (Pro → Free, aktif sampai akhir periode)
- Mulai trial 7–14 hari
- Lihat status langganan: active, trial, past_due, canceled
- Lihat riwayat invoice
- Unduh invoice (PDF)
- Update metode pembayaran (Stripe Billing Portal)
- Batalkan langganan (self-service dengan alasan)
- Reaktivasi sebelum expired
- Input kode promo/diskon
- Notifikasi billing: reminder renewal, gagal bayar

## 4.8 Email Capture (Pro)
- Aktifkan form email
- Kustomisasi form: judul, deskripsi, placeholder, tombol
- Lihat daftar leads (email masuk)
- Export leads (CSV)
- Integrasi Mailchimp / ConvertKit (opsional)
- Notifikasi email saat lead baru
- Hapus lead manual
- Checkbox consent (GDPR-friendly)

## 4.9 Pengaturan Halaman
- Ubah slug/username (dengan validasi)
- Visibility: publik / private
- Password halaman (Pro)
- Custom 404 redirect
- Upload favicon
- Meta halaman: title, description, OG image
- Tempel Google Analytics (GA4)
- Tempel Meta Pixel
- Tempel TikTok Pixel

## 4.10 Notifikasi User
- Notifikasi in-app (bell icon)
- Email transaksional: welcome, verifikasi, billing, domain status
- Preferensi notifikasi (atur email mana yang diterima)
- Riwayat notifikasi

## 4.11 Support (Sisi User)
- Buka tiket (subjek, kategori, deskripsi, lampiran)
- Lihat riwayat tiket + status
- Balas tiket
- FAQ / help center
- Form kontak
- Kirim saran fitur (feedback)

---

# 🔒 5. MATRIKS AKSES

| Fitur | Super Admin | Account Owner |
|---|---|---|
| Data user lain | ✅ | ❌ |
| Halaman user lain | ✅ | ❌ |
| Analitik platform global | ✅ | ❌ |
| Analitik halaman sendiri | ✅ (via impersonate) | ✅ |
| Billing user lain | ✅ | ❌ |
| Billing sendiri | ❌ | ✅ |
| Moderasi konten | ✅ | ❌ |
| Pengaturan platform | ✅ | ❌ |
| Pengaturan halaman sendiri | ✅ (via impersonate) | ✅ |
| Ubah harga paket | ✅ | ❌ |
| Upgrade/downgrade sendiri | ❌ | ✅ |
| Suspend/ban user | ✅ | ❌ |
| Publish halaman sendiri | ❌ | ✅ |
| Domain kustom sendiri | ❌ | ✅ |

---

# 🎯 6. PRIORITAS MVP

## Super Admin — MVP
1. Dashboard statistik dasar (total user, MRR, churn)
2. Daftar user + detail + suspend
3. Daftar langganan + lihat invoice
4. Moderasi halaman (take down)
5. Tiket support sederhana
6. Log audit
7. Pengaturan platform dasar

## Account Owner — MVP
1. Registrasi + login (email + Google)
2. Pilih username/subdomain
3. Editor drag-and-drop (link, header, divider)
4. 10–15 tema dasar
5. Manajemen link (tambah, edit, hapus, urutkan)
6. Analitik dasar (views, klik, CTR, 7 hari)
7. Upgrade ke Pro via Stripe
8. Pengaturan profil
9. Publish/unpublish halaman
10. Notifikasi billing dasar

## Fase V2 (Pendorong Konversi Pro)
- Domain kustom
- Analitik lanjutan (source, geo, device)
- Email capture
- Penjadwalan link
- CSS custom
- Hilangkan badge platform
- Export CSV

## Fase V3 (Diferensiasi & Revenue Tambahan)
- Tip jar / donasi
- Jual produk digital
- Tautan berbayar
- Multi-profil / tier Agensi
- Asisten AI
- API publik + webhook
- Integrasi Zapier
- Program referral
- Halaman discovery

---

# 📊 7. RINGKASAN

| Role | Modul | Jumlah Fitur |
|---|---:|---:|
| Super Admin | 10 modul | ~80 fitur |
| Account Owner | 11 modul | ~110 fitur |
| **Total** | **21 modul** | **~190 fitur** |

- **MVP:** ~30 fitur inti
- **Setelah V2:** ~80 fitur
- **Setelah V3:** ~190 fitur lengkap

---

# ✅ 8. KRITERIA SUKSES APLIKASI

1. Pengguna baru bisa publish halaman dalam < 3 menit
2. Halaman publik loading < 1 detik (mobile, 3G)
3. Konversi Free → Pro minimal 3–5%
4. Churn bulanan < 5%
5. MRR mencapai Rp150 juta dalam 12 bulan
6. Uptime halaman publik > 99.9%