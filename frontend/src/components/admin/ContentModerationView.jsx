import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../lib/api';
import {
  SearchIcon,
  DownloadIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  CheckIcon,
  GlobeIcon,
  BanIcon,
  LockIcon,
  EyeIcon,
  ExternalLinkIcon,
  PlusIcon,
  TrashIcon,
  VerifiedBadgeIcon,
  ClockIcon,
} from '../Icons';
import ModerationDetailDrawer from './ModerationDetailDrawer';
import {
  FlagPageModal,
  TakeDownPageModal,
  BanViolatorModal,
  ReviewReportModal,
  AddBlacklistModal,
} from './ModerationActionModals';

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1971) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1971) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getModStatusBadge = (status) => {
  switch (status) {
    case 'flagged':
      return {
        label: 'Flagged',
        className: 'bg-amber-50 text-amber-800 border-amber-200/90',
        dot: 'bg-amber-500',
      };
    case 'taken_down':
      return {
        label: 'Taken Down',
        className: 'bg-rose-50 text-rose-700 border-rose-200/90',
        dot: 'bg-rose-600',
      };
    default:
      return {
        label: 'Aman (Clean)',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
        dot: 'bg-emerald-500',
      };
  }
};

const getCategoryBadge = (category) => {
  switch ((category || '').toLowerCase()) {
    case 'phishing':
      return 'bg-rose-50 text-rose-700 border-rose-200/90';
    case 'gambling':
      return 'bg-violet-50 text-violet-700 border-violet-200/90';
    case 'adult':
      return 'bg-pink-50 text-pink-700 border-pink-200/90';
    case 'spam':
      return 'bg-amber-50 text-amber-800 border-amber-200/90';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200/90';
  }
};

export default function ContentModerationView({ token, onRefreshParent }) {
  // Navigation tabs inside /admin/moderation
  // 'pages' | 'reports' | 'blacklist' | 'logs'
  const [subTab, setSubTab] = useState('pages');

  // Toast feedback
  const [feedback, setFeedback] = useState(null);
  const showToast = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  // 1. Public Pages Directory State
  const [pages, setPages] = useState([]);
  const [stats, setStats] = useState(null);
  const [pageMeta, setPageMeta] = useState({
    total_items: 0,
    current_page: 1,
    limit: 15,
    total_pages: 1,
  });
  const [loadingPages, setLoadingPages] = useState(true);
  const [pageSearch, setPageSearch] = useState('');
  const [modStatusFilter, setModStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('risk_desc');
  const [pageNum, setPageNum] = useState(1);
  const [scanningAll, setScanningAll] = useState(false);

  // 2. Visitor Reports Queue State
  const [reports, setReports] = useState([]);
  const [_reportMeta, setReportMeta] = useState({
    total_items: 0,
    current_page: 1,
    limit: 15,
    total_pages: 1,
  });
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatus, setReportStatus] = useState('all');
  const [reportCategory, setReportCategory] = useState('all');
  const [reportPage, setReportPage] = useState(1);

  // 3. Blacklisted Domains State
  const [blacklist, setBlacklist] = useState([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [blacklistCategory, setBlacklistCategory] = useState('all');

  // 4. Moderation Logs State
  const [logs, setLogs] = useState([]);
  const [logMeta, setLogMeta] = useState({
    total_items: 0,
    current_page: 1,
    limit: 20,
    total_pages: 1,
  });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logAction, setLogAction] = useState('all');
  const [logPage, setLogPage] = useState(1);

  // Drawer & Modals State
  const [drawerPageId, setDrawerPageId] = useState(null);
  const [activeModal, setActiveModal] = useState({ type: null, payload: null });
  // type: 'flag' | 'takedown' | 'ban_user' | 'review_report' | 'add_blacklist'

  // =========================================================================
  // FETCHERS
  // =========================================================================
  const fetchPages = useCallback(async () => {
    if (!token) return;
    setLoadingPages(true);
    try {
      const params = new URLSearchParams({
        search: pageSearch,
        status: modStatusFilter,
        category: categoryFilter,
        published: publishedFilter,
        sort: sortBy,
        page: String(pageNum),
        limit: '15',
      });
      const res = await fetch(`${API_BASE}/admin/moderation/pages?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setPages(json.data.pages || []);
        setStats(json.data.stats || null);
        setPageMeta(
          json.data.pagination || {
            total_items: 0,
            current_page: 1,
            limit: 15,
            total_pages: 1,
          }
        );
      }
    } catch (err) {
      showToast('error', err.message || 'Gagal memuat direktori halaman publik');
    } finally {
      setLoadingPages(false);
    }
  }, [
    token,
    pageSearch,
    modStatusFilter,
    categoryFilter,
    publishedFilter,
    sortBy,
    pageNum,
    showToast,
  ]);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const params = new URLSearchParams({
        search: reportSearch,
        status: reportStatus,
        category: reportCategory,
        page: String(reportPage),
        limit: '15',
      });
      const res = await fetch(`${API_BASE}/admin/moderation/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setReports(json.data.reports || []);
        setReportMeta(
          json.data.pagination || {
            total_items: 0,
            current_page: 1,
            limit: 15,
            total_pages: 1,
          }
        );
      }
    } catch (err) {
      showToast('error', err.message || 'Gagal memuat laporan pengunjung');
    } finally {
      setLoadingReports(false);
    }
  }, [token, reportSearch, reportStatus, reportCategory, reportPage, showToast]);

  const fetchBlacklist = useCallback(async () => {
    if (!token) return;
    setLoadingBlacklist(true);
    try {
      const params = new URLSearchParams({
        search: blacklistSearch,
        category: blacklistCategory,
      });
      const res = await fetch(`${API_BASE}/admin/moderation/blacklist?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBlacklist(json.data || []);
      }
    } catch (err) {
      showToast('error', err.message || 'Gagal memuat daftar hitam domain');
    } finally {
      setLoadingBlacklist(false);
    }
  }, [token, blacklistSearch, blacklistCategory, showToast]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        search: logSearch,
        action: logAction,
        page: String(logPage),
        limit: '20',
      });
      const res = await fetch(`${API_BASE}/admin/moderation/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setLogs(json.data.logs || []);
        setLogMeta(
          json.data.pagination || {
            total_items: 0,
            current_page: 1,
            limit: 20,
            total_pages: 1,
          }
        );
      }
    } catch (err) {
      showToast('error', err.message || 'Gagal memuat riwayat moderasi');
    } finally {
      setLoadingLogs(false);
    }
  }, [token, logSearch, logAction, logPage, showToast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    if (subTab === 'reports') fetchReports();
    if (subTab === 'blacklist') fetchBlacklist();
    if (subTab === 'logs') fetchLogs();
  }, [subTab, fetchReports, fetchBlacklist, fetchLogs]);

  const refreshAll = (customMsg) => {
    if (customMsg) showToast('success', customMsg);
    fetchPages();
    if (subTab === 'reports') fetchReports();
    if (subTab === 'blacklist') fetchBlacklist();
    if (subTab === 'logs') fetchLogs();
    onRefreshParent?.();
  };

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleRunAutoScan = async () => {
    setScanningAll(true);
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menjalankan pemindaian keamanan');
      }
      showToast('success', json.message);
      refreshAll();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setScanningAll(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal mengunduh CSV moderasi');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klikin-moderation-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Laporan CSV moderasi konten berhasil diunduh.');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const handleRestorePage = async (page) => {
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/pages/${page.page_id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note: 'Dipulihkan kembali ke publik oleh Super Admin',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memulihkan halaman');
      }
      refreshAll(json.message);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const handleToggleBlacklist = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/blacklist/${item.id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengubah status blacklist');
      }
      showToast('success', json.message);
      fetchBlacklist();
      fetchPages();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const handleDeleteBlacklist = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/blacklist/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus blacklist');
      }
      showToast('success', `Domain ${item.pattern} dihapus dari daftar hitam.`);
      fetchBlacklist();
      fetchPages();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const handleQuickBlacklistUrl = async (domainHost) => {
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/blacklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pattern: domainHost,
          match_type: 'domain',
          category: 'phishing',
          severity: 'critical',
          reason: 'Diblokir langsung dari inspeksi tautan halaman publik',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mem-blacklist domain');
      }
      refreshAll(json.message);
    } catch (err) {
      showToast('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* HEADER BAR */}
      {/* =================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Moderasi Konten & Kepatuhan
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pengawasan halaman publik live, penanganan laporan pengunjung, pemblokiran domain berbahaya, dan riwayat audit tindakan platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={scanningAll}
            onClick={handleRunAutoScan}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${scanningAll ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{scanningAll ? 'Memindai Tautan...' : 'Pindai URL & Domain'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <DownloadIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal({ type: 'add_blacklist', payload: null })}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Tambah Blacklist Domain</span>
          </button>
        </div>
      </div>

      {/* TOAST FEEDBACK */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-2xs transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-bold underline ml-4 cursor-pointer hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5 KPI SUMMARY CARDS */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Halaman Publik Live */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Halaman Publik Live</span>
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {stats?.live_published_pages ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                Live Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Dari {stats?.total_public_pages ?? 0} halaman bio
            </p>
          </div>
        </div>

        {/* 2. Halaman Di-Flag */}
        <div
          onClick={() => {
            setSubTab('pages');
            setModStatusFilter('flagged');
          }}
          className="bg-white border border-slate-200/90 hover:border-amber-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Perlu Tinjauan (Flagged)</span>
            <ShieldAlertIcon className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {stats?.flagged_pages_count ?? 0}
              </span>
              {(stats?.flagged_pages_count ?? 0) > 0 ? (
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  Butuh Tindakan
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                  Aman
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Terindikasi pelanggaran konten
            </p>
          </div>
        </div>

        {/* 3. Laporan Pengunjung (Clean white card, no pastel purple!) */}
        <div
          onClick={() => setSubTab('reports')}
          className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Laporan Pengunjung</span>
            <AlertCircleIcon className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {stats?.pending_reports_count ?? 0}
              </span>
              {(stats?.pending_reports_count ?? 0) > 0 ? (
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
                  Pending Review
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  Semua Selesai
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {stats?.actioned_reports_count ?? 0} laporan telah diproses
            </p>
          </div>
        </div>

        {/* 4. Take-Down & Banned */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Take-Down & Banned</span>
            <BanIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {stats?.taken_down_pages_count ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
                {stats?.banned_violators_count ?? 0} User Banned
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Akses publik telah ditutup
            </p>
          </div>
        </div>

        {/* 5. Domain Blacklist */}
        <div
          onClick={() => setSubTab('blacklist')}
          className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Domain Blacklist</span>
            <GlobeIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {stats?.active_blacklist_count ?? 0}
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                {stats?.total_blocked_hits ?? 0}x Dicegah
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Proteksi URL berbahaya aktif
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUB-NAVIGATION TABS (Modern Clean Underline Tabs) */}
      {/* =================================================================== */}
      <div className="border-b border-slate-200/80 flex items-center gap-6 overflow-x-auto scrollbar-none">
        {[
          {
            id: 'pages',
            label: 'Daftar Halaman Publik Live',
            icon: GlobeIcon,
            count: stats?.total_public_pages ?? pageMeta.total_items,
          },
          {
            id: 'reports',
            label: 'Review Laporan Pengunjung',
            icon: ShieldAlertIcon,
            count: stats?.pending_reports_count ?? 0,
            hasPending: (stats?.pending_reports_count ?? 0) > 0,
          },
          {
            id: 'blacklist',
            label: 'Blacklist Domain & URL',
            icon: BanIcon,
            count: stats?.active_blacklist_count ?? blacklist.length,
          },
          {
            id: 'logs',
            label: 'Log Riwayat Moderasi',
            icon: ClockIcon,
            count: logMeta.total_items || null,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-2 pb-3.5 pt-1 text-xs font-semibold transition-all relative cursor-pointer shrink-0 ${
                active
                  ? 'text-slate-900 font-bold border-b-2 border-slate-900 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {t.count !== null && t.count !== undefined && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                    t.hasPending
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : active
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: DAFTAR HALAMAN PUBLIK LIVE & KONTROL MODERASI */}
      {/* =================================================================== */}
      {subTab === 'pages' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pageSearch}
                  onChange={(e) => {
                    setPageSearch(e.target.value);
                    setPageNum(1);
                  }}
                  placeholder="Cari slug (/kopiseduh), judul, pemilik, atau alasan..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
                />
                {pageSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setPageSearch('');
                      setPageNum(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPageNum(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Kategori Flag</option>
                  <option value="phishing">Phishing / Scam</option>
                  <option value="gambling">Judi Online (Slot)</option>
                  <option value="adult">Konten Dewasa (18+)</option>
                  <option value="spam">Spam / Malware</option>
                </select>

                <select
                  value={publishedFilter}
                  onChange={(e) => {
                    setPublishedFilter(e.target.value);
                    setPageNum(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Visibilitas</option>
                  <option value="live">Hanya Live (Published)</option>
                  <option value="offline">Offline / Taken Down</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPageNum(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
                >
                  <option value="risk_desc">Skor Risiko Tertinggi</option>
                  <option value="reports_desc">Laporan Pengunjung Terbanyak</option>
                  <option value="updated_desc">Paling Baru Diperbarui</option>
                </select>
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Semua Halaman' },
                  { id: 'flagged', label: 'Perlu Tinjauan (Flagged)' },
                  { id: 'clean', label: 'Aman (Clean)' },
                  { id: 'taken_down', label: 'Diblokir (Taken Down)' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setModStatusFilter(st.id);
                      setPageNum(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      modStatusFilter === st.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {(pageSearch || modStatusFilter !== 'all' || categoryFilter !== 'all' || publishedFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setPageSearch('');
                    setModStatusFilter('all');
                    setCategoryFilter('all');
                    setPublishedFilter('all');
                    setPageNum(1);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer underline"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/60 text-xs font-semibold text-slate-500 tracking-tight">
                  <th className="py-3 px-4">Halaman Publik</th>
                  <th className="py-3 px-4">Pemilik (Tenant)</th>
                  <th className="py-3 px-4">Status & Kategori Flag</th>
                  <th className="py-3 px-4">Skor Risiko & Tautan</th>
                  <th className="py-3 px-4">Laporan Pengunjung</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingPages ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCwIcon className="w-5 h-5 text-slate-300 animate-spin" />
                        <span className="text-xs font-medium">Memuat data halaman publik...</span>
                      </div>
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                        <ShieldCheckIcon className="w-8 h-8 text-slate-300 stroke-1" />
                        <p className="text-xs font-semibold text-slate-700">Tidak ada halaman yang cocok</p>
                        <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau reset filter di bagian atas.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pages.map((p) => {
                    const badge = getModStatusBadge(p.moderation_status);
                    return (
                      <tr key={p.page_id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Slug & Title */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDrawerPageId(p.page_id)}
                              className="font-mono font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                            >
                              /{p.slug}
                            </button>
                            <a
                              href={`/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Buka Halaman Live"
                              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                            >
                              <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                p.is_published
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {p.is_published ? 'Live' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate max-w-[220px] mt-0.5 font-normal">
                            {p.title || 'Tanpa Judul'}
                          </p>
                        </td>

                        {/* Owner */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">
                              {p.user_full_name || `@${p.username}`}
                            </span>
                            {p.is_verified && (
                              <VerifiedBadgeIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            )}
                            {p.user_status && p.user_status !== 'active' && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                {p.user_status}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            @{p.username} • {p.user_email}
                          </p>
                        </td>

                        {/* Moderation Status & Flag Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.className}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                            {p.flag_category && (
                              <span
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${getCategoryBadge(
                                  p.flag_category
                                )}`}
                              >
                                {p.flag_category}
                              </span>
                            )}
                          </div>
                          {(p.flag_reason || p.takedown_reason) && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 max-w-[260px] font-normal">
                              {p.takedown_reason || p.flag_reason}
                            </p>
                          )}
                        </td>

                        {/* Risk Score & Links */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${
                                p.risk_score >= 60
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/90'
                                  : p.risk_score >= 30
                                  ? 'bg-amber-50 text-amber-800 border-amber-200/90'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/90'
                              }`}
                            >
                              {p.risk_score}%
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {p.active_links_count + p.active_blocks_count} tautan/blok
                            </span>
                          </div>
                          {p.matched_blacklist?.length > 0 && (
                            <p className="text-[10px] font-mono text-rose-600 font-semibold mt-0.5">
                              ⚠ Blacklist: {p.matched_blacklist.join(', ')}
                            </p>
                          )}
                        </td>

                        {/* Visitor Reports */}
                        <td className="py-3.5 px-4">
                          {p.pending_reports_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              {p.pending_reports_count} Pending
                            </span>
                          ) : p.total_reports_count > 0 ? (
                            <span className="text-[11px] text-slate-500">
                              {p.total_reports_count} telah diproses
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">0 laporan</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDrawerPageId(p.page_id)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <EyeIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>Tinjau</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'flag', payload: p })}
                              className="px-2 py-1.5 rounded-lg border border-amber-200/80 bg-amber-50/70 hover:bg-amber-100 text-xs font-semibold text-amber-800 transition-colors cursor-pointer"
                              title="Tandai Halaman (Flag)"
                            >
                              Flag
                            </button>

                            {p.moderation_status !== 'taken_down' ? (
                              <button
                                type="button"
                                onClick={() => setActiveModal({ type: 'takedown', payload: p })}
                                className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors cursor-pointer"
                              >
                                Take Down
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRestorePage(p)}
                                className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 transition-colors cursor-pointer"
                              >
                                Pulihkan
                              </button>
                            )}

                            {p.user_status !== 'banned' && (
                              <button
                                type="button"
                                onClick={() => setActiveModal({ type: 'ban_user', payload: p })}
                                title="Ban Permanen Akun Pelanggar"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <LockIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-800">{pages.length}</strong> dari{' '}
              <strong className="text-slate-800">{pageMeta.total_items}</strong> halaman (Halaman{' '}
              {pageMeta.current_page} / {pageMeta.total_pages || 1})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageNum <= 1}
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer shadow-2xs"
              >
                ← Sebelumnya
              </button>
              <button
                type="button"
                disabled={pageNum >= (pageMeta.total_pages || 1)}
                onClick={() => setPageNum((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer shadow-2xs"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: REVIEW LAPORAN PENGUNJUNG */}
      {/* =================================================================== */}
      {subTab === 'reports' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => {
                  setReportSearch(e.target.value);
                  setReportPage(1);
                }}
                placeholder="Cari slug, URL, nama pelapor, atau isi laporan..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
              {reportSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setReportSearch('');
                    setReportPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={reportCategory}
                onChange={(e) => {
                  setReportCategory(e.target.value);
                  setReportPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 cursor-pointer shadow-2xs"
              >
                <option value="all">Semua Kategori</option>
                <option value="phishing">Phishing / Scam</option>
                <option value="gambling">Judi Online</option>
                <option value="adult">Dewasa (18+)</option>
                <option value="spam">Spam</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Menunggu' },
                  { id: 'actioned', label: 'Ditindak' },
                  { id: 'dismissed', label: 'Diabaikan' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setReportStatus(st.id);
                      setReportPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      reportStatus === st.id
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/60 text-xs font-semibold text-slate-500 tracking-tight">
                  <th className="py-3 px-4">Halaman Terlapor</th>
                  <th className="py-3 px-4">Kategori & Severity</th>
                  <th className="py-3 px-4">Isi Laporan & Bukti URL</th>
                  <th className="py-3 px-4">Pelapor</th>
                  <th className="py-3 px-4">Status Review</th>
                  <th className="py-3 px-4 text-right">Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingReports ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCwIcon className="w-5 h-5 text-slate-300 animate-spin" />
                        <span className="text-xs font-medium">Memuat antrean laporan...</span>
                      </div>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                        <ShieldCheckIcon className="w-8 h-8 text-slate-300 stroke-1" />
                        <p className="text-xs font-semibold text-slate-700">Tidak ada laporan yang cocok</p>
                        <p className="text-[11px] text-slate-400">Semua laporan pengunjung telah ditindaklanjuti dengan baik.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setDrawerPageId(rep.page_id)}
                          className="font-mono font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                        >
                          /{rep.slug}
                        </button>
                        <p className="text-[11px] text-slate-400 font-mono">
                          @{rep.owner_username} ({rep.owner_status || 'active'})
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${getCategoryBadge(
                            rep.category
                          )}`}
                        >
                          {rep.category}
                        </span>
                        <p className="text-[10px] font-mono font-semibold uppercase text-slate-500 mt-1">
                          Severity: {rep.severity}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {rep.description}
                        </p>
                        {rep.target_url && (
                          <p className="font-mono text-[11px] text-rose-600 truncate mt-0.5">
                            URL: {rep.target_url}
                          </p>
                        )}
                        {rep.resolution_note && (
                          <p className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md mt-1">
                            Resolusi: {rep.resolution_note}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{rep.reporter_name}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          IP: {rep.reporter_ip} • {formatDateShort(rep.created_at)}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            rep.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/90'
                              : rep.status === 'actioned'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {rep.status === 'pending'
                            ? 'Menunggu Review'
                            : rep.status === 'actioned'
                            ? 'Telah Ditindak'
                            : 'Diabaikan'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDrawerPageId(rep.page_id)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                          >
                            Inspeksi
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveModal({ type: 'review_report', payload: rep })
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                          >
                            {rep.status === 'pending' ? 'Proses Laporan' : 'Ubah Keputusan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: BLACKLIST URL / DOMAIN BERBAHAYA */}
      {/* =================================================================== */}
      {subTab === 'blacklist' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex-1 max-w-md relative">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={blacklistSearch}
                onChange={(e) => setBlacklistSearch(e.target.value)}
                placeholder="Cari domain blacklist (misal: slot-gacor, login-bca)..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
              {blacklistSearch && (
                <button
                  type="button"
                  onClick={() => setBlacklistSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
                {['all', 'phishing', 'gambling', 'adult', 'spam'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setBlacklistCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      blacklistCategory === cat
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'all' ? 'Semua' : cat.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveModal({ type: 'add_blacklist', payload: null })}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs ml-1"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Tambah Blacklist</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 bg-slate-50/60 text-xs font-semibold text-slate-500 tracking-tight">
                    <th className="py-3 px-4">Domain / Pola URL</th>
                    <th className="py-3 px-4">Kategori & Severity</th>
                    <th className="py-3 px-4">Keterangan Ancaman</th>
                    <th className="py-3 px-4">Percobaan Diblokir</th>
                    <th className="py-3 px-4">Status Proteksi</th>
                    <th className="py-3 px-4 text-right">Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingBlacklist ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCwIcon className="w-5 h-5 text-slate-300 animate-spin" />
                          <span className="text-xs font-medium">Memuat database domain blacklist...</span>
                        </div>
                      </td>
                    </tr>
                  ) : blacklist.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                          <ShieldCheckIcon className="w-8 h-8 text-slate-300 stroke-1" />
                          <p className="text-xs font-semibold text-slate-700">Tidak ada domain dalam blacklist</p>
                          <p className="text-[11px] text-slate-400">Gunakan tombol "Tambah Blacklist" untuk mendaftarkan URL jahat.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    blacklist.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900">
                            {item.pattern}
                          </span>
                          <p className="text-[10px] font-mono text-slate-400 uppercase">
                            Tipe: {item.match_type}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${getCategoryBadge(
                              item.category
                            )}`}
                          >
                            {item.category}
                          </span>
                          <span className="ml-1.5 text-[10px] font-mono font-bold uppercase text-rose-600">
                            ({item.severity})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-sm text-slate-600">
                          {item.reason}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {item.hit_count}x dicegah
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              item.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {item.is_active ? 'Proteksi Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleBlacklist(item)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                            >
                              {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlacklist(item)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Hapus dari Blacklist"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: LOG RIWAYAT MODERASI */}
      {/* =================================================================== */}
      {subTab === 'logs' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => {
                  setLogSearch(e.target.value);
                  setLogPage(1);
                }}
                placeholder="Cari log moderasi berdasarkan slug, username, atau rincian..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
              {logSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLogSearch('');
                    setLogPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={logAction}
              onChange={(e) => {
                setLogAction(e.target.value);
                setLogPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 cursor-pointer shadow-2xs"
            >
              <option value="all">Semua Aksi Moderasi</option>
              <option value="FLAG_PAGE">FLAG_PAGE</option>
              <option value="TAKEDOWN_PAGE">TAKEDOWN_PAGE</option>
              <option value="RESTORE_PAGE">RESTORE_PAGE</option>
              <option value="BAN_VIOLATOR">BAN_VIOLATOR</option>
              <option value="DISMISS_REPORT">DISMISS_REPORT</option>
              <option value="ADD_BLACKLIST">ADD_BLACKLIST</option>
              <option value="AUTO_SECURITY_SCAN">AUTO_SECURITY_SCAN</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/60 text-xs font-semibold text-slate-500 tracking-tight">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Target / Slug</th>
                  <th className="py-3 px-4">Rincian Tindakan</th>
                  <th className="py-3 px-4">Moderator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCwIcon className="w-5 h-5 text-slate-300 animate-spin" />
                        <span className="text-xs font-medium">Memuat log riwayat moderasi...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                        <ClockIcon className="w-8 h-8 text-slate-300 stroke-1" />
                        <p className="text-xs font-semibold text-slate-700">Belum ada aktivitas moderasi</p>
                        <p className="text-[11px] text-slate-400">Semua tindakan moderasi dan audit penegakan akan tercatat di sini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border ${
                            log.action.includes('TAKEDOWN') || log.action.includes('BAN')
                              ? 'bg-rose-50 text-rose-700 border-rose-200/90'
                              : log.action.includes('FLAG') || log.action.includes('BLACKLIST')
                              ? 'bg-amber-50 text-amber-800 border-amber-200/90'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200/90'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {log.target_slug ? `/${log.target_slug}` : log.target_id}
                        {log.owner_username && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            @{log.owner_username}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {log.admin_name || 'Super Admin'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DRAWER & MODALS */}
      {/* =================================================================== */}
      <ModerationDetailDrawer
        pageId={drawerPageId}
        token={token}
        isOpen={Boolean(drawerPageId)}
        onClose={() => setDrawerPageId(null)}
        onOpenFlag={(p) => setActiveModal({ type: 'flag', payload: p })}
        onOpenTakeDown={(p) => setActiveModal({ type: 'takedown', payload: p })}
        onOpenBanUser={(u) => setActiveModal({ type: 'ban_user', payload: u })}
        onOpenReviewReport={(r) => setActiveModal({ type: 'review_report', payload: r })}
        onQuickBlacklistUrl={handleQuickBlacklistUrl}
        onRefreshParent={refreshAll}
      />

      <FlagPageModal
        page={activeModal.type === 'flag' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'flag'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={refreshAll}
      />

      <TakeDownPageModal
        page={activeModal.type === 'takedown' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'takedown'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={refreshAll}
      />

      <BanViolatorModal
        target={activeModal.type === 'ban_user' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'ban_user'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={refreshAll}
      />

      <ReviewReportModal
        report={activeModal.type === 'review_report' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'review_report'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={refreshAll}
      />

      <AddBlacklistModal
        token={token}
        isOpen={activeModal.type === 'add_blacklist'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={refreshAll}
      />
    </div>
  );
}
