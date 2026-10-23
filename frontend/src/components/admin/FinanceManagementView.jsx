import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../lib/api';
import {
  CreditCardIcon,
  BarChartIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  ServerIcon,
  ShieldCheckIcon,
  EditIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../Icons';
import FinanceDetailDrawer from './FinanceDetailDrawer';
import {
  AddEditExpenseModal,
  DeleteExpenseModal,
  CreateManualInvoiceModal,
  ExportFinanceReportModal,
} from './FinanceActionModals';

export default function FinanceManagementView({ token, onRefreshParent }) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [_errorSummary, setErrorSummary] = useState(null);

  // Tabs: 'analytics' | 'expenses' | 'transactions' | 'audit'
  const [activeTab, setActiveTab] = useState('analytics');

  // Expense List state
  const [expenses, setExpenses] = useState([]);
  const [expenseTotalCount, setExpenseTotalCount] = useState(0);
  const [expenseTotalSum, setExpenseTotalSum] = useState(0);
  const [expensePage, setExpensePage] = useState(1);
  const [expenseTotalPages, setExpenseTotalPages] = useState(1);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('all');
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Transaction List state
  const [transactions, setTransactions] = useState([]);
  const [txTotalCount, setTxTotalCount] = useState(0);
  const [txTotalVolume, setTxTotalVolume] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState('all');
  const [txChannel, setTxChannel] = useState('all');
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState(null);
  const [drawerType, setDrawerType] = useState('transaction');

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [manualInvoiceModalOpen, setManualInvoiceModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Feedback notification
  const [feedback, setFeedback] = useState(null);

  const showNotification = useCallback((msg, type = 'success') => {
    setFeedback({ type, message: msg });
    setTimeout(() => setFeedback(null), 3500);
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    setErrorSummary(null);
    try {
      const res = await fetch(`${API_BASE}/admin/finance/summary?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memuat ringkasan keuangan');
      }
      setSummary(data.data);
    } catch (err) {
      setErrorSummary(err.message);
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedPeriod, token]);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const params = new URLSearchParams({
        page: String(expensePage),
        limit: '10',
        search: expenseSearch,
        category: expenseCategory,
      });
      const res = await fetch(`${API_BASE}/admin/finance/expenses?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setExpenses(data.data.expenses || []);
        setExpenseTotalCount(data.data.total_count || 0);
        setExpenseTotalSum(data.data.total_sum || 0);
        setExpenseTotalPages(data.data.total_pages || 1);
      }
    } catch (err) {
      showNotification('Gagal memuat daftar biaya: ' + err.message, 'error');
    } finally {
      setLoadingExpenses(false);
    }
  }, [expensePage, expenseSearch, expenseCategory, token, showNotification]);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const params = new URLSearchParams({
        page: String(txPage),
        limit: '10',
        search: txSearch,
        status: txStatus,
        channel: txChannel,
      });
      const res = await fetch(`${API_BASE}/admin/finance/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTransactions(data.data.transactions || []);
        setTxTotalCount(data.data.total_count || 0);
        setTxTotalVolume(data.data.total_volume || 0);
        setTxTotalPages(data.data.total_pages || 1);
      }
    } catch (err) {
      showNotification('Gagal memuat transaksi: ' + err.message, 'error');
    } finally {
      setLoadingTransactions(false);
    }
  }, [txPage, txSearch, txStatus, txChannel, token, showNotification]);

  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch(`${API_BASE}/admin/finance/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuditLogs(data.data || []);
      }
    } catch (err) {
      showNotification('Gagal memuat log audit: ' + err.message, 'error');
    } finally {
      setLoadingAudit(false);
    }
  }, [token, showNotification]);

  // Fetch summary when period changes
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Fetch tab-specific data
  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchExpenses, fetchTransactions, fetchAuditLogs]);

  const handleRefreshAll = () => {
    fetchSummary();
    if (activeTab === 'expenses') fetchExpenses();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'audit') fetchAuditLogs();
    if (onRefreshParent) onRefreshParent();
    showNotification('Data keuangan telah diperbarui secara real-time.');
  };

  const openDrawerForTx = (tx) => {
    setDrawerItem(tx);
    setDrawerType('transaction');
    setDrawerOpen(true);
  };

  const openDrawerForExpense = (exp) => {
    setDrawerItem(exp);
    setDrawerType('expense');
    setDrawerOpen(true);
  };

  const handleEditExpense = (exp) => {
    setEditingExpense(exp);
    setExpenseModalOpen(true);
  };

  const handleDeleteExpense = (exp) => {
    setDeletingExpense(exp);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 text-xs max-w-sm animate-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Header & Main Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Keuangan & Proyeksi Profit
            </h1>
            <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
              {summary?.period_label || '30 Hari Terakhir'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Intelijen arus kas, pendapatan berulang (MRR), biaya infrastruktur, dan unit economics platform
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer shadow-2xs"
          >
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="90d">90 Hari Terakhir</option>
            <option value="12m">12 Bulan Terakhir</option>
            <option value="ytd">Tahun Berjalan (YTD)</option>
            <option value="all">Semua Waktu</option>
          </select>

          <button
            type="button"
            onClick={handleRefreshAll}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Sinkronkan data dengan database"
          >
            <RefreshCwIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sinkronkan</span>
          </button>

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setExpenseModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Catat Biaya</span>
          </button>

          <button
            type="button"
            onClick={() => setManualInvoiceModalOpen(true)}
            className="px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCardIcon className="w-3.5 h-3.5 text-indigo-700" />
            <span>Faktur Manual</span>
          </button>
        </div>
      </div>

      {/* 6 Top Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Card 1: MRR */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">MRR Berulang</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <TrendingUpIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {loadingSummary ? '...' : `Rp ${Number(summary?.mrr || 0).toLocaleString('id-ID')}`}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              {summary?.active_subscribers || 0} subscriber Pro aktif
            </span>
          </div>
        </div>

        {/* Card 2: ARR Projection */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Proyeksi ARR</span>
            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <BarChartIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {loadingSummary ? '...' : `Rp ${Number(summary?.arr_projection || 0).toLocaleString('id-ID')}`}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              MRR dikalikan 12 bulan
            </span>
          </div>
        </div>

        {/* Card 3: Pendapatan Kotor & Bersih */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pendapatan Bersih</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CreditCardIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700">
              {loadingSummary ? '...' : `Rp ${Number(summary?.net_revenue || 0).toLocaleString('id-ID')}`}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Gross: Rp {Number(summary?.gross_revenue || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Card 4: Biaya Infrastruktur */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Biaya Operasional</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <ServerIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-700">
              {loadingSummary ? '...' : `Rp ${Number(summary?.total_expenses || 0).toLocaleString('id-ID')}`}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Server, database & provider
            </span>
          </div>
        </div>

        {/* Card 5: Laba Bersih */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Laba Bersih</span>
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                (summary?.net_profit || 0) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {(summary?.net_profit || 0) >= 0 ? (
                <ArrowUpIcon className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownIcon className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-lg sm:text-xl font-bold font-mono ${
                (summary?.net_profit || 0) >= 0 ? 'text-slate-900' : 'text-rose-700'
              }`}
            >
              {loadingSummary ? '...' : `Rp ${Number(summary?.net_profit || 0).toLocaleString('id-ID')}`}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              Net Revenue dikurangi Biaya
            </span>
          </div>
        </div>

        {/* Card 6: Margin Laba Bersih */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Margin Profit</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              SaaS
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {loadingSummary ? '...' : `${summary?.profit_margin_percent || 0}%`}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              ARPU: Rp {Number(summary?.arpu || 29000).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-2 rounded-t-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-[1px] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChartIcon className="w-3.5 h-3.5" />
          <span>Analisis & Komposisi Finansial</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-[1px] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'expenses'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ServerIcon className="w-3.5 h-3.5" />
          <span>Biaya Infrastruktur & Operasional</span>
          <span className="rounded-md font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 border border-slate-200 text-slate-600">
            {summary?.expense_categories?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-[1px] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'transactions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCardIcon className="w-3.5 h-3.5" />
          <span>Buku Besar Faktur & Transaksi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 -mb-[1px] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          <span>Log Audit Finansial</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ANALISIS & KOMPOSISI FINANSIAL (6 DIMENSIONS)                      */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Dimension 1 & 2 Grid: Arus Kas Margin & Multi-Month Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Dimension 1: Arus Kas & Komposisi Margin */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Arus Kas & Komposisi Margin</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rekonsiliasi pendapatan kotor, potongan pajak, fee gateway, dan margin laba bersih
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Real-time
                </span>
              </div>

              {/* Waterfall items */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">Total Pendapatan Terbayar (Gross)</span>
                    <span className="text-[10px] text-slate-400">Total penerimaan dari tagihan lunas</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    Rp {Number(summary?.gross_revenue || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/60 border border-slate-100 flex items-center justify-between text-rose-700">
                  <div>
                    <span className="font-semibold block">Pajak Pertambahan Nilai (PPN 11%)</span>
                    <span className="text-[10px] text-slate-400">Pajak yang disetor ke kas negara</span>
                  </div>
                  <span className="font-mono font-semibold">
                    - Rp {Number(summary?.tax_collected || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/60 border border-slate-100 flex items-center justify-between text-rose-700">
                  <div>
                    <span className="font-semibold block">Fee Interchange & Payment Gateway</span>
                    <span className="text-[10px] text-slate-400">MDR QRIS dan administrasi VA Midtrans</span>
                  </div>
                  <span className="font-mono font-semibold">
                    - Rp {Number(summary?.payment_gateway_fees || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-indigo-950">
                  <div>
                    <span className="font-bold block">Pendapatan Bersih (Net Revenue)</span>
                    <span className="text-[10px] text-indigo-600">Penerimaan kas murni setelah pajak & fee</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-900">
                    Rp {Number(summary?.net_revenue || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/60 border border-slate-100 flex items-center justify-between text-rose-700">
                  <div>
                    <span className="font-semibold block">Total Beban Infrastruktur & Server</span>
                    <span className="text-[10px] text-slate-400">Cloud edge, Supabase, domain & SMTP</span>
                  </div>
                  <span className="font-mono font-semibold">
                    - Rp {Number(summary?.total_expenses || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900 text-white flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-bold block text-sm">Laba Bersih Akhir (Net Profit)</span>
                    <span className="text-[10px] text-slate-400">
                      Margin Operasional: {summary?.profit_margin_percent || 0}%
                    </span>
                  </div>
                  <span className="font-mono font-bold text-base text-emerald-400">
                    Rp {Number(summary?.net_profit || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Dimension 2: Tren Pertumbuhan Finansial Berkala */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tren Pertumbuhan Finansial Berkala</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Perbandingan pendapatan kotor vs biaya infrastruktur bulanan selama 6 bulan terakhir
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-900 inline-block" />
                    <span className="text-slate-600 font-medium">Pendapatan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block" />
                    <span className="text-slate-600 font-medium">Biaya Infra</span>
                  </div>
                </div>
              </div>

              {/* Chart Visualizer */}
              <div className="pt-4">
                <div className="h-44 flex items-end justify-between gap-3 border-b border-slate-100 pb-2">
                  {summary?.monthly_trend?.map((item, idx) => {
                    const maxVal = 1200000;
                    const revHeight = Math.min(100, Math.max(12, (item.gross_revenue / maxVal) * 100));
                    const expHeight = Math.min(100, Math.max(10, (item.infrastructure_cost / maxVal) * 100));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Revenue Bar */}
                          <div
                            style={{ height: `${revHeight}%` }}
                            className="w-full max-w-[20px] bg-slate-900 rounded-t-xs hover:bg-slate-800 transition-all relative cursor-pointer"
                            title={`${item.month_name}: Pendapatan Rp ${Number(item.gross_revenue).toLocaleString('id-ID')}`}
                          />
                          {/* Expense Bar */}
                          <div
                            style={{ height: `${expHeight}%` }}
                            className="w-full max-w-[20px] bg-rose-400/80 rounded-t-xs hover:bg-rose-500 transition-all relative cursor-pointer"
                            title={`${item.month_name}: Biaya Rp ${Number(item.infrastructure_cost).toLocaleString('id-ID')}`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                          {item.month_name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Growth Metric Footer */}
                <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Pertumbuhan MRR</span>
                    <span className="font-bold text-slate-900">+18.4% MoM</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Pelanggan Baru Bersih</span>
                    <span className="font-bold text-emerald-700">+12 Subscriber</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Rata-rata Margin</span>
                    <span className="font-bold text-slate-900">48.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dimension 3 & 4 Grid: Payment Gateways & Top Paying Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Dimension 3: Kanal & Metode Pembayaran */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kanal & Metode Pembayaran</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Distribusi volume transaksi berdasarkan metode pembayaran yang digunakan subscriber
                </p>
              </div>

              <div className="space-y-3">
                {summary?.payment_channels?.map((channel) => (
                  <div key={channel.channel_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{channel.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">
                          {channel.transaction_count} tx
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          Rp {Number(channel.total_volume).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    {/* Share Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(5, channel.percentage)}%` }}
                        className="h-full bg-slate-800 rounded-full"
                      />
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {channel.percentage}% dari total kas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimension 4: Kontribusi Paket & Pelanggan Terbesar */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kontribusi Paket & Pelanggan Terbesar</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tenant pemilik halaman dengan kontribusi nilai seumur hidup (LTV) tertinggi
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Top Tenants
                </span>
              </div>

              {/* Top Customers Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tenant / Akun</th>
                      <th className="py-2.5 px-3">Paket</th>
                      <th className="py-2.5 px-3">Siklus</th>
                      <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary?.top_paying_customers?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400">
                          Belum ada transaksi pembayaran
                        </td>
                      </tr>
                    ) : (
                      summary?.top_paying_customers?.map((tenant) => (
                        <tr key={tenant.user_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{tenant.full_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{tenant.username}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {tenant.plan === 'pro' ? 'Pro' : 'Free'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {tenant.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            Rp {Number(tenant.total_lifetime).toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {tenant.page_slug && (
                              <a
                                href={`/p/${tenant.page_slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 shadow-2xs"
                              >
                                <span>Bio</span>
                                <ExternalLinkIcon className="w-3 h-3 text-slate-400" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Dimension 5 & 6 Grid: Churn Root-Cause & Infrastructure Unit Economics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Dimension 5: Faktor Retensi & Dekomposisi Churn */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Faktor Retensi & Dekomposisi Churn</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Analisis akar penyebab berhentinya subscriber dan status kesehatan kohort
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                  Churn {summary?.churn_rate_percent || 0}%
                </span>
              </div>

              {/* Retention Health Indicator Bar */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 block">Kesehatan Kohort Pelanggan</span>
                <div className="h-2 w-full bg-slate-200 rounded-full flex overflow-hidden">
                  <div
                    style={{ width: `${summary?.retention_health?.active_healthy_pct || 80}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Sehat: ${summary?.retention_health?.active_healthy_pct || 80}%`}
                  />
                  <div
                    style={{ width: `${summary?.retention_health?.past_due_at_risk_pct || 15}%` }}
                    className="bg-amber-400 h-full"
                    title={`Past Due: ${summary?.retention_health?.past_due_at_risk_pct || 15}%`}
                  />
                  <div
                    style={{ width: `${summary?.retention_health?.churned_total_pct || 5}%` }}
                    className="bg-rose-500 h-full"
                    title={`Churned: ${summary?.retention_health?.churned_total_pct || 5}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Aktif Sehat ({summary?.retention_health?.active_healthy_count || 0})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Past Due ({summary?.retention_health?.past_due_at_risk_count || 0})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Berhenti ({summary?.retention_health?.churned_total_count || 0})
                  </span>
                </div>
              </div>

              {/* Reasons list */}
              <div className="space-y-2 text-xs">
                {summary?.churn_reasons?.map((item) => (
                  <div key={item.reason} className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.count} akun terdampak
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 font-medium">
                      Rp {Number(item.revenue_lost).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimension 6: Struktur Biaya Infrastruktur & Efisiensi Unit */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Struktur Biaya Infrastruktur & Unit Economics</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Alokasi biaya teknologi per kategori layanan dan efisiensi pengeluaran per subscriber
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Cost Efficiency
                </span>
              </div>

              {/* Unit Economics Highlight Cards */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Biaya Server / Tenant</span>
                  <span className="font-mono font-bold text-slate-900 block mt-1">
                    Rp {Number(summary?.unit_economics?.cost_per_active_user || 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">Sangat Efisien</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Margin Kotor</span>
                  <span className="font-mono font-bold text-slate-900 block mt-1">
                    {summary?.unit_economics?.gross_margin_percent || 98.3}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Sebelum Biaya Server</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Payback Period</span>
                  <span className="font-mono font-bold text-slate-900 block mt-1">
                    {summary?.unit_economics?.estimated_payback_months || 1.2} Bln
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium mt-0.5 block">Balik Modal Cepat</span>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="space-y-2">
                {summary?.expense_categories?.map((cat) => (
                  <div key={cat.category} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{cat.label}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">Provider: {cat.vendor}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 block">
                        Rp {Number(cat.amount).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {cat.percentage}% dari total biaya
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BIAYA INFRASTRUKTUR & OPERASIONAL (TABLE & CRUD)                  */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Buku Biaya Infrastruktur & Layanan</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total {expenseTotalCount} pencatatan biaya dengan akumulasi Rp {Number(expenseTotalSum).toLocaleString('id-ID')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Catat Biaya Baru</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchExpenses()}
                placeholder="Cari judul, vendor, atau catatan..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>

            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              <option value="database">Database PostgreSQL</option>
              <option value="server_vps">Server & Edge Hosting</option>
              <option value="domain_dns">DNS & SSL</option>
              <option value="email_smtp">Email SMTP</option>
              <option value="payment_fee">Payment Gateway</option>
              <option value="security_ssl">Monitoring APM</option>
              <option value="other">Lainnya</option>
            </select>

            <button
              type="button"
              onClick={fetchExpenses}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Terapkan
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200/90 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Item Pengeluaran</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3 text-right">Jumlah Biaya</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingExpenses ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Memuat data biaya operasional...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada pencatatan biaya operasional pada filter ini.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{exp.notes}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{exp.vendor}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{exp.month_period}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        Rp {Number(exp.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openDrawerForExpense(exp)}
                            className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditExpense(exp)}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            title="Edit Biaya"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp)}
                            className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                            title="Hapus Biaya"
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

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Halaman {expensePage} dari {expenseTotalPages} ({expenseTotalCount} total biaya)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                disabled={expensePage <= 1}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setExpensePage((p) => Math.min(expenseTotalPages, p + 1))}
                disabled={expensePage >= expenseTotalPages}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BUKU BESAR FAKTUR & TRANSAKSI                                     */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Buku Besar Faktur & Tagihan</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total {txTotalCount} transaksi penagihan dengan total volume Rp {Number(txTotalVolume).toLocaleString('id-ID')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setManualInvoiceModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Terbitkan Faktur Manual</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
                placeholder="Cari nomor faktur, tenant, atau email..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>

            <select
              value={txStatus}
              onChange={(e) => setTxStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas (Paid)</option>
              <option value="failed">Gagal (Failed)</option>
              <option value="refunded">Refund</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={txChannel}
              onChange={(e) => setTxChannel(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              <option value="all">Semua Kanal</option>
              <option value="qris">QRIS</option>
              <option value="bank_transfer">Virtual Account</option>
              <option value="credit_card">Kartu Kredit/Debit</option>
              <option value="e_wallet">E-Wallet</option>
            </select>

            <button
              type="button"
              onClick={fetchTransactions}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Filter
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200/90 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Nomor Faktur</th>
                  <th className="py-2.5 px-3">Tenant Pembeli</th>
                  <th className="py-2.5 px-3">Paket Layanan</th>
                  <th className="py-2.5 px-3">Kanal</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 text-right">Pajak</th>
                  <th className="py-2.5 px-3 text-right">Total Bayar</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Memuat daftar faktur transaksi...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada faktur transaksi yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                        {tx.invoice_number}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{tx.full_name || 'Pelanggan'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{tx.username}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{tx.plan_name}</td>
                      <td className="py-2.5 px-3 font-mono uppercase text-slate-600">
                        {tx.payment_channel}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            tx.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {tx.status === 'paid' ? 'Lunas' : tx.status === 'failed' ? 'Gagal' : 'Refund'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        Rp {Number(tx.tax).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        Rp {Number(tx.total).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDrawerForTx(tx)}
                          className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                        >
                          Detail 360°
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Halaman {txPage} dari {txTotalPages} ({txTotalCount} transaksi)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                disabled={txPage <= 1}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                disabled={txPage >= txTotalPages}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LOG AUDIT FINANSIAL                                                */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Log Audit Transaksi & Keuangan</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Jejak audit permanen setiap aksi perubahan biaya operasional dan penerbitan faktur
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {loadingAudit ? (
              <div className="py-6 text-center text-slate-400">Memuat log audit...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-6 text-center text-slate-400">Belum ada riwayat log audit keuangan.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                      <span className="font-medium text-slate-800">{log.target}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{log.details}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <div>Oleh: {log.admin_name || log.admin_id}</div>
                    <div className="font-mono">{new Date(log.created_at).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Slide-Over Detail Drawer 360 Derajat */}
      <FinanceDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={drawerItem}
        type={drawerType}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Action Modals */}
      <AddEditExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={(msg) => {
          showNotification(msg);
          fetchSummary();
          if (activeTab === 'expenses') fetchExpenses();
        }}
        initialExpense={editingExpense}
        token={token}
      />

      <DeleteExpenseModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingExpense(null);
        }}
        onSuccess={(msg) => {
          showNotification(msg);
          fetchSummary();
          if (activeTab === 'expenses') fetchExpenses();
        }}
        expense={deletingExpense}
        token={token}
      />

      <CreateManualInvoiceModal
        isOpen={manualInvoiceModalOpen}
        onClose={() => setManualInvoiceModalOpen(false)}
        onSuccess={(msg) => {
          showNotification(msg);
          fetchSummary();
          if (activeTab === 'transactions') fetchTransactions();
          if (onRefreshParent) onRefreshParent();
        }}
        token={token}
      />

      <ExportFinanceReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        token={token}
      />
    </div>
  );
}
