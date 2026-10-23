import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../lib/api';
import {
  SearchIcon,
  DownloadIcon,
  RefreshCwIcon,
  CreditCardIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckIcon,
  TagIcon,
  ReceiptIcon,
  MailIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  BanIcon,
  VerifiedBadgeIcon,
  TrendingUpIcon,
  UsersIcon,
  XIcon,
} from '../Icons';
import SubscriptionDetailDrawer from './SubscriptionDetailDrawer';
import {
  ChangePlanModal,
  ExtendGoodwillModal,
  ManageTrialModal,
  CancelSubscriptionModal,
  RefundInvoiceModal,
  PromoCodeModal,
  DunningReminderModal,
} from './SubscriptionActionModals';

const formatIDR = (val) => `Rp ${(Number(val) || 0).toLocaleString('id-ID')}`;

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

const getStatusBadge = (status) => {
  switch (status) {
    case 'active':
      return {
        label: 'Aktif',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
        dot: 'bg-emerald-500',
      };
    case 'trial':
      return {
        label: 'Trial',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
        dot: 'bg-indigo-500',
      };
    case 'past_due':
      return {
        label: 'Past Due',
        className: 'bg-amber-50 text-amber-800 border-amber-200/90',
        dot: 'bg-amber-500',
      };
    case 'canceled':
      return {
        label: 'Dibatalkan',
        className: 'bg-rose-50 text-rose-700 border-rose-200/90',
        dot: 'bg-rose-500',
      };
    case 'expired':
      return {
        label: 'Kedaluwarsa',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: status || 'Nonaktif',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};

export default function SubscriptionManagementView({ token, onRefreshParent }) {
  // Navigation tabs inside /admin/subscriptions
  // 'directory' | 'dunning' | 'invoices' | 'promos'
  const [subTab, setSubTab] = useState('directory');

  // Toast feedback
  const [feedback, setFeedback] = useState(null);
  const showToast = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  // 1. Directory State
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [subMeta, setSubMeta] = useState({ total: 0, page: 1, limit: 15, total_pages: 1 });
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [page, setPage] = useState(1);

  // 2. Dunning Queue State
  const [dunningItems, setDunningItems] = useState([]);
  const [dunningSummary, setDunningSummary] = useState({
    total_overdue_count: 0,
    total_at_risk_revenue: 0,
    total_reminders_sent: 0,
  });
  const [loadingDunning, setLoadingDunning] = useState(false);
  const [bulkReminding, setBulkReminding] = useState(false);
  const [resolvingUserId, setResolvingUserId] = useState(null);

  // 3. Invoices State
  const [invoices, setInvoices] = useState([]);
  const [invoiceMeta, setInvoiceMeta] = useState({ total: 0, page: 1, limit: 15, total_pages: 1 });
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('all');
  const [invoicePage, setInvoicePage] = useState(1);

  // 4. Promo Codes State
  const [promos, setPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [deletingPromoId, setDeletingPromoId] = useState(null);

  // Drawer & Modals State
  const [drawerUserId, setDrawerUserId] = useState(null);
  const [activeModal, setActiveModal] = useState({ type: null, payload: null });
  // type: 'plan' | 'extend' | 'trial' | 'cancel' | 'refund' | 'promo' | 'dunning_remind'

  // =========================================================================
  // FETCHERS
  // =========================================================================
  const fetchSubscriptions = useCallback(async () => {
    if (!token) return;
    setLoadingSubs(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        plan: planFilter,
        cycle: cycleFilter,
        sort: sortBy,
        page: String(page),
        limit: '15',
      });
      const res = await fetch(`${API_BASE}/admin/subscriptions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setSubscriptions(json.data.subscriptions || []);
        setStats(json.data.stats || null);
        setSubMeta(
          json.data.pagination || { total: 0, page: 1, limit: 15, total_pages: 1 }
        );
      }
    } catch (err) {
      showToast('error', err.message || 'Gagal memuat direktori langganan');
    } finally {
      setLoadingSubs(false);
    }
  }, [token, searchQuery, statusFilter, planFilter, cycleFilter, sortBy, page, showToast]);

  const fetchDunningQueue = useCallback(async () => {
    if (!token) return;
    setLoadingDunning(true);
    try {
      const res = await fetch(`${API_BASE}/admin/dunning`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setDunningItems(json.data.items || []);
        setDunningSummary({
          total_overdue_count: json.data.total_overdue_count || 0,
          total_at_risk_revenue: json.data.total_at_risk_revenue || 0,
          total_reminders_sent: json.data.total_reminders_sent || 0,
        });
      }
    } catch (err) {
      showToast('error', err.message || 'Gagal memuat antrean dunning');
    } finally {
      setLoadingDunning(false);
    }
  }, [token, showToast]);

  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    setLoadingInvoices(true);
    try {
      const params = new URLSearchParams({
        search: invoiceSearch,
        status: invoiceStatus,
        page: String(invoicePage),
        limit: '15',
      });
      const res = await fetch(`${API_BASE}/admin/invoices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setInvoices(json.data.invoices || []);
        setInvoiceMeta(
          json.data.pagination || { total: 0, page: 1, limit: 15, total_pages: 1 }
        );
      }
    } catch (err) {
      showToast('error', err.message || 'Gagal memuat riwayat invoice');
    } finally {
      setLoadingInvoices(false);
    }
  }, [token, invoiceSearch, invoiceStatus, invoicePage, showToast]);

  const fetchPromos = useCallback(async () => {
    if (!token) return;
    setLoadingPromos(true);
    try {
      const res = await fetch(`${API_BASE}/admin/promos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPromos(json.data || []);
      }
    } catch (err) {
      showToast('error', err.message || 'Gagal memuat daftar kupon promo');
    } finally {
      setLoadingPromos(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    if (subTab === 'dunning') fetchDunningQueue();
    if (subTab === 'invoices') fetchInvoices();
    if (subTab === 'promos') fetchPromos();
  }, [subTab, fetchDunningQueue, fetchInvoices, fetchPromos]);

  const refreshAll = () => {
    fetchSubscriptions();
    if (subTab === 'dunning') fetchDunningQueue();
    if (subTab === 'invoices') fetchInvoices();
    if (subTab === 'promos') fetchPromos();
    onRefreshParent?.();
  };

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal mengunduh CSV langganan');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klikin-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Laporan CSV langganan berhasil diunduh.');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const handleBulkDunningRemind = async () => {
    setBulkReminding(true);
    try {
      const res = await fetch(`${API_BASE}/admin/dunning/remind-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengirim reminder massal');
      }
      showToast('success', json.message || 'Dunning reminder massal berhasil dikirim');
      refreshAll();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setBulkReminding(false);
    }
  };

  const handleResolveDunningManual = async (item) => {
    setResolvingUserId(item.user_id);
    try {
      const res = await fetch(`${API_BASE}/admin/dunning/${item.user_id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyelesaikan status gagal bayar');
      }
      showToast('success', json.message || 'Langganan berhasil dipulihkan ke ACTIVE');
      refreshAll();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setResolvingUserId(null);
    }
  };

  const handleDeletePromo = async (promo) => {
    setDeletingPromoId(promo.id);
    try {
      const res = await fetch(`${API_BASE}/admin/promos/${promo.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus kode promo');
      }
      showToast('success', `Kupon promo ${promo.code} berhasil dihapus.`);
      fetchPromos();
      fetchSubscriptions();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setDeletingPromoId(null);
    }
  };

  const handleTogglePromoActive = async (promo) => {
    try {
      const res = await fetch(`${API_BASE}/admin/promos/${promo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: promo.code,
          description: promo.description,
          discount_percent: promo.discount_percent,
          max_uses: promo.max_uses,
          expires_at: promo.expires_at ? new Date(promo.expires_at).toISOString().slice(0, 10) : '',
          is_active: !promo.is_active,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memperbarui status kupon');
      }
      showToast(
        'success',
        `Kupon ${promo.code} berhasil ${!promo.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      fetchPromos();
      fetchSubscriptions();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const handleModalSuccess = (msg) => {
    showToast('success', msg);
    refreshAll();
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* HEADER BAR & QUICK ACTIONS */}
      {/* =================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Langganan & Penagihan
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pengawasan status paket Pro & Free, perpanjangan goodwill, manajemen masa trial, dunning pembayaran gagal, dan kupon promo platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${loadingSubs ? 'animate-spin' : ''}`} />
            <span>Sinkronkan</span>
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
            onClick={() => setActiveModal({ type: 'promo', payload: null })}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Buat Kupon Diskon</span>
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
        {/* 1. MRR & ARR */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Pendapatan Berulang (MRR)</span>
            <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {formatIDR(stats?.mrr || 0)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Estimasi ARR: <span className="font-semibold text-slate-700">{formatIDR(stats?.arr || 0)}</span>
            </p>
          </div>
        </div>

        {/* 2. Pelanggan Pro Aktif (Clean white surface, no pastel purple!) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Pelanggan Pro Aktif</span>
            <CreditCardIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {stats?.active_pro_count ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                {stats?.free_count ?? 0} Free
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Dari {stats?.total_subscriptions ?? 0} tenant terdaftar
            </p>
          </div>
        </div>

        {/* 3. Masa Percobaan (Trial) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Masa Percobaan (Trial)</span>
            <ClockIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {stats?.trial_count ?? 0}
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                Pro Trial
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Potensi konversi langganan
            </p>
          </div>
        </div>

        {/* 4. Antrean Dunning / Past Due */}
        <div
          onClick={() => setSubTab('dunning')}
          className="bg-white border border-slate-200/90 hover:border-amber-300 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Gagal Bayar (Past-Due)</span>
            <AlertCircleIcon className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {stats?.past_due_count ?? 0}
              </span>
              {(stats?.past_due_count ?? 0) > 0 ? (
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  Butuh Tindakan
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  Lancar
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {stats?.canceled_count ?? 0} dibatalkan • {stats?.expired_count ?? 0} berakhir
            </p>
          </div>
        </div>

        {/* 5. Total Kas Masuk & Refund */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Total Tagihan Terbayar</span>
            <ReceiptIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {formatIDR(stats?.total_collected || 0)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Refund: <span className="font-semibold text-rose-600">{formatIDR(stats?.total_refunded || 0)}</span> •{' '}
              <span className="font-semibold text-slate-700">{stats?.active_promos_count ?? 0} Kupon</span>
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
            id: 'directory',
            label: 'Direktori Langganan',
            icon: UsersIcon,
            count: stats?.total_subscriptions ?? subMeta.total,
          },
          {
            id: 'dunning',
            label: 'Dunning & Gagal Bayar',
            icon: AlertCircleIcon,
            count: stats?.past_due_count ?? dunningItems.length,
            hasPending: (stats?.past_due_count ?? 0) > 0,
          },
          {
            id: 'invoices',
            label: 'Riwayat Invoice & Refund',
            icon: ReceiptIcon,
            count: invoiceMeta.total || null,
          },
          {
            id: 'promos',
            label: 'Kupon & Diskon Promo',
            icon: TagIcon,
            count: stats?.active_promos_count ?? promos.length,
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
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
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
      {/* TAB 1: DIREKTORI LANGGANAN (SEMUA STATUS) */}
      {/* =================================================================== */}
      {subTab === 'directory' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          {/* Filter & Search Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search input with optional clear button */}
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari username, email, tenant, atau catatan..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Select Dropdowns for Plan, Cycle, Sort */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={planFilter}
                  onChange={(e) => {
                    setPlanFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer transition-colors"
                >
                  <option value="all">Semua Paket (Pro & Free)</option>
                  <option value="pro">Paket Pro</option>
                  <option value="free">Paket Free</option>
                </select>

                <select
                  value={cycleFilter}
                  onChange={(e) => {
                    setCycleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer transition-colors"
                >
                  <option value="all">Semua Siklus</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer transition-colors"
                >
                  <option value="updated_desc">Terbaru Diperbarui</option>
                  <option value="expiry_asc">Segera Berakhir</option>
                  <option value="price_desc">Harga Tertinggi</option>
                  <option value="name_asc">Nama Tenant (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Status Filter Chips - Clean Segmented */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'active', label: 'Aktif' },
                { id: 'trial', label: 'Trial' },
                { id: 'past_due', label: 'Past Due' },
                { id: 'canceled', label: 'Dibatalkan' },
                { id: 'expired', label: 'Kedaluwarsa' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/90'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Tenant / Pengguna</th>
                  <th className="py-3 px-4">Paket & Siklus</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tarif & Tagihan</th>
                  <th className="py-3 px-4">Periode Aktif</th>
                  <th className="py-3 px-4 text-right">Tindakan Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingSubs ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Memuat data langganan tenant...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data langganan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const badge = getStatusBadge(sub.status);
                    return (
                      <tr
                        key={sub.subscription_id || sub.user_id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Tenant */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                              {(sub.full_name?.charAt(0) || sub.username?.charAt(0) || 'U').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDrawerUserId(sub.user_id)}
                                  className="font-semibold text-slate-900 hover:text-slate-700 transition-colors truncate cursor-pointer text-left"
                                >
                                  {sub.full_name || sub.username}
                                </button>
                                {sub.is_verified && (
                                  <VerifiedBadgeIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                @{sub.username} • {sub.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Paket & Siklus */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                sub.plan === 'pro'
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {sub.plan === 'pro' ? 'Pro' : 'Free'}
                            </span>
                            {sub.plan === 'pro' && (
                              <span className="text-[11px] font-medium text-slate-600">
                                {sub.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 font-mono truncate max-w-[160px]">
                            {sub.payment_method_brand
                              ? `${sub.payment_method_brand} •••• ${sub.payment_method_last4 || '4242'}`
                              : 'Tanpa Kartu'}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.className}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                          {sub.cancel_at_period_end && (
                            <p className="text-[11px] text-rose-600 font-medium mt-1">
                              Berhenti di akhir periode
                            </p>
                          )}
                        </td>

                        {/* Tarif & Tagihan */}
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-semibold text-slate-900">
                            {formatIDR(sub.price)}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            LTV: {formatIDR(sub.total_paid)} ({sub.invoice_count} inv)
                          </p>
                        </td>

                        {/* Periode Aktif / Trial */}
                        <td className="py-3.5 px-4">
                          {sub.status === 'trial' && sub.trial_end_at ? (
                            <div>
                              <p className="text-xs font-semibold text-indigo-700">
                                Trial s/d {formatDateShort(sub.trial_end_at)}
                              </p>
                              <p className="text-[11px] text-indigo-500 mt-0.5">
                                {sub.days_remaining > 0
                                  ? `${sub.days_remaining} hari tersisa`
                                  : 'Segera berakhir'}
                              </p>
                            </div>
                          ) : sub.plan === 'pro' && sub.current_period_end ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                s/d {formatDateShort(sub.current_period_end)}
                              </p>
                              <p
                                className={`text-[11px] mt-0.5 font-medium ${
                                  sub.days_remaining <= 5
                                    ? 'text-amber-600 font-semibold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {sub.days_remaining > 0
                                  ? `${sub.days_remaining} hari lagi`
                                  : 'Periode berakhir'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Permanen (Free)</span>
                          )}
                        </td>

                        {/* Aksi Cepat */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setDrawerUserId(sub.user_id)}
                              title="Lihat Detail & Invoice"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5 text-slate-500" />
                              <span>Detail</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'plan', payload: sub })}
                              title="Ubah Paket Manual"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer transition-colors"
                            >
                              Paket
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'extend', payload: sub })}
                              title="Perpanjang Goodwill (Hari Gratis)"
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-xs font-medium text-emerald-800 cursor-pointer transition-colors"
                            >
                              +Goodwill
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'trial', payload: sub })}
                              title="Kelola Masa Trial / Konversi Paid"
                              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-xs font-medium text-indigo-800 cursor-pointer transition-colors"
                            >
                              Trial
                            </button>

                            {sub.status !== 'canceled' && sub.plan === 'pro' && (
                              <button
                                type="button"
                                onClick={() => setActiveModal({ type: 'cancel', payload: sub })}
                                title="Batalkan Langganan"
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                              >
                                <BanIcon className="w-3.5 h-3.5" />
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

          {/* Pagination Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Menampilkan <strong>{subscriptions.length}</strong> dari{' '}
              <strong>{subMeta.total}</strong> langganan tenant (Halaman {subMeta.page} /{' '}
              {subMeta.total_pages || 1})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium text-slate-700 cursor-pointer transition-colors"
              >
                ← Sebelumnya
              </button>
              <button
                type="button"
                disabled={page >= (subMeta.total_pages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium text-slate-700 cursor-pointer transition-colors"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: ANTREAN DUNNING & PEMBAYARAN GAGAL */}
      {/* =================================================================== */}
      {subTab === 'dunning' && (
        <div className="space-y-4">
          {/* Banner Dunning Control */}
          <div className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-amber-950">
                  Dunning Recovery & Penanganan Pembayaran Gagal (Past-Due)
                </h3>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80">
                  Potensi Tertahan: {formatIDR(dunningSummary.total_at_risk_revenue)}
                </span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed max-w-2xl">
                Daftar akun di bawah mengalami kegagalan perpanjangan otomatis atau memiliki invoice berstatus{' '}
                <span className="font-mono font-bold">failed</span>. Kirim pengingat pembayaran (Email & In-App) atau konfirmasi pelunasan manual.
              </p>
            </div>

            <button
              type="button"
              disabled={bulkReminding || dunningItems.length === 0}
              onClick={handleBulkDunningRemind}
              className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <MailIcon className="w-4 h-4" />
              <span>
                {bulkReminding
                  ? 'Mengirim Reminder Massal...'
                  : `Kirim Reminder ke Semua (${dunningItems.length})`}
              </span>
            </button>
          </div>

          {/* Dunning Table */}
          <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Tenant Past-Due</th>
                    <th className="py-3 px-4">Nominal Tertunggak</th>
                    <th className="py-3 px-4">Keterlambatan</th>
                    <th className="py-3 px-4">Status Reminder Dunning</th>
                    <th className="py-3 px-4">Metode Pembayaran</th>
                    <th className="py-3 px-4 text-right">Tindakan Pemulihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingDunning ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        Memuat antrean dunning...
                      </td>
                    </tr>
                  ) : dunningItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        Tidak ada akun dengan pembayaran gagal (past-due) saat ini. Semua tagihan sehat.
                      </td>
                    </tr>
                  ) : (
                    dunningItems.map((item) => (
                      <tr key={item.subscription_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{item.full_name || item.username}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            @{item.username} • {item.email}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-semibold text-rose-600">
                            {formatIDR(item.overdue_amount)}
                          </span>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.failed_invoice_number || `${item.plan} (${item.billing_cycle})`}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            {item.days_overdue} hari tertunggak
                          </span>
                          {item.failed_at && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Sejak {formatDateShort(item.failed_at)}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-800">
                            {item.dunning_reminder_count}x dikirim
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Terakhir:{' '}
                            {item.last_reminder_sent_at
                              ? formatDateShort(item.last_reminder_sent_at)
                              : 'Belum pernah'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-xs font-medium text-slate-700">
                            {item.payment_method_brand || 'Kartu Kredit'} ••••{' '}
                            {item.payment_method_last4 || '4242'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Auto-debit gagal</p>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveModal({ type: 'dunning_remind', payload: item })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-medium text-amber-900 flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <MailIcon className="w-3.5 h-3.5" />
                              <span>Kirim Reminder</span>
                            </button>

                            <button
                              type="button"
                              disabled={resolvingUserId === item.user_id}
                              onClick={() => handleResolveDunningManual(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                              <span>
                                {resolvingUserId === item.user_id ? 'Memproses...' : 'Tandai Lunas'}
                              </span>
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
      {/* TAB 3: RIWAYAT INVOICE & PROSES REFUND */}
      {/* =================================================================== */}
      {subTab === 'invoices' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => {
                  setInvoiceSearch(e.target.value);
                  setInvoicePage(1);
                }}
                placeholder="Cari nomor invoice, deskripsi, username, atau email..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
              {invoiceSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceSearch('');
                    setInvoicePage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Semua Invoice' },
                { id: 'paid', label: 'Lunas' },
                { id: 'failed', label: 'Gagal' },
                { id: 'refunded', label: 'Refund' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setInvoiceStatus(st.id);
                    setInvoicePage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    invoiceStatus === st.id
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/90'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invoice Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Deskripsi Tagihan</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Aksi Refund / Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loadingInvoices ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Memuat daftar invoice platform...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada invoice yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setDrawerUserId(inv.user_id)}
                          className="font-semibold text-slate-900 hover:text-slate-700 cursor-pointer text-left transition-colors"
                        >
                          {inv.user_full_name || `@${inv.username}`}
                        </button>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          @{inv.username} • {inv.user_email}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-slate-800 truncate">
                          {inv.plan_name || inv.description || 'Langganan Klikin Pro'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Alasan: {inv.billing_reason || 'subscription_cycle'}
                        </p>
                        {inv.refund_reason && (
                          <p className="text-[11px] text-rose-600 font-medium mt-1">
                            Alasan Refund: {inv.refund_reason}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {formatIDR(inv.total || inv.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.status === 'paid' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Lunas
                          </span>
                        )}
                        {inv.status === 'refunded' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Refund
                          </span>
                        )}
                        {inv.status === 'failed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Gagal
                          </span>
                        )}
                        {inv.status !== 'paid' && inv.status !== 'refunded' && inv.status !== 'failed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 capitalize">
                            {inv.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateShort(inv.paid_at || inv.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDrawerUserId(inv.user_id)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer transition-colors"
                          >
                            Lihat User
                          </button>
                          {inv.status === 'paid' && (inv.total > 0 || inv.amount > 0) && (
                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'refund', payload: inv })}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-xs font-medium text-rose-700 cursor-pointer transition-colors"
                            >
                              Proses Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total <strong>{invoiceMeta.total}</strong> invoice (Halaman {invoiceMeta.page} /{' '}
              {invoiceMeta.total_pages || 1})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={invoicePage <= 1}
                onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium text-slate-700 cursor-pointer transition-colors"
              >
                ← Sebelumnya
              </button>
              <button
                type="button"
                disabled={invoicePage >= (invoiceMeta.total_pages || 1)}
                onClick={() => setInvoicePage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium text-slate-700 cursor-pointer transition-colors"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: KUPON & DISKON PROMO */}
      {/* =================================================================== */}
      {subTab === 'promos' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Manajemen Kupon Promo & Diskon Checkout
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Buat, atur masa berlaku, batasi kuota pemakaian, dan pantau konversi kupon diskon yang digunakan oleh tenant.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal({ type: 'promo', payload: null })}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Tambah Kupon Promo</span>
            </button>
          </div>

          {loadingPromos ? (
            <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center text-xs text-slate-400 font-medium">
              Memuat daftar kupon promo...
            </div>
          ) : promos.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center space-y-3">
              <p className="text-xs text-slate-400">Belum ada kupon promo yang terdaftar.</p>
              <button
                type="button"
                onClick={() => setActiveModal({ type: 'promo', payload: null })}
                className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                + Buat Kupon Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promos.map((promo) => {
                const usagePct =
                  promo.max_uses > 0
                    ? Math.min(100, Math.round((promo.used_count / promo.max_uses) * 100))
                    : 0;
                return (
                  <div
                    key={promo.id}
                    className={`bg-white border rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-all hover:border-slate-300 ${
                      promo.is_active ? 'border-slate-200/90' : 'border-slate-200/50 opacity-70'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                            {promo.code}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                              promo.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {promo.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveModal({ type: 'promo', payload: promo })}
                            title="Edit Kupon"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingPromoId === promo.id}
                            onClick={() => handleDeletePromo(promo)}
                            title="Hapus Kupon"
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-base font-bold text-slate-900">
                          Diskon {promo.discount_percent}%
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {promo.description || 'Kupon promo langganan Klikin Pro'}
                        </p>
                      </div>

                      {/* Usage Progress */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Penggunaan Kupon</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {promo.used_count} / {promo.max_uses > 0 ? promo.max_uses : '∞'} klaim
                          </span>
                        </div>
                        {promo.max_uses > 0 && (
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-800 rounded-full transition-all"
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Berlaku s/d:{' '}
                        <strong className="text-slate-700 font-mono">
                          {promo.expires_at ? formatDateShort(promo.expires_at) : 'Selamanya'}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTogglePromoActive(promo)}
                        className="font-semibold text-slate-900 hover:underline cursor-pointer"
                      >
                        {promo.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* DRAWER & MODALS */}
      {/* =================================================================== */}
      <SubscriptionDetailDrawer
        userId={drawerUserId}
        token={token}
        isOpen={Boolean(drawerUserId)}
        onClose={() => setDrawerUserId(null)}
        onOpenChangePlan={(sub) => setActiveModal({ type: 'plan', payload: sub })}
        onOpenGoodwill={(sub) => setActiveModal({ type: 'extend', payload: sub })}
        onOpenTrial={(sub) => setActiveModal({ type: 'trial', payload: sub })}
        onOpenCancel={(sub) => setActiveModal({ type: 'cancel', payload: sub })}
        onOpenRefund={(inv) => setActiveModal({ type: 'refund', payload: inv })}
      />

      <ChangePlanModal
        subscription={activeModal.type === 'plan' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'plan'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={handleModalSuccess}
      />

      <ExtendGoodwillModal
        subscription={activeModal.type === 'extend' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'extend'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={handleModalSuccess}
      />

      <ManageTrialModal
        subscription={activeModal.type === 'trial' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'trial'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={handleModalSuccess}
      />

      <CancelSubscriptionModal
        subscription={activeModal.type === 'cancel' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'cancel'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={handleModalSuccess}
      />

      <RefundInvoiceModal
        invoice={activeModal.type === 'refund' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'refund'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={handleModalSuccess}
      />

      <PromoCodeModal
        promo={activeModal.type === 'promo' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'promo'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={handleModalSuccess}
      />

      <DunningReminderModal
        item={activeModal.type === 'dunning_remind' ? activeModal.payload : null}
        token={token}
        isOpen={activeModal.type === 'dunning_remind'}
        onClose={() => setActiveModal({ type: null, payload: null })}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
