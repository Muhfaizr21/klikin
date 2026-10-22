import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminMetricCards from './AdminMetricCards';
import RevenueByCategoryCard from './RevenueByCategoryCard';
import TopTenantPerformanceCard from './TopTenantPerformanceCard';
import JourneyConversionCard from './JourneyConversionCard';
import CohortRetentionCard from './CohortRetentionCard';
import UserDirectoryTable from './UserDirectoryTable';
import PlatformOverviewCharts from './PlatformOverviewCharts';
import { API_BASE } from '../../lib/api';
import { navigateTo } from '../../utils/navigation';
import {
  GlobeIcon,
  CreditCardIcon,
  BarChartIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  MessageCircleIcon,
  LockIcon,
  UsersIcon,
  TrashIcon,
  ExternalLinkIcon,
  SettingsIcon,
  SparklesIcon,
} from '../Icons';

/**
 * SuperAdminDashboard Component
 * High-end platform intelligence & multi-tenant console.
 * Strictly aligned with 10 Super Admin Modules from Section 3 in README.md:
 * 3.1 Dashboard Overview
 * 3.2 Manajemen User
 * 3.3 Manajemen Langganan
 * 3.4 Manajemen Domain Kustom
 * 3.5 Moderasi Konten
 * 3.6 Analitik Platform
 * 3.7 Keuangan
 * 3.8 Support & Komunikasi
 * 3.9 Pengaturan Platform
 * 3.10 Audit & Keamanan
 */
export default function SuperAdminDashboard({
  user,
  token,
  onLogout,
  onBackToHome,
  initialTab = 'reports',
}) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'reports');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Sync activeTab when initialTab prop updates from URL
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      if (statsData.success) setStats(statsData.data);
      if (usersData.success) setUsers(usersData.data);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Gagal memuat data analitik Super Admin: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    navigateTo(`/admin/${tabId}`);
  };

  const handleExport = () => {
    setFeedback({
      type: 'success',
      message: 'Laporan platform bulan September 2026 berhasil diekspor (Format CSV).',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col lg:flex-row font-sans antialiased text-slate-800">
      {/* Left Navigation Sidebar with 10 Modules */}
      <AdminSidebar
        user={user}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onLogout={onLogout}
        userCount={users.length}
      />

      {/* Right Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 overflow-x-hidden">
        {/* Top Feedback Notification */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border shadow-2xs transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
                : 'bg-rose-50 border-rose-200/80 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.1: DASHBOARD OVERVIEW (Full Reference Design + Additional Intelligence Charts) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AdminHeader
              title="Dashboard Overview"
              subtitle="September 2026 • Analisis performa platform Klikin, dinamika trafik, dan kesehatan operasional"
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
              onExport={handleExport}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* 5 Top KPI Cards */}
            <AdminMetricCards stats={stats} />

            {/* Middle Section: Revenue by category (7 cols) + Provider utilisation (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <RevenueByCategoryCard />
              </div>
              <div className="lg:col-span-5">
                <TopTenantPerformanceCard
                  onActionClick={() => {
                    setFeedback({
                      type: 'success',
                      message: 'Rekomendasi optimasi slot telah disimulasikan pada tenant.',
                    });
                    setTimeout(() => setFeedback(null), 3500);
                  }}
                />
              </div>
            </div>

            {/* Bottom Section: Journey conversion funnel (7 cols) + Cohort Retention Heatmap (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <JourneyConversionCard />
              </div>
              <div className="lg:col-span-5">
                <CohortRetentionCard />
              </div>
            </div>

            {/* Dinamika Trafik & Analisis Perilaku Pengunjung */}
            <div className="pt-6 border-t border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Analisis Dinamika Trafik & Perilaku Pengunjung
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Pola interaksi jam sibuk 24 jam, saluran referal utama, dan komposisi sektor tenant
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto font-mono">
                  Data Realtime • 24 Jam Terakhir
                </span>
              </div>
              <PlatformOverviewCharts />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.6: ANALITIK PLATFORM / REPORTS (Primary Reference View) */}
        {/* ========================================================================= */}
        {(activeTab === 'reports' || activeTab === 'analytics') && (
          <div className="space-y-6">
            <AdminHeader
              title="Laporan Platform & Analitik"
              subtitle="September 2026 • Analisis performa platform Klikin dibandingkan Agustus"
              activeSubTab={activeSubTab}
              onSelectSubTab={setActiveSubTab}
              onExport={handleExport}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* 5 Top KPI Cards */}
            <AdminMetricCards stats={stats} />

            {/* Middle Section: Revenue by category (7 cols) + Provider utilisation (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <RevenueByCategoryCard />
              </div>
              <div className="lg:col-span-5">
                <TopTenantPerformanceCard
                  onActionClick={() => {
                    setFeedback({
                      type: 'success',
                      message: 'Rekomendasi optimasi slot telah disimulasikan pada tenant.',
                    });
                    setTimeout(() => setFeedback(null), 3500);
                  }}
                />
              </div>
            </div>

            {/* Bottom Section: Journey conversion funnel (7 cols) + Cohort Retention Heatmap (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <JourneyConversionCard />
              </div>
              <div className="lg:col-span-5">
                <CohortRetentionCard />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.2: MANAJEMEN USER */}
        {/* ========================================================================= */}
        {(activeTab === 'users' || activeTab === 'directory') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  3.2 Manajemen User & Tenant
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Daftar seluruh akun Super Admin dan Pengelola Toko yang terdaftar di platform Klikin
                </p>
              </div>
              <button
                type="button"
                onClick={fetchAdminData}
                className="px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                Segarkan Data
              </button>
            </div>

            <UserDirectoryTable users={users} onRefresh={fetchAdminData} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.3: MANAJEMEN LANGGANAN */}
        {/* ========================================================================= */}
        {(activeTab === 'subscriptions' || activeTab === 'billing') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  3.3 Manajemen Langganan & Dunning
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Monitoring status trial, active, past-due, dunning reminder, dan kupon promo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Total MRR: Rp {(stats?.mrr || 142100).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <AdminMetricCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <RevenueByCategoryCard />
              </div>
              <div className="lg:col-span-5">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Operasi Langganan Manual</h3>
                  <p className="text-xs text-slate-400">
                    Aksi goodwill, perpanjangan trial, dan manajemen kupon diskon platform.
                  </p>
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFeedback({ type: 'success', message: 'Kupon diskon KREATORKLIKIN (20%) aktif.' });
                        setTimeout(() => setFeedback(null), 3000);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">+ Tambah Kupon Promo Baru</span>
                      <span className="font-mono text-indigo-600 font-bold">BUAT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFeedback({ type: 'success', message: 'Dunning reminder dikirimkan ke 3 akun past-due.' });
                        setTimeout(() => setFeedback(null), 3000);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">Kirim Reminder Pembayaran Gagal</span>
                      <span className="font-mono text-amber-600 font-bold">REMIND</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.4: MANAJEMEN DOMAIN KUSTOM */}
        {/* ========================================================================= */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  3.4 Manajemen Domain Kustom
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Daftar domain kustom tenant, status DNS, dan provisioning otomatis SSL Let's Encrypt
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeedback({ type: 'success', message: 'Seluruh DNS domain berhasil di-reverifikasi.' });
                  setTimeout(() => setFeedback(null), 3500);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                Re-Verify Semua DNS
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Domain Aktif & Pending</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  4 Terhubung • 1 Pending
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { domain: 'link.kopiseduh.id', target: 'kopiseduh', status: 'ACTIVE', ssl: 'Auto-Renew' },
                  { domain: 'bio.fashionstyle.com', target: 'fashionstyle', status: 'ACTIVE', ssl: 'Auto-Renew' },
                  { domain: 'order.kulineran.co', target: 'kulineran', status: 'ACTIVE', ssl: 'Auto-Renew' },
                  { domain: 'katalog.techzone.id', target: 'techzone', status: 'ACTIVE', ssl: 'Auto-Renew' },
                  { domain: 'promo.studiodesain.net', target: 'studiodesain', status: 'VERIFYING', ssl: 'Issuing SSL' },
                ].map((d) => (
                  <div key={d.domain} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <GlobeIcon className="w-4 h-4 text-indigo-500" />
                      <div>
                        <span className="font-bold text-slate-900 font-mono">{d.domain}</span>
                        <span className="text-slate-400 text-[11px] ml-2">→ /{d.target}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          d.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        }`}
                      >
                        {d.status} ({d.ssl})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback({ type: 'success', message: `DNS untuk ${d.domain} sedang dicek ulang.` });
                          setTimeout(() => setFeedback(null), 3000);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 cursor-pointer"
                      >
                        Cek DNS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.5: MODERASI KONTEN */}
        {/* ========================================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  3.5 Moderasi Konten & Keamanan Halaman
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Tinjau laporan pengunjung, flag konten phishing, judi, atau spam, dan take-down halaman
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
                2 Laporan Butuh Tindakan
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Antrean Laporan Pengunjung</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  {
                    slug: 'promo-hadiah-cepat',
                    user: 'user_unknown99',
                    reason: 'Diduga tautan phishing / penipuan akun media sosial',
                    date: '2 jam yang lalu',
                    severity: 'HIGH',
                  },
                  {
                    slug: 'slot-gacor-vip',
                    user: 'promo_online',
                    reason: 'Konten terindikasi judi online terlarang',
                    date: '5 jam yang lalu',
                    severity: 'CRITICAL',
                  },
                ].map((item) => (
                  <div key={item.slug} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlertIcon className="w-4 h-4 text-rose-500" />
                        <span className="font-bold text-slate-900 font-mono">/{item.slug}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs">{item.reason}</p>
                      <p className="text-[10px] text-slate-400">Dilaporkan {item.date} • Akun: @{item.user}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                      >
                        Pratinjau <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback({ type: 'success', message: `Halaman /${item.slug} berhasil di-take down.` });
                          setTimeout(() => setFeedback(null), 3500);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Take Down & Suspend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.7: KEUANGAN */}
        {/* ========================================================================= */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  3.7 Keuangan & Proyeksi Profit
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Metrik finansial: MRR, ARR, ARPU, LTV, Churn rate, dan kalkulasi profit margin
                </p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                Unduh Rekap Finansial (PDF/CSV)
              </button>
            </div>

            <AdminMetricCards stats={stats} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400">ARR Projection</span>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">Rp 1,705 Miliar</div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
                  ↑ 24% YoY
                </span>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400">ARPU (Avg Revenue)</span>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">Rp 38.500</div>
                <span className="text-[10px] text-slate-500 font-medium inline-block mt-2">Per subscriber / bulan</span>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400">Customer Churn</span>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">1.8%</div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
                  Sehat (Di bawah target 3%)
                </span>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400">Est. Net Profit Margin</span>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">84.2%</div>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-2">
                  Model Micro-SaaS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <RevenueByCategoryCard />
              </div>
              <div className="lg:col-span-5">
                <CohortRetentionCard />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.8: SUPPORT & KOMUNIKASI */}
        {/* ========================================================================= */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  3.8 Support & Komunikasi Platform
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Pusat tiket bantuan pengguna, broadcast email pengumuman, dan log komunikasi
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeedback({ type: 'success', message: 'Fitur Broadcast Email dibuka.' });
                  setTimeout(() => setFeedback(null), 3000);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                + Broadcast Pengumuman
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Tiket Bantuan Masuk</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  {
                    id: 'TK-108',
                    subject: 'Cara setting CNAME domain kustom di Cloudflare',
                    user: 'budi_santoso',
                    status: 'MENUNGGU BALASAN',
                    time: '15 menit yang lalu',
                  },
                  {
                    id: 'TK-107',
                    subject: 'Pertanyaan invoice langganan Pro untuk laporan pajak',
                    user: 'kedaikopi_solo',
                    status: 'DIPROSES',
                    time: '1 jam yang lalu',
                  },
                ].map((ticket) => (
                  <div key={ticket.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600">{ticket.id}</span>
                        <span className="font-bold text-slate-900">{ticket.subject}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Oleh @{ticket.user} • {ticket.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {ticket.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback({ type: 'success', message: `Membuka detail tiket ${ticket.id}` });
                          setTimeout(() => setFeedback(null), 3000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                      >
                        Balas
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.9: PENGATURAN PLATFORM */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                3.9 Pengaturan Platform
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Konfigurasi umum, durasi trial, harga paket Pro, SMTP email, dan integrasi Midtrans/Stripe
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
              <h3 className="text-base font-bold text-slate-900">Paket Langganan & Pricing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <span className="font-bold text-slate-800">Paket Free (Gratis)</span>
                  <p className="text-slate-500">Maksimal 5 link, badge Klikin wajib aktif, subdomain .klikin.id</p>
                </div>
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2 text-xs">
                  <span className="font-bold text-indigo-900">Paket Klikin Pro (Rp29.000 / Bulan)</span>
                  <p className="text-indigo-800">Unlimited link, domain kustom, analitik lanjutan, tanpa badge</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-500">Mode Pemeliharaan (Maintenance Mode)</span>
                <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  OFF (PLATFORM AKTIF)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3.10: AUDIT & KEAMANAN */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  3.10 Audit & Keamanan Platform
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Log aktivitas audit, riwayat login IP, error stack trace, dan cadangan data manual
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeedback({ type: 'success', message: 'Pencadangan database SQLite berhasil dijalankan.' });
                  setTimeout(() => setFeedback(null), 3500);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                Trigger Backup Manual
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Log Aktivitas Terbaru (Audit Trail)</h3>
              <div className="divide-y divide-slate-100 text-xs font-mono">
                {[
                  { actor: 'admin@klikin.id', action: 'UPDATE_DOMAIN_DNS', target: 'link.kopiseduh.id', ip: '180.252.12.9', time: '12:45' },
                  { actor: 'admin@klikin.id', action: 'LOGIN_SUCCESS', target: 'Super Admin Console', ip: '180.252.12.9', time: '12:30' },
                  { actor: 'system_cron', action: 'RENEW_SSL_CERTS', target: '4 domains verified', ip: '127.0.0.1', time: '06:00' },
                  { actor: 'admin@klikin.id', action: 'APPROVE_PRO_USER', target: 'user_kreator_bali', ip: '180.252.12.9', time: 'Kemarin' },
                ].map((log, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-700">{log.actor}</span>
                      <span className="text-slate-700 mx-2">{log.action}</span>
                      <span className="text-slate-400">({log.target})</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      <span>{log.ip}</span> • <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
