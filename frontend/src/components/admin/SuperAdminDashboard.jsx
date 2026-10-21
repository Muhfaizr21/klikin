import React, { useState, useEffect } from 'react';
import Logo from '../Logo';
import AdminStatCard from './AdminStatCard';
import UserDirectoryTable from './UserDirectoryTable';
import {
  BarChartIcon,
  LayersIcon,
  ExternalLinkIcon,
  GlobeIcon,
  CreditCardIcon,
  AlertCircleIcon,
  CheckIcon,
} from '../Icons';

const API_BASE = 'http://localhost:8080/api';

export default function SuperAdminDashboard({ user, token, onLogout, onBackToHome }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

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
      setFeedback({ type: 'error', message: 'Gagal memuat data Superadmin: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-void)] text-white font-sans selection:bg-[var(--color-acid-lime)] selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-carbon)] border-b border-[var(--color-graphite)] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Logo size={26} />
          <span className="hidden sm:inline-block w-px h-4 bg-[var(--color-graphite)]" />
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded border bg-rose-500/15 text-rose-400 border-rose-500/30">
            SUPER ADMIN PLATFORM
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-white font-medium">{user?.full_name || user?.username}</span>
            <span className="text-[var(--color-fog)] text-[11px]">{user?.email}</span>
          </div>

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="text-[var(--color-mist)] hover:text-white transition-colors"
            >
              Beranda
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-graphite)]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Platform Health & Metrics</h1>
            <p className="text-xs text-[var(--color-fog)] mt-1">
              Pantau seluruh aktivitas kreator, transaksi langganan, dan performa link secara global.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API Operational
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-white hover:text-zinc-300 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard
            label="Total Pengguna"
            value={stats?.total_users ?? (loading ? '...' : 0)}
            subtext="Semua akun terdaftar"
            icon={GlobeIcon}
          />
          <AdminStatCard
            label="Halaman Bio"
            value={stats?.total_pages ?? (loading ? '...' : 0)}
            subtext="Tenant workspace aktif"
            icon={LayersIcon}
          />
          <AdminStatCard
            label="Total Klik Tautan"
            value={stats?.total_clicks ? stats.total_clicks.toLocaleString('id-ID') : (loading ? '...' : 0)}
            subtext="Traffic terdistribusi"
            icon={BarChartIcon}
          />
          <AdminStatCard
            label="Estimasi MRR"
            value={stats?.mrr ? `Rp ${(stats.mrr / 1000).toFixed(0)}k` : 'Rp 0'}
            subtext={`${stats?.pro_users || 0} akun Pro aktif`}
            icon={CreditCardIcon}
          />
        </div>

        {/* User Directory Table */}
        <UserDirectoryTable users={users} />
      </main>
    </div>
  );
}
