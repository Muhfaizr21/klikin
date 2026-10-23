import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SearchIcon,
  ExternalLinkIcon,
  VerifiedBadgeIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  BanIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  DownloadIcon,
  RefreshCwIcon,
  UsersIcon,
  SparklesIcon,
  MoreHorizontalIcon,
  CopyIcon,
  CheckIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from '../Icons';
import UserDetailDrawer from './UserDetailDrawer';
import {
  EditUserModal,
  SuspendUserModal,
  BanUserModal,
  DeleteUserModal,
  ImpersonateModal,
} from './UserActionModals';
import { navigateTo } from '../../utils/navigation';
import { API_BASE } from '../../lib/api';

export default function UserDirectoryTable({ token, onRefresh: onParentRefresh }) {
  // State for user listing
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    pro_users: 0,
    suspended_users: 0,
    banned_users: 0,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 1,
  });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' (all), 'active', 'suspended', 'banned'
  const [planFilter, setPlanFilter] = useState(''); // '' (all), 'pro', 'free'
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'oldest', 'views', 'clicks', 'name'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // UI state
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Active Modals & Drawer state
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState(null);
  const [selectedUserForBan, setSelectedUserForBan] = useState(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  const [selectedUserForImpersonate, setSelectedUserForImpersonate] = useState(null);

  const searchInputRef = useRef(null);

  // Fetch users with query params
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortOption,
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (planFilter) params.append('plan', planFilter);

      const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memuat direktori pengguna');
      }

      setUsers(json.data.users || []);
      if (json.data.stats) setStats(json.data.stats);
      if (json.data.pagination) setPagination(json.data.pagination);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, sortOption, search, statusFilter, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Input Debounce
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // reset to page 1 on new search
  };

  // Close action menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Quick Action Handlers
  const handleToggleVerification = async (user) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengubah status verifikasi');
      }

      setFeedback({ type: 'success', text: data.message });
      fetchUsers();
      onParentRefresh?.();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleUnsuspend = async (user) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/unsuspend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengaktifkan kembali akun');
      }

      setFeedback({ type: 'success', text: `Akun @${user.username} berhasil diaktifkan kembali.` });
      fetchUsers();
      onParentRefresh?.();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleUnban = async (user) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/unban`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membatalkan blokir akun');
      }

      setFeedback({ type: 'success', text: `Status blokir @${user.username} telah dicabut.` });
      fetchUsers();
      onParentRefresh?.();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleImpersonateSuccess = (data) => {
    // 1. Backup current super admin session to localStorage
    const currentAdminUser = localStorage.getItem('klikin_user');
    const currentAdminToken = localStorage.getItem('klikin_token');
    if (currentAdminToken) {
      localStorage.setItem('klikin_impersonating_admin', JSON.stringify({
        token: currentAdminToken,
        user: currentAdminUser ? JSON.parse(currentAdminUser) : null,
      }));
    }

    // 2. Set impersonated user session
    localStorage.setItem('klikin_token', data.token);
    localStorage.setItem('klikin_user', JSON.stringify(data.user));

    // 3. Redirect to tenant owner workspace
    navigateTo('/owner/dashboard');
    window.location.reload();
  };

  const handleExportCSV = async () => {
    try {
      setFeedback({ type: 'info', text: 'Menyiapkan ekspor file CSV...' });
      const res = await fetch(`${API_BASE}/admin/users/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Gagal mengunduh CSV data pengguna');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klikin-direktori-pengguna-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setFeedback({ type: 'success', text: 'File CSV direktori pengguna berhasil diunduh.' });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 1. TOP METRIC CARDS (Anti-Slop Enterprise Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="text-[11px] text-slate-400 font-medium">Total Akun Terdaftar</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.total_users}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Platform User Base</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="text-[11px] text-slate-400 font-medium">Akun Aktif</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{stats.active_users}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Status Normal</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="text-[11px] text-slate-400 font-medium">Klikin Pro (Premium)</div>
          <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <SparklesIcon className="w-4 h-4 text-emerald-600" />
            <span>{stats.pro_users}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pelanggan Berbayar</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="text-[11px] text-slate-400 font-medium">Ditangguhkan</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats.suspended_users}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Karantina Sementara</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400 font-medium">Diblokir (Banned)</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{stats.banned_users}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Blacklist Permanen</div>
        </div>
      </div>

      {/* 2. FILTER & TOOLBAR CARD */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Row 1: Search & Major Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari pengguna berdasarkan nama, username, email, atau slug link bio..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Buttons: CSV Export & Refresh */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              <DownloadIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                fetchUsers();
                onParentRefresh?.();
              }}
              title="Segarkan data direktori"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 2: Status Pills, Plan Pills, & Sort Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Status & Plan Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
            {[
              { id: '', label: 'Semua Status' },
              { id: 'active', label: 'Aktif' },
              { id: 'suspended', label: 'Ditangguhkan' },
              { id: 'banned', label: 'Diblokir' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setStatusFilter(st.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                }`}
              >
                {st.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Paket:</span>
            {[
              { id: '', label: 'Semua Paket' },
              { id: 'pro', label: 'Klikin Pro' },
              { id: 'free', label: 'Free Tier' },
            ].map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => {
                  setPlanFilter(pl.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  planFilter === pl.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                }`}
              >
                {pl.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Urutkan:</span>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              <option value="newest">Terbaru Terdaftar</option>
              <option value="oldest">Terlama Terdaftar</option>
              <option value="views">Kunjungan Terbanyak</option>
              <option value="clicks">Klik Terbanyak</option>
              <option value="name">Nama (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. USER DATA TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold">
                <th className="py-3 px-4">Pengguna & Akun</th>
                <th className="py-3 px-4">Kontak & Email</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Paket & Peran</th>
                <th className="py-3 px-4">Halaman Bio & Performa</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data pengguna...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-1">
                    <UsersIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <div className="font-semibold text-slate-700 text-sm">Tidak Ditemukan Pengguna</div>
                    <p className="text-xs">Ubah kata kunci pencarian atau bersihkan filter yang aktif.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === 'SUPER_ADMIN';
                  const initial = (u.full_name?.charAt(0) || u.username?.charAt(0) || 'U').toUpperCase();
                  const isMenuOpen = activeMenuId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Pengguna & Identitas */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.username}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center ${
                                  isAdmin
                                    ? 'bg-purple-100 text-purple-700 font-mono'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {initial}
                              </div>
                            )}
                            {u.is_verified && (
                              <div
                                title="Terverifikasi Resmi"
                                className="absolute -bottom-1 -right-1 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-white ring-2 ring-white"
                              >
                                <VerifiedBadgeIcon className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                              <span>{u.full_name || u.username}</span>
                              {u.is_verified && (
                                <VerifiedBadgeIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Kontak & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-600 text-[11px]">
                          <span>{u.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.email, `email_${u.id}`)}
                            title="Salin email"
                            className="p-1 text-slate-300 hover:text-slate-600 rounded transition-colors cursor-pointer"
                          >
                            {copiedId === `email_${u.id}` ? (
                              <CheckIcon className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <CopyIcon className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {u.phone_number ? (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.phone_number}</div>
                        ) : (
                          <div className="text-[10px] text-slate-300">Tidak ada nomor HP</div>
                        )}
                      </td>

                      {/* 3. Status Akun */}
                      <td className="py-3.5 px-4">
                        {u.status === 'banned' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Diblokir
                          </span>
                        ) : u.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Ditangguhkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        )}
                      </td>

                      {/* 4. Paket & Peran */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAdmin
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isAdmin && <ShieldCheckIcon className="w-3 h-3 text-purple-600" />}
                            {u.role}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_pro
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border border-slate-200/70'
                            }`}
                          >
                            {u.is_pro && <SparklesIcon className="w-2.5 h-2.5 text-emerald-600" />}
                            {u.is_pro ? 'Klikin Pro' : 'Free Tier'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Halaman Bio & Performa */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {u.bio_pages && u.bio_pages.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {u.bio_pages.map((p) => (
                                <a
                                  key={p.id}
                                  href={`/${p.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100 px-2 py-0.5 rounded-lg transition-colors"
                                >
                                  <span>/{p.slug}</span>
                                  <ExternalLinkIcon className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300 font-mono text-[11px]">Belum ada link bio</span>
                          )}

                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{(u.total_views || 0).toLocaleString()} views</span>
                            <span>•</span>
                            <span>{(u.total_clicks || 0).toLocaleString()} clicks</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-600">{u.ctr || 0}% CTR</span>
                          </div>
                        </div>
                      </td>

                      {/* 6. Aksi (Drop-down & Direct Action Buttons) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="relative inline-flex items-center gap-1 user-action-menu-container">
                          {/* Quick View Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDetail(u.id)}
                            title="Lihat detail lengkap pengguna"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Action Dropdown Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : u.id);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                          >
                            <MoreHorizontalIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Dropdown Menu Modal */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-40 text-left animate-in fade-in duration-100">
                              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                Menu Tindakan Akun
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForDetail(u.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <EyeIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>Detail Akun</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForEdit(u);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <PencilIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Profil & Password</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleVerification(u);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <VerifiedBadgeIcon className={`w-3.5 h-3.5 ${u.is_verified ? 'text-sky-600' : 'text-slate-400'}`} />
                                <span>{u.is_verified ? 'Cabut Centang Biru' : 'Beri Centang Biru'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForImpersonate(u);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer border-t border-slate-100"
                              >
                                <UsersIcon className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Masuk sebagai User</span>
                              </button>

                              {/* Suspend / Unsuspend */}
                              {u.status === 'suspended' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUnsuspend(u);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckIcon className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Aktifkan Kembali</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUserForSuspend(u);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <ShieldAlertIcon className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Tangguhkan (Suspend)</span>
                                </button>
                              )}

                              {/* Ban / Unban */}
                              {u.status === 'banned' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUnban(u);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Cabut Status Blokir</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUserForBan(u);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <BanIcon className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Blokir Permanen (Ban)</span>
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForDelete(u);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-2 cursor-pointer border-t border-slate-100"
                              >
                                <TrashIcon className="w-3.5 h-3.5 text-rose-500" />
                                <span>Hapus Akun...</span>
                              </button>
                            </div>
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

        {/* 4. PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Menampilkan{' '}
              <strong className="text-slate-900 font-bold">
                {users.length > 0 ? (pagination.current_page - 1) * pagination.limit + 1 : 0}
              </strong>{' '}
              sampai{' '}
              <strong className="text-slate-900 font-bold">
                {Math.min(pagination.current_page * pagination.limit, pagination.total_items)}
              </strong>{' '}
              dari <strong className="text-slate-900 font-bold">{pagination.total_items}</strong> akun
            </span>

            <div className="flex items-center gap-1.5">
              <span>Per halaman:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={pagination.current_page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <ArrowLeftIcon className="w-3 h-3" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 shadow-2xs">
              Halaman {pagination.current_page} dari {pagination.total_pages || 1}
            </span>

            <button
              type="button"
              disabled={pagination.current_page >= pagination.total_pages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>Selanjutnya</span>
              <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. USER DETAIL DRAWER (6 TABS) */}
      <UserDetailDrawer
        userId={selectedUserForDetail}
        token={token}
        isOpen={!!selectedUserForDetail}
        onClose={() => setSelectedUserForDetail(null)}
        onEditUser={(u) => {
          setSelectedUserForDetail(null);
          setSelectedUserForEdit(u);
        }}
        onImpersonate={(u) => {
          setSelectedUserForDetail(null);
          setSelectedUserForImpersonate(u);
        }}
        onToggleVerification={(u) => handleToggleVerification(u)}
        onRefreshParent={() => {
          fetchUsers();
          onParentRefresh?.();
        }}
      />

      {/* 6. EDIT MODAL */}
      <EditUserModal
        user={selectedUserForEdit}
        token={token}
        isOpen={!!selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        onSuccess={(msg) => {
          setFeedback({ type: 'success', text: msg });
          fetchUsers();
          onParentRefresh?.();
          setTimeout(() => setFeedback(null), 3500);
        }}
      />

      {/* 7. SUSPEND MODAL */}
      <SuspendUserModal
        user={selectedUserForSuspend}
        token={token}
        isOpen={!!selectedUserForSuspend}
        onClose={() => setSelectedUserForSuspend(null)}
        onSuccess={(msg) => {
          setFeedback({ type: 'success', text: msg });
          fetchUsers();
          onParentRefresh?.();
          setTimeout(() => setFeedback(null), 3500);
        }}
      />

      {/* 8. BAN MODAL */}
      <BanUserModal
        user={selectedUserForBan}
        token={token}
        isOpen={!!selectedUserForBan}
        onClose={() => setSelectedUserForBan(null)}
        onSuccess={(msg) => {
          setFeedback({ type: 'success', text: msg });
          fetchUsers();
          onParentRefresh?.();
          setTimeout(() => setFeedback(null), 3500);
        }}
      />

      {/* 9. DELETE MODAL */}
      <DeleteUserModal
        user={selectedUserForDelete}
        token={token}
        isOpen={!!selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        onSuccess={(msg) => {
          setFeedback({ type: 'success', text: msg });
          fetchUsers();
          onParentRefresh?.();
          setTimeout(() => setFeedback(null), 3500);
        }}
      />

      {/* 10. IMPERSONATE MODAL */}
      <ImpersonateModal
        user={selectedUserForImpersonate}
        token={token}
        isOpen={!!selectedUserForImpersonate}
        onClose={() => setSelectedUserForImpersonate(null)}
        onImpersonateSuccess={handleImpersonateSuccess}
      />
    </div>
  );
}
