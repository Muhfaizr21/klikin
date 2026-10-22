import React, { useState, useEffect, Suspense, lazy } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminMetricCards from './AdminMetricCards';
import RevenueByCategoryCard from './RevenueByCategoryCard';
import TopTenantPerformanceCard from './TopTenantPerformanceCard';
import JourneyConversionCard from './JourneyConversionCard';
import CohortRetentionCard from './CohortRetentionCard';
import PlatformOverviewCharts from './PlatformOverviewCharts';
import { API_BASE } from '../../lib/api';
import { navigateTo } from '../../utils/navigation';

const UserDirectoryTable = lazy(() => import('./UserDirectoryTable'));
const PlatformReportsView = lazy(() => import('./PlatformReportsView'));
const SubscriptionManagementView = lazy(() => import('./SubscriptionManagementView'));
const CustomDomainManagementView = lazy(() => import('./CustomDomainManagementView'));
const ContentModerationView = lazy(() => import('./ContentModerationView'));
const FinanceManagementView = lazy(() => import('./FinanceManagementView'));
const SupportManagementView = lazy(() => import('./SupportManagementView'));
const SecurityAuditView = lazy(() => import('./SecurityAuditView'));
const PlatformSettingsView = lazy(() => import('./PlatformSettingsView'));

function AdminViewLoader() {
  return (
    <div className="py-20 flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
        <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
        <span>Memuat modul...</span>
      </div>
    </div>
  );
}
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
  initialTab = 'overview',
}) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const resolveAdminTab = (tab) => {
    if (!tab || tab === 'dashboard' || tab === 'index') return 'overview';
    return tab;
  };

  const [activeTab, setActiveTab] = useState(() => resolveAdminTab(initialTab));
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Sync activeTab when initialTab prop updates from URL
  useEffect(() => {
    const resolved = resolveAdminTab(initialTab);
    if (resolved && resolved !== activeTab) {
      setActiveTab(resolved);
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
      if (usersData.success) setUsers(usersData.data?.users || (Array.isArray(usersData.data) ? usersData.data : []));
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
        {(activeTab === 'overview' || activeTab === 'dashboard' || !['reports', 'analytics', 'users', 'directory', 'subscriptions', 'billing', 'domains', 'moderation', 'finance', 'support', 'security', 'settings'].includes(activeTab)) && (
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

        <Suspense fallback={<AdminViewLoader />}>
          {/* ========================================================================= */}
          {/* 3.6: ANALITIK PLATFORM / REPORTS */}
          {/* ========================================================================= */}
          {(activeTab === 'reports' || activeTab === 'analytics') && (
            <PlatformReportsView token={token} />
          )}

          {/* ========================================================================= */}
          {/* 3.2: MANAJEMEN USER */}
          {/* ========================================================================= */}
          {(activeTab === 'users' || activeTab === 'directory') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Manajemen Pengguna & Tenant
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Pusat tata kelola akun direktori, kontrol status, verifikasi manual, dan audit log platform
                  </p>
                </div>
              </div>

              <UserDirectoryTable token={token} onRefresh={fetchAdminData} />
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3.3: MANAJEMEN LANGGANAN */}
          {/* ========================================================================= */}
          {(activeTab === 'subscriptions' || activeTab === 'billing') && (
            <SubscriptionManagementView token={token} onRefreshParent={fetchAdminData} />
          )}

          {/* 3.4: MANAJEMEN DOMAIN KUSTOM */}
          {activeTab === 'domains' && (
            <CustomDomainManagementView token={token} onRefreshParent={fetchAdminData} />
          )}

          {/* ========================================================================= */}
          {/* 3.5: MODERASI KONTEN */}
          {/* ========================================================================= */}
          {activeTab === 'moderation' && (
            <ContentModerationView token={token} onRefreshParent={fetchAdminData} />
          )}

          {/* ========================================================================= */}
          {/* 3.7: KEUANGAN */}
          {/* ========================================================================= */}
          {activeTab === 'finance' && (
            <FinanceManagementView token={token} onRefreshParent={fetchAdminData} />
          )}

          {/* ========================================================================= */}
          {/* 3.8: SUPPORT & KOMUNIKASI */}
          {/* ========================================================================= */}
          {activeTab === 'support' && (
            <SupportManagementView user={user} token={token} />
          )}

          {/* ========================================================================= */}
          {/* 3.9: PENGATURAN PLATFORM */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <PlatformSettingsView user={user} token={token} />
          )}

          {/* ========================================================================= */}
          {/* 3.10: AUDIT & KEAMANAN */}
          {/* ========================================================================= */}
          {activeTab === 'security' && (
            <SecurityAuditView user={user} token={token} />
          )}
        </Suspense>
      </main>
    </div>
  );
}
