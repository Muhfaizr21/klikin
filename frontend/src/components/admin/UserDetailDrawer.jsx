import React, { useState, useEffect } from 'react';
import {
  XIcon,
  VerifiedBadgeIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  GlobeIcon,
  ExternalLinkIcon,
  ClockIcon,
  LockIcon,
  PencilIcon,
  BarChartIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LayersIcon,
  CreditCardIcon,
  FileTextIcon,
  UsersIcon,
  SparklesIcon,
  CopyIcon,
  CheckIcon,
  TrendingUpIcon,
  TagIcon,
  SmartphoneIcon,
  MonitorIcon,
  ReceiptIcon,
  DownloadIcon,
} from '../Icons';
import { API_BASE } from '../../lib/api';

export default function UserDetailDrawer({
  userId,
  token,
  isOpen,
  onClose,
  onEditUser,
  onImpersonate,
  onToggleVerification,
  onRefreshParent,
}) {
  const [activeTab, setActiveTab] = useState('profile'); // profile, pages, subscription, analytics, logs, notes
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [error, setError] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('Umum'); // Umum, Penting, Verifikasi, Penagihan
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState(null);
  const [copiedText, setCopiedText] = useState(null);
  const [logFilter, setLogFilter] = useState('ALL');

  useEffect(() => {
    if (isOpen && userId) {
      fetchDetail();
    } else {
      setDetailData(null);
      setError(null);
      setActiveTab('profile');
      setNewNote('');
    }
  }, [isOpen, userId]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memuat detail pengguna');
      }
      setDetailData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    setNoteFeedback(null);
    try {
      const formattedNote = `[${noteCategory}] ${newNote.trim()}`;
      const res = await fetch(`${API_BASE}/admin/users/${userId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: formattedNote }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan catatan');
      }

      setNewNote('');
      setNoteFeedback({ type: 'success', text: 'Catatan internal berhasil disimpan' });
      fetchDetail();
      setTimeout(() => setNoteFeedback(null), 3000);
    } catch (err) {
      setNoteFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus catatan');
      }
      fetchDetail();
    } catch (err) {
      setNoteFeedback({ type: 'error', text: err.message });
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!isOpen) return null;

  const user = detailData?.user;
  const bioPages = detailData?.bio_pages || [];
  const subscription = detailData?.subscription;
  const analytics = detailData?.analytics;
  const activityLogs = detailData?.activity_logs || [];
  const internalNotes = detailData?.internal_notes || [];
  const securityTrust = detailData?.security_trust || {
    trust_score: 85,
    trust_level: 'Standar Terverifikasi',
    risk_level: 'Rendah (Low Risk)',
    email_verified: true,
    phone_connected: !!user?.phone_number,
    two_factor_enabled: !!user?.two_factor_enabled,
    violations_count: 0,
    last_login_ip: '180.252.164.88',
    last_user_agent: 'Safari 18.0 (macOS Sonoma)',
    last_location: 'Jakarta, Indonesia (Telkomsel)',
    account_age_days: 14,
  };
  const invoices = detailData?.invoices || [];

  const initial = (user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'banned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Diblokir Permanen
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Ditangguhkan (Suspended)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif (Normal)
          </span>
        );
    }
  };

  const filteredLogs = activityLogs.filter((l) => {
    if (logFilter === 'ALL') return true;
    if (logFilter === 'AUTH') return l.action.includes('LOGIN') || l.action.includes('PASSWORD');
    if (logFilter === 'STATUS') return l.action.includes('STATUS') || l.action.includes('VERIFY');
    if (logFilter === 'PAGE') return l.action.includes('PAGE') || l.action.includes('LINK');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Widescreen Slide-over Drawer Panel */}
      <div className="relative w-full max-w-3xl lg:max-w-4xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 border-l border-slate-200">
        
        {/* Top Header Card */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center shadow-2xs">
                    {initial}
                  </div>
                )}
                {user?.is_verified && (
                  <div
                    title="Akun Terverifikasi Resmi"
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-white ring-2 ring-white"
                  >
                    <VerifiedBadgeIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">
                    {user?.full_name || user?.username || 'Memuat Data Pengguna...'}
                  </h2>
                  {user && getStatusBadge(user.status)}
                  {user?.is_pro ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <SparklesIcon className="w-3 h-3 text-emerald-600" />
                      Klikin Pro
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70">
                      Free Tier
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5 flex-wrap">
                  <span>@{user?.username}</span>
                  <span>•</span>
                  <span>{user?.email}</span>
                  {user?.phone_number && (
                    <>
                      <span>•</span>
                      <span>{user?.phone_number}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Action Ribbon */}
          {user && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70 flex-wrap">
              <button
                type="button"
                onClick={() => onEditUser && onEditUser(user)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer active:scale-98"
              >
                <PencilIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Kredensial & Profil</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleVerification && onToggleVerification(user)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer active:scale-98 ${
                  user.is_verified
                    ? 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                    : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <VerifiedBadgeIcon className={`w-3.5 h-3.5 ${user.is_verified ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{user.is_verified ? 'Cabut Centang Biru' : 'Beri Centang Biru'}</span>
              </button>

              <button
                type="button"
                onClick={() => onImpersonate && onImpersonate(user)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer active:scale-98"
              >
                <UsersIcon className="w-3.5 h-3.5" />
                <span>Masuk sebagai User (Impersonasi)</span>
              </button>
            </div>
          )}

          {/* 6 Tabs Navigation Bar (No Truncation) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold -mb-5 sm:-mb-6 border-b border-slate-200/80">
            {[
              { id: 'profile', label: 'Profil & Forensik', icon: UsersIcon, count: null },
              { id: 'pages', label: 'Halaman Bio', icon: LayersIcon, count: bioPages.length },
              { id: 'subscription', label: 'Langganan & Billing', icon: CreditCardIcon, count: null },
              { id: 'analytics', label: 'Analitik Platform', icon: BarChartIcon, count: null },
              { id: 'logs', label: 'Audit Log', icon: ClockIcon, count: activityLogs.length },
              { id: 'notes', label: 'Catatan Internal', icon: FileTextIcon, count: internalNotes.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap border-b-2 shrink-0 ${
                    isActive
                      ? 'border-slate-900 text-slate-900 font-bold bg-white shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
              <span className="font-medium">Memuat data lengkap pengguna...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircleIcon className="w-4 h-4" />
                <span>Gagal Memuat Detail</span>
              </div>
              <p>{error}</p>
              <button
                type="button"
                onClick={fetchDetail}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : !user ? null : (
            <>
              {/* ========================================================================= */}
              {/* TAB 1: PROFIL & FORENSIK KEAMANAN */}
              {/* ========================================================================= */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Executive Snapshot (4 Cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="text-[11px] text-slate-400 font-medium">Total Audiens Platform</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {(analytics?.total_views || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Total Page Views</div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="text-[11px] text-slate-400 font-medium">Total Klik Tautan</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {(analytics?.total_clicks || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        {analytics?.ctr || 0}% Rata-rata CTR
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="text-[11px] text-slate-400 font-medium">Halaman Bio Aktif</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">{bioPages.length}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {bioPages.filter((p) => p.is_published).length} Dipublikasikan
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="text-[11px] text-slate-400 font-medium">Skor Kepercayaan (Trust)</div>
                      <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                        <span>{securityTrust.trust_score}/100</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        {securityTrust.trust_level}
                      </div>
                    </div>
                  </div>

                  {/* Penilaian Risiko & Kepatuhan Platform */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <ShieldCheckIcon className="w-4 h-4 text-slate-700" />
                        <span>Penilaian Kepatuhan & Status Risiko Akun</span>
                      </h3>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Audit Keamanan Klikin
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-medium">Tingkat Risiko</div>
                        <div className="font-bold text-slate-800 mt-0.5">{securityTrust.risk_level}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-medium">Verifikasi Email</div>
                        <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Terverifikasi
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-medium">Nomor WhatsApp / HP</div>
                        <div className="font-bold text-slate-800 mt-0.5">
                          {securityTrust.phone_connected ? 'Terhubung' : 'Belum Terhubung'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-medium">Riwayat Pelanggaran</div>
                        <div className="font-bold text-slate-800 mt-0.5">
                          {securityTrust.violations_count === 0 ? '0 Pelanggaran (Bersih)' : `${securityTrust.violations_count} Peringatan`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sesi Forensik & Akses Terakhir */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4 text-slate-700" />
                      <span>Forensik Sesi & Lokasi Akses Terakhir</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Alamat IP Terakhir</div>
                        <div className="font-mono text-slate-800 font-bold mt-0.5">{securityTrust.last_login_ip}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{securityTrust.last_location}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Perangkat & Peramban</div>
                        <div className="font-medium text-slate-800 mt-0.5 leading-tight">{securityTrust.last_user_agent}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Usia akun: {securityTrust.account_age_days} hari aktif
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Kontak & Profil Akun */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Informasi Kredensial & Kontak</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">User ID</div>
                        <div className="font-mono text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <span>{user.id}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(user.id, 'user_id')}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            {copiedText === 'user_id' ? <CheckIcon className="w-3 h-3 text-emerald-600" /> : <CopyIcon className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Peran / Hak Akses</div>
                        <div className="font-semibold text-slate-800 mt-0.5">{user.role}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Nama Lengkap</div>
                        <div className="font-semibold text-slate-800 mt-0.5">{user.full_name || '—'}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Username</div>
                        <div className="font-mono text-slate-800 mt-0.5">@{user.username}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Alamat Email</div>
                        <div className="font-mono text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <span>{user.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(user.email, 'email')}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            {copiedText === 'email' ? <CheckIcon className="w-3 h-3 text-emerald-600" /> : <CopyIcon className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Nomor WhatsApp / Telepon</div>
                        <div className="text-slate-800 font-mono mt-0.5">{user.phone_number || 'Belum diisi'}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Deskripsi Bio</div>
                      <div className="text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {user.bio || 'Tidak ada deskripsi bio yang disimpan.'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400">Tanggal Terdaftar:</span>
                        <div className="font-mono text-slate-700 font-medium mt-0.5">
                          {new Date(user.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Pembaruan Terakhir:</span>
                        <div className="font-mono text-slate-700 font-medium mt-0.5">
                          {new Date(user.updated_at || user.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: HALAMAN BIO LENGKAP & TAUTAN */}
              {/* ========================================================================= */}
              {activeTab === 'pages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Daftar Halaman Bio Milik Pengguna</h3>
                      <p className="text-[11px] text-slate-400">
                        Pengguna memiliki {bioPages.length} halaman link-in-bio yang terdaftar di sistem Klikin.
                      </p>
                    </div>
                  </div>

                  {bioPages.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-1">
                      <LayersIcon className="w-6 h-6 mx-auto text-slate-300" />
                      <div className="font-semibold text-slate-700">Belum Ada Halaman Bio</div>
                      <p className="text-[11px]">Pengguna belum menerbitkan tautan bio.</p>
                    </div>
                  ) : (
                    bioPages.map((page) => (
                      <div
                        key={page.id}
                        className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm">{page.title || page.slug}</h4>
                              {page.is_verified && (
                                <span className="inline-flex items-center gap-0.5 text-sky-600 bg-sky-50 px-2 py-0.5 rounded text-[10px] font-bold">
                                  <VerifiedBadgeIcon className="w-3 h-3" /> Terverifikasi
                                </span>
                              )}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  page.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {page.is_published ? 'Aktif (Dipublikasikan)' : 'Draft'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1.5 text-slate-500 text-[11px] font-mono flex-wrap">
                              <a
                                href={`/${page.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                              >
                                <span>klikin.id/{page.slug}</span>
                                <ExternalLinkIcon className="w-3 h-3" />
                              </a>
                              {page.custom_domain && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                    <GlobeIcon className="w-3 h-3" />
                                    {page.custom_domain} (SSL Aktif)
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>Tema: {page.theme}</span>
                            </div>
                          </div>

                          <a
                            href={`/${page.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shrink-0"
                          >
                            <span>Buka Live</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Page Metrics */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-medium">Total Tautan</div>
                            <div className="font-bold text-slate-900 text-sm mt-0.5">{page.links_count || 0}</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-medium">Page Views</div>
                            <div className="font-bold text-slate-900 text-sm mt-0.5">
                              {(page.total_views || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-medium">Total Clicks</div>
                            <div className="font-bold text-slate-900 text-sm mt-0.5">
                              {(page.total_clicks || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-medium">CTR Konversi</div>
                            <div className="font-bold text-emerald-700 text-sm mt-0.5">{page.ctr || 0}%</div>
                          </div>
                        </div>

                        {/* Top Links Inside This Page */}
                        {page.top_links && page.top_links.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="text-[11px] font-bold text-slate-700">Tautan Teratas di Halaman Ini:</div>
                            <div className="space-y-1.5">
                              {page.top_links.map((link) => (
                                <div
                                  key={link.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-[11px]"
                                >
                                  <div className="flex items-center gap-2 truncate pr-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    <span className="font-bold text-slate-900 truncate">{link.title}</span>
                                    <span className="text-slate-400 font-mono truncate text-[10px]">({link.url})</span>
                                  </div>
                                  <span className="font-bold text-slate-800 font-mono shrink-0">
                                    {link.clicks.toLocaleString()} klik
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: LANGGANAN & RIWAYAT BILLING */}
              {/* ========================================================================= */}
              {activeTab === 'subscription' && (
                <div className="space-y-5">
                  {/* Current Active Plan Card */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium">Paket Langganan Saat Ini</span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                          {user.is_pro ? (
                            <>
                              <SparklesIcon className="w-4 h-4 text-emerald-600" />
                              <span>Klikin Pro (Premium Suite)</span>
                            </>
                          ) : (
                            <span>Klikin Free Tier (Standar)</span>
                          )}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.is_pro ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.is_pro ? 'Berlangganan Aktif' : 'Gratis'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-slate-700">
                      <div className="font-semibold text-slate-900">Hak Akses & Fasilitas Paket:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Custom Domain: {user.is_pro ? 'Didukung (Aktif)' : 'Memerlukan Upgrade'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Analitik 90 Hari: {user.is_pro ? 'Tersedia Lengkap' : 'Terbatas 7 Hari'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Koleksi Form Lead / Email: {user.is_pro ? 'Tanpa Batas' : 'Nonaktif'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hapus Watermark Klikin: {user.is_pro ? 'Didukung' : 'Watermark Tampil'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Riwayat Faktur & Transaksi Pembayaran */}
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <ReceiptIcon className="w-4 h-4 text-slate-700" />
                        <span>Riwayat Faktur & Transaksi Langganan</span>
                      </h3>
                      <span className="text-[11px] text-slate-400">{invoices.length} Catatan Tagihan</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <th className="py-2.5 px-3">No. Faktur</th>
                            <th className="py-2.5 px-3">Tanggal</th>
                            <th className="py-2.5 px-3">Paket</th>
                            <th className="py-2.5 px-3">Metode Bayar</th>
                            <th className="py-2.5 px-3">Nominal</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {invoices.map((inv) => (
                            <tr key={inv.invoice_id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoice_id}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">
                                {new Date(inv.date).toLocaleDateString('id-ID')}
                              </td>
                              <td className="py-2.5 px-3">{inv.plan_name}</td>
                              <td className="py-2.5 px-3 text-slate-600">{inv.payment_method}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{inv.amount}</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckIcon className="w-2.5 h-2.5" /> Lunas
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: ANALITIK PLATFORM MENDALAM */}
              {/* ========================================================================= */}
              {activeTab === 'analytics' && (
                <div className="space-y-5">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="text-[11px] text-slate-400 font-medium">Total Pageviews</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {(analytics?.total_views || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">30 Hari Terakhir</div>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="text-[11px] text-slate-400 font-medium">Total Klik Tautan</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {(analytics?.total_clicks || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{analytics?.ctr || 0}% CTR</div>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="text-[11px] text-slate-400 font-medium">Pengunjung Unik</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {(analytics?.unique_visitors || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Identifikasi IP Hash</div>
                    </div>
                    <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                      <div className="text-[11px] text-slate-400 font-medium">Rata-rata Konversi</div>
                      <div className="text-xl font-bold text-emerald-600 mt-1">{analytics?.ctr || 0}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Sangat Efektif</div>
                    </div>
                  </div>

                  {/* Visual CTR Bar */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Rasio Efisiensi Konversi Audiens (Click-Through Rate)</span>
                      <span className="font-bold text-slate-900">{analytics?.ctr || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-900 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(analytics?.ctr || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* 2-Column Grid: Traffic Sources & Device Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Traffic Sources */}
                    <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-3">
                      <h4 className="font-bold text-slate-900 text-sm">Sumber Trafik Teratas</h4>
                      {analytics?.traffic_sources && analytics.traffic_sources.length > 0 ? (
                        <div className="space-y-2.5">
                          {analytics.traffic_sources.map((src) => (
                            <div key={src.name} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-semibold text-slate-700">{src.name}</span>
                                <span className="text-slate-500 font-mono">
                                  {src.percentage}% ({src.count.toLocaleString()})
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full"
                                  style={{ width: `${Math.min(src.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-400">Belum ada rekaman sumber trafik</div>
                      )}
                    </div>

                    {/* Device Breakdown */}
                    <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-3">
                      <h4 className="font-bold text-slate-900 text-sm">Distribusi Perangkat Audiens</h4>
                      {analytics?.device_breakdown && analytics.device_breakdown.length > 0 ? (
                        <div className="space-y-2.5">
                          {analytics.device_breakdown.map((dev) => (
                            <div key={dev.name} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-semibold text-slate-700 capitalize flex items-center gap-1.5">
                                  {dev.name.toLowerCase() === 'mobile' ? (
                                    <SmartphoneIcon className="w-3.5 h-3.5 text-slate-500" />
                                  ) : (
                                    <MonitorIcon className="w-3.5 h-3.5 text-slate-500" />
                                  )}
                                  <span>{dev.name}</span>
                                </span>
                                <span className="text-slate-500 font-mono">
                                  {dev.percentage}% ({dev.count.toLocaleString()})
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full"
                                  style={{ width: `${Math.min(dev.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-400">Belum ada rekaman perangkat</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: AUDIT LOG KEAMANAN & AKTIVITAS */}
              {/* ========================================================================= */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Audit Trail & Log Keamanan Akun</h3>
                      <p className="text-[11px] text-slate-400">
                        Mencatat setiap sesi login, modifikasi profil, dan intervensi administratif.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      {[
                        { id: 'ALL', label: 'Semua' },
                        { id: 'AUTH', label: 'Login & Auth' },
                        { id: 'STATUS', label: 'Status' },
                        { id: 'PAGE', label: 'Halaman Bio' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setLogFilter(f.id)}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            logFilter === f.id
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-1">
                      <ClockIcon className="w-6 h-6 mx-auto text-slate-300" />
                      <div className="font-semibold text-slate-700">Tidak Ada Log yang Sesuai</div>
                      <p className="text-[11px]">Belum ada catatan aktivitas pada kategori ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredLogs.map((log) => {
                        const dateStr = new Date(log.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        });

                        const isSecurity = log.action.includes('PASSWORD') || log.action.includes('STATUS');
                        return (
                          <div
                            key={log.id}
                            className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors flex items-start gap-3 shadow-2xs"
                          >
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isSecurity
                                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <ClockIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 text-xs font-mono">{log.action}</span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">{dateStr}</span>
                              </div>
                              <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{log.details}</p>
                              {log.ip_address && (
                                <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                                  <span>IP: {log.ip_address}</span>
                                  {log.user_agent && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-xs">{log.user_agent}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 6: CATATAN INTERNAL STAF ADMIN (CONFIDENTIAL) */}
              {/* ========================================================================= */}
              {activeTab === 'notes' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Catatan Internal Staf Admin</h3>
                    <p className="text-[11px] text-slate-400">
                      Hanya dapat diakses oleh Super Admin. Bersifat rahasia untuk koordinasi tim operasional & customer service.
                    </p>
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-slate-800 text-xs">Tambah Catatan Baru</label>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                        <span>Kategori:</span>
                        {['Umum', 'Penting', 'Verifikasi', 'Penagihan'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNoteCategory(cat)}
                            className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                              noteCategory === cat
                                ? 'bg-slate-900 text-white font-bold'
                                : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      required
                      rows={2}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Tuliskan catatan internal mengenai tenant, riwayat komplain, verifikasi identitas, atau kesepakatan khusus..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900 resize-none text-xs"
                    />

                    {noteFeedback && (
                      <div
                        className={`p-2.5 rounded-lg text-xs font-medium ${
                          noteFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {noteFeedback.text}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingNote || !newNote.trim()}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span>{submittingNote ? 'Menyimpan...' : 'Simpan Catatan'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {internalNotes.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        Belum ada catatan internal untuk akun ini.
                      </div>
                    ) : (
                      internalNotes.map((note) => {
                        const isImportant = note.note.includes('[Penting]');
                        return (
                          <div
                            key={note.id}
                            className={`p-4 rounded-2xl border bg-white space-y-2 relative group shadow-2xs transition-colors ${
                              isImportant ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{note.author_name || 'SuperAdmin'}</span>
                                {isImportant && (
                                  <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                                    PENTING
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-mono">
                                  {new Date(note.created_at).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  title="Hapus catatan"
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-700 leading-relaxed text-xs whitespace-pre-wrap">{note.note}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
