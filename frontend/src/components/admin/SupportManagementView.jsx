import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../lib/api';
import {
  MessageCircleIcon,
  SearchIcon,
  RefreshCwIcon,
  DownloadIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  UsersIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  TrashIcon,
  FilterIcon,
} from '../Icons';
import SupportDetailDrawer from './SupportDetailDrawer';
import {
  BroadcastAnnouncementModal,
  DirectNotificationModal,
  AddEditCannedResponseModal,
  UpdateTicketStatusModal,
} from './SupportActionModals';

/**
 * Super Admin Support & Komunikasi Platform (Readme Section 3.8)
 */
export default function SupportManagementView({ user, token }) {
  // Navigation sub-tabs
  const [subTab, setSubTab] = useState('inbox'); // 'inbox' | 'canned' | 'broadcast' | 'logs'

  // Global alerts & toasts
  const [feedback, setFeedback] = useState(null);

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [countsByStatus, setCountsByStatus] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Ticket filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('newest');

  // Canned templates state
  const [cannedList, setCannedList] = useState([]);
  const [cannedLoading, setCannedLoading] = useState(false);
  const [cannedSearch, setCannedSearch] = useState('');
  const [cannedCategory, setCannedCategory] = useState('all');
  const [copiedCannedId, setCopiedCannedId] = useState(null);

  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState([]);
  const [broadcastsLoading, setBroadcastsLoading] = useState(false);

  // Communication logs state
  const [commLogs, setCommLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logChannelFilter, setLogChannelFilter] = useState('all');
  const [logActionFilter, setLogActionFilter] = useState('all');

  // Drawer & Modal control states
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isDirectNotifModalOpen, setIsDirectNotifModalOpen] = useState(false);
  const [directNotifTargetUser, setDirectNotifTargetUser] = useState(null);

  const [isCannedModalOpen, setIsCannedModalOpen] = useState(false);
  const [selectedCannedItem, setSelectedCannedItem] = useState(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalTicket, setStatusModalTicket] = useState(null);

  // Toast trigger helper
  const triggerToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // 1. Fetch KPIs
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Error fetching support stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  // 2. Fetch Tickets
  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: search.trim(),
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        sort: sortFilter,
      });

      const res = await fetch(`${API_BASE}/admin/support/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTickets(json.data.tickets || []);
        setTotalTickets(json.data.total_count || 0);
        setTotalPages(json.data.total_pages || 1);
        setCountsByStatus(json.data.counts_by_status || {});
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      triggerToast('error', 'Gagal memuat daftar tiket');
    } finally {
      setTicketsLoading(false);
    }
  }, [token, page, limit, search, statusFilter, categoryFilter, priorityFilter, sortFilter]);

  // 3. Fetch Canned Templates
  const fetchCanned = useCallback(async () => {
    setCannedLoading(true);
    try {
      const params = new URLSearchParams({
        search: cannedSearch.trim(),
        category: cannedCategory,
      });
      const res = await fetch(`${API_BASE}/admin/support/canned-responses?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCannedList(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching canned templates:', err);
    } finally {
      setCannedLoading(false);
    }
  }, [token, cannedSearch, cannedCategory]);

  // 4. Fetch Broadcast History
  const fetchBroadcasts = useCallback(async () => {
    setBroadcastsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/support/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBroadcasts(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching broadcasts:', err);
    } finally {
      setBroadcastsLoading(false);
    }
  }, [token]);

  // 5. Fetch Communication Logs
  const fetchCommLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        channel: logChannelFilter,
        action_type: logActionFilter,
      });
      const res = await fetch(`${API_BASE}/admin/support/communication-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCommLogs(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching comm logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [token, logChannelFilter, logActionFilter]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (subTab === 'inbox') fetchTickets();
    if (subTab === 'canned') fetchCanned();
    if (subTab === 'broadcast') fetchBroadcasts();
    if (subTab === 'logs') fetchCommLogs();
  }, [subTab, fetchTickets, fetchCanned, fetchBroadcasts, fetchCommLogs]);

  // Export Tickets CSV
  const handleExportCSV = () => {
    const params = new URLSearchParams({
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
    });
    window.open(`${API_BASE}/admin/support/export?${params.toString()}`, '_blank');
    triggerToast('success', 'Mengunduh laporan tiket dalam format CSV');
  };

  // Copy canned response text to clipboard
  const handleCopyCanned = (item) => {
    navigator.clipboard.writeText(item.content);
    setCopiedCannedId(item.id);
    triggerToast('success', `Template "${item.title}" disalin ke clipboard`);
    setTimeout(() => setCopiedCannedId(null), 2500);
  };

  // Delete canned response
  const handleDeleteCanned = async (id, title) => {
    if (!window.confirm(`Yakin ingin menghapus template balasan "${title}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/support/canned-responses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus template');
      }
      triggerToast('success', 'Template balasan berhasil dihapus');
      fetchCanned();
    } catch (err) {
      triggerToast('error', err.message || 'Gagal menghapus template');
    }
  };

  // Open ticket drawer
  const handleOpenTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    setIsDrawerOpen(true);
  };

  // Open direct notification modal for user
  const handleOpenDirectNotif = (targetUser) => {
    setDirectNotifTargetUser(targetUser);
    setIsDirectNotifModalOpen(true);
  };

  // Status badge styling helper
  const getStatusBadge = (st) => {
    switch (st) {
      case 'open':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'in_progress':
        return 'bg-sky-50 text-sky-700 border-sky-200/80';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Priority badge styling helper
  const getPriorityBadge = (pr) => {
    switch (pr) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200/80';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'low':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-sm transition-all animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Support & Komunikasi Platform
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
              Seksi 3.8
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pusat kendali tiket bantuan, siaran pengumuman massal, dan log komunikasi lintas pengguna
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
          >
            <DownloadIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDirectNotif(null)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
          >
            <UsersIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Notifikasi Langsung</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>+ Broadcast Pengumuman</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchStats();
              if (subTab === 'inbox') fetchTickets();
              if (subTab === 'canned') fetchCanned();
              if (subTab === 'broadcast') fetchBroadcasts();
              if (subTab === 'logs') fetchCommLogs();
              triggerToast('success', 'Data support berhasil diperbarui');
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            title="Segarkan Data"
            aria-label="Segarkan Data"
          >
            <RefreshCwIcon className={`w-4 h-4 ${ticketsLoading || statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Tickets */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tiket Aktif Berjalan</span>
            <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <MessageCircleIcon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {(stats?.open_tickets || 0) + (stats?.in_progress_tickets || 0)}
            </span>
            <span className="text-[11px] font-semibold text-sky-600">
              {stats?.in_progress_tickets || 0} sedang diproses
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total seluruh tiket aktif dalam penanganan tim
          </p>
        </div>

        {/* Card 2: Waiting Response */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Menunggu Balasan</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ClockIcon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats?.open_tickets || 0}
            </span>
            {stats?.high_priorityCount > 0 && (
              <span className="text-[11px] font-bold text-rose-600">
                {stats.high_priority_count} prioritas tinggi
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tiket baru yang belum menerima respon admin
          </p>
        </div>

        {/* Card 3: Resolved Today */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Selesai Hari Ini</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircleIcon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats?.resolved_today || 0}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">
              dari total {stats?.total_tickets || 0} tiket
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Masalah pengguna yang berhasil diselesaikan
          </p>
        </div>

        {/* Card 4: Avg Response Time & CSAT */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rata-rata Respon & Skor</span>
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ClockIcon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats?.avg_response_time_hours || 1.8}j
            </span>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
              CSAT {stats?.customer_satisfaction ? Number(stats.customer_satisfaction).toFixed(1) : '4.9'}/5.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Indikator kecepatan respon dan kepuasan pengguna
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setSubTab('inbox')}
            className={`pb-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden ${
              subTab === 'inbox'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>Kotak Masuk Tiket</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                subTab === 'inbox' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {countsByStatus.all || totalTickets}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('canned')}
            className={`pb-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden ${
              subTab === 'canned'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>Template Balasan (Canned)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                subTab === 'canned' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {cannedList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('broadcast')}
            className={`pb-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden ${
              subTab === 'broadcast'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>Broadcast Pengumuman</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                subTab === 'broadcast' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {broadcasts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('logs')}
            className={`pb-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden ${
              subTab === 'logs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>Log Komunikasi & Audit</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: KOTAK MASUK TIKET */}
      {/* ========================================================================= */}
      {subTab === 'inbox' && (
        <div className="space-y-4">
          {/* Status Tab Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Semua Tiket', count: countsByStatus.all ?? totalTickets },
              { id: 'open', label: 'Open (Menunggu)', count: countsByStatus.open ?? 0 },
              { id: 'in_progress', label: 'Sedang Diproses', count: countsByStatus.in_progress ?? 0 },
              { id: 'resolved', label: 'Selesai', count: countsByStatus.resolved ?? 0 },
              { id: 'closed', label: 'Ditutup', count: countsByStatus.closed ?? 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nomor tiket, subjek, nama atau email pelapor..."
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="billing">Tagihan & Langganan</option>
                <option value="domain">Domain & DNS</option>
                <option value="technical">Teknis & Hosting</option>
                <option value="feature">Saran Fitur</option>
                <option value="bug">Laporan Bug</option>
                <option value="account">Akun Pengguna</option>
                <option value="other">Lainnya</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Prioritas</option>
                <option value="urgent">Mendesak (Urgent)</option>
                <option value="high">Tinggi (High)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="low">Rendah (Low)</option>
              </select>

              {/* Sort Filter */}
              <select
                value={sortFilter}
                onChange={(e) => {
                  setSortFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden cursor-pointer"
              >
                <option value="newest">Terkini Dibuat</option>
                <option value="updated_desc">Terakhir Diperbarui</option>
                <option value="priority_desc">Prioritas Tertinggi</option>
                <option value="oldest">Terlama Dibuat</option>
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            {ticketsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Memuat daftar tiket masuk...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <MessageCircleIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Tidak ada tiket ditemukan</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tidak ada tiket bantuan yang sesuai dengan filter atau kata kunci pencarian Anda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4.5">Nomor Tiket</th>
                      <th className="py-3.5 px-4.5">Pelapor</th>
                      <th className="py-3.5 px-4.5">Subjek & Deskripsi</th>
                      <th className="py-3.5 px-4.5">Kategori</th>
                      <th className="py-3.5 px-4.5">Prioritas</th>
                      <th className="py-3.5 px-4.5">Status</th>
                      <th className="py-3.5 px-4.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tickets.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => handleOpenTicket(t.id)}
                      >
                        <td className="py-3.5 px-4.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                            {t.ticket_number}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(t.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>

                        <td className="py-3.5 px-4.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px] shrink-0">
                              {t.user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {t.user?.full_name || 'Pengguna'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {t.user?.email || t.user_id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4.5 max-w-xs sm:max-w-md">
                          <p className="font-bold text-slate-900 truncate">{t.subject}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {t.description}
                          </p>
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                            {t.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPriorityBadge(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setStatusModalTicket(t);
                                setIsStatusModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
                            >
                              Status
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenTicket(t.id)}
                              className="px-3 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
                            >
                              Balas
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4.5 py-3.5 border-t border-slate-100 bg-slate-50/50 text-xs">
              <span className="text-slate-500">
                Menampilkan <strong>{tickets.length}</strong> dari <strong>{totalTickets}</strong> tiket
              </span>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={page <= 1 || ticketsLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.25 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <span className="px-2.5 text-slate-500 font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || ticketsLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.25 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TEMPLATE BALASAN (CANNED RESPONSES) */}
      {/* ========================================================================= */}
      {subTab === 'canned' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={cannedSearch}
                onChange={(e) => setCannedSearch(e.target.value)}
                placeholder="Cari template balasan berdasarkan judul, shortcut, atau isi..."
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={cannedCategory}
                onChange={(e) => setCannedCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="general">Umum (General)</option>
                <option value="domain">Domain & DNS</option>
                <option value="billing">Tagihan & Invoice</option>
                <option value="technical">Teknis</option>
                <option value="feature">Fitur Pro</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSelectedCannedItem(null);
                  setIsCannedModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>+ Buat Template</span>
              </button>
            </div>
          </div>

          {cannedLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
              <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Memuat template balasan cepat...</p>
            </div>
          ) : cannedList.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="text-sm font-bold text-slate-900">Belum ada template balasan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Buat template balasan cepat untuk mempercepat penanganan tiket pengguna.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cannedList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          {item.shortcut && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {item.shortcut}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1 block">
                          Kategori: {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCanned(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Salin Isi Template"
                          aria-label="Salin Template"
                        >
                          {copiedCannedId === item.id ? (
                            <CheckIcon className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <CopyIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCannedItem(item);
                            setIsCannedModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCanned(item.id, item.title)}
                          className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Template"
                          aria-label="Hapus Template"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 line-clamp-4 whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Oleh: {item.created_by || 'Admin'}</span>
                    <span>
                      Diperbarui:{' '}
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: BROADCAST PENGUMUMAN */}
      {/* ========================================================================= */}
      {subTab === 'broadcast' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Riwayat Siaran Pengumuman Massal</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar broadcast yang dikirimkan ke pengguna berdasarkan segmen
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>+ Broadcast Baru</span>
              </button>
            </div>

            {broadcastsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Memuat riwayat broadcast...</p>
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Belum ada siaran broadcast</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Kirimkan pengumuman penting kepada seluruh tenant atau segmen tertentu.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4.5">Waktu Kirim</th>
                      <th className="py-3.5 px-4.5">Judul & Pesan</th>
                      <th className="py-3.5 px-4.5">Target Segmen</th>
                      <th className="py-3.5 px-4.5">Saluran</th>
                      <th className="py-3.5 px-4.5">Penerima</th>
                      <th className="py-3.5 px-4.5">Pengirim</th>
                      <th className="py-3.5 px-4.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {broadcasts.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(b.sent_at || b.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4.5 max-w-md">
                          <p className="font-bold text-slate-900">{b.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {b.message}
                          </p>
                          {b.action_url && (
                            <span className="text-[10px] text-sky-600 font-mono mt-1 block">
                              Aksi: {b.action_url}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                            Segmen: {b.target_segment}
                          </span>
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap font-medium text-slate-600">
                          {b.channel === 'both'
                            ? 'In-App & Email'
                            : b.channel === 'email'
                            ? 'Email Transaksional'
                            : 'Notifikasi In-App'}
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap">
                          <strong className="text-slate-900">{b.sent_count}</strong> pengguna
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {b.created_by || 'Admin'}
                        </td>

                        <td className="py-3.5 px-4.5 text-right whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            TERKIRIM
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: LOG KOMUNIKASI & AUDIT */}
      {/* ========================================================================= */}
      {subTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Jejak Audit Komunikasi Platform</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat seluruh komunikasi keluar, balasan tiket, siaran broadcast, dan notifikasi personal
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Tipe Aksi</option>
                <option value="broadcast">Broadcast Pengumuman</option>
                <option value="direct_notification">Notifikasi Langsung</option>
                <option value="ticket_reply">Balasan Tiket</option>
                <option value="status_change">Perubahan Status</option>
              </select>

              <select
                value={logChannelFilter}
                onChange={(e) => setLogChannelFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Saluran</option>
                <option value="in_app">In-App</option>
                <option value="email">Email</option>
                <option value="dashboard_thread">Thread Tiket</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            {logsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Memuat log komunikasi...</p>
              </div>
            ) : commLogs.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Belum ada riwayat komunikasi</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Aktivitas komunikasi admin akan otomatis tercatat di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4.5">Waktu Kejadian</th>
                      <th className="py-3.5 px-4.5">Aksi</th>
                      <th className="py-3.5 px-4.5">Penerima / Target</th>
                      <th className="py-3.5 px-4.5">Subjek / Ringkasan</th>
                      <th className="py-3.5 px-4.5">Saluran</th>
                      <th className="py-3.5 px-4.5">Admin Pelaksana</th>
                      <th className="py-3.5 px-4.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {commLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                            {log.action_type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap font-mono text-[11px] text-slate-800">
                          {log.recipient}
                        </td>

                        <td className="py-3.5 px-4.5 max-w-sm">
                          <p className="font-bold text-slate-900 truncate">{log.subject}</p>
                          {log.details_json && (
                            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                              {log.details_json}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap text-slate-600 font-medium">
                          {log.channel}
                        </td>

                        <td className="py-3.5 px-4.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                          {log.admin_email}
                        </td>

                        <td className="py-3.5 px-4.5 text-right whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-Over Drawer Detail Tiket */}
      <SupportDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ticketId={selectedTicketId}
        token={token}
        onTicketUpdated={() => {
          fetchTickets();
          fetchStats();
        }}
        onOpenDirectNotif={(targetUser) => handleOpenDirectNotif(targetUser)}
      />

      {/* Modal Broadcast Pengumuman */}
      <BroadcastAnnouncementModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSuccess={() => {
          triggerToast('success', 'Siaran pengumuman berhasil diterbitkan ke pengguna');
          fetchStats();
          if (subTab === 'broadcast') fetchBroadcasts();
          if (subTab === 'logs') fetchCommLogs();
        }}
        token={token}
      />

      {/* Modal Kirim Notifikasi Langsung */}
      <DirectNotificationModal
        isOpen={isDirectNotifModalOpen}
        onClose={() => setIsDirectNotifModalOpen(false)}
        onSuccess={() => {
          triggerToast('success', 'Notifikasi langsung berhasil dikirimkan ke tenant');
          if (subTab === 'logs') fetchCommLogs();
        }}
        targetUser={directNotifTargetUser}
        token={token}
      />

      {/* Modal Tambah / Edit Template Balasan */}
      <AddEditCannedResponseModal
        isOpen={isCannedModalOpen}
        onClose={() => setIsCannedModalOpen(false)}
        onSuccess={() => {
          triggerToast('success', 'Template balasan berhasil disimpan');
          fetchCanned();
        }}
        initialItem={selectedCannedItem}
        token={token}
      />

      {/* Modal Ubah Status & Prioritas Tiket */}
      <UpdateTicketStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={() => {
          triggerToast('success', 'Status dan prioritas tiket berhasil diperbarui');
          fetchTickets();
          fetchStats();
        }}
        ticket={statusModalTicket}
        token={token}
      />
    </div>
  );
}
