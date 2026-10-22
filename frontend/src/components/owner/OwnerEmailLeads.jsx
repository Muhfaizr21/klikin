import React, { useState, useEffect } from 'react';
import {
  MailIcon,
  CheckIcon,
  AlertCircleIcon,
  DownloadIcon,
  TrashIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  ShieldCheckIcon,
  SendIcon,
} from '../Icons';
import AnalyticsPaywallModal from './AnalyticsPaywallModal';

const API_BASE = 'http://localhost:8080/api';

export default function OwnerEmailLeads({ user, token }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'settings'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isPro = Boolean(user?.is_pro || overview?.is_pro);
  const [paywallModalOpen, setPaywallModalOpen] = useState(false);

  // Overview & Stats
  const [overview, setOverview] = useState(null);

  // Leads list state
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Delete modal state
  const [deletingLead, setDeletingLead] = useState(null);

  // Form Configuration State
  const [formConfig, setFormConfig] = useState({
    is_enabled: true,
    title: 'Dapatkan Katalog & Promo Spesial Tiap Minggu',
    description: 'Bergabunglah dengan pelanggan setia kami. Dapatkan penawaran eksklusif dan diskon spesial langsung di inbox Anda.',
    placeholder: 'Masukkan alamat email aktif Anda...',
    button_text: 'Dapatkan Promo',
    success_message: 'Terima kasih! Voucher promo eksklusif telah kami kirimkan ke email Anda.',
    consent_enabled: true,
    consent_text: 'Saya setuju menerima buletin promo berkala dan memahami kebijakan privasi.',
    notify_on_new_lead: true,
    notify_email: user?.email || '',
    provider: 'none',
    api_key: '',
    list_id: '',
  });

  // Integration testing state
  const [testResult, setTestResult] = useState(null);
  const [testingIntegration, setTestingIntegration] = useState(false);

  // Preview form test input
  const [previewEmail, setPreviewEmail] = useState('');
  const [previewConsent, setPreviewConsent] = useState(false);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchLeads(1, searchQuery);
  }, [user]);

  const fetchConfig = async () => {
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/leads/config`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOverview(data.data);
        if (data.data.config) {
          setFormConfig({
            is_enabled: data.data.config.is_enabled ?? true,
            title: data.data.config.title || '',
            description: data.data.config.description || '',
            placeholder: data.data.config.placeholder || '',
            button_text: data.data.config.button_text || '',
            success_message: data.data.config.success_message || '',
            consent_enabled: data.data.config.consent_enabled ?? true,
            consent_text: data.data.config.consent_text || '',
            notify_on_new_lead: data.data.config.notify_on_new_lead ?? true,
            notify_email: data.data.config.notify_email || user?.email || '',
            provider: data.data.config.provider || 'none',
            api_key: data.data.config.api_key || '',
            list_id: data.data.config.list_id || '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch leads config:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async (pageNumber = 1, search = '') => {
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const params = new URLSearchParams({
        page: pageNumber,
        limit: 20,
      });
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/owner/leads?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLeads(data.data.leads || []);
        setTotalLeads(data.data.total || 0);
        setPage(data.data.page || 1);
        setTotalPages(data.data.total_pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads(1, searchQuery);
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    if (!isPro) {
      setPaywallModalOpen(true);
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/leads/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formConfig),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan');
      }
      setFeedback({ type: 'success', message: 'Pengaturan form email capture berhasil disimpan!' });
      fetchConfig();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/leads/${deletingLead.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus lead');
      }
      setFeedback({ type: 'success', message: 'Kontak email berhasil dihapus.' });
      setDeletingLead(null);
      fetchLeads(page, searchQuery);
      fetchConfig();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!isPro) {
      setPaywallModalOpen(true);
      return;
    }

    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/leads/export`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal mengekspor data');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klikin_leads_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setFeedback({ type: 'success', message: 'File CSV leads berhasil diunduh.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleTestIntegration = async () => {
    if (!isPro) {
      setPaywallModalOpen(true);
      return;
    }

    setTestingIntegration(true);
    setTestResult(null);
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/leads/test-integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          provider: formConfig.provider,
          api_key: formConfig.api_key,
          list_id: formConfig.list_id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menguji koneksi');
      }
      setTestResult({ success: true, message: data.message });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingIntegration(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCwIcon className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat data email capture & leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Pro Preview Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <MailIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Email Capture & Manajemen Leads
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                Fitur Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bangun daftar kontak newsletter Anda langsung dari tautan bio.
            </p>
          </div>
        </div>

        {/* Authentic Pro Status / Upgrade CTA */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isPro ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
              Klikin Pro Aktif
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#billing';
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
              Upgrade ke Pro
            </button>
          )}
        </div>
      </div>

      {/* Paywall Banner for Free Tier */}
      {!isPro && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 border border-amber-300/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Fitur Eksklusif Klikin Pro</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">PRO</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Kumpulkan kontak calon pelanggan (leads), ekspor ke file CSV, dan integrasikan dengan Mailchimp / ConvertKit secara otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { window.location.hash = '#billing'; }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 shrink-0 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <SparklesIcon className="w-4 h-4 text-amber-300" />
            Upgrade ke Pro
          </button>
        </div>
      )}

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Leads Terkumpul
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {totalLeads}
            </span>
            <span className="text-xs text-slate-500 font-medium">kontak</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Subscriber terverifikasi aktif
          </p>
        </div>

        {/* New Leads (7 Days) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Leads 7 Hari Terakhir
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              +{overview?.leads_this_week ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Pertumbuhan Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Penambahan kontak minggu ini
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Estimasi Rasio Konversi
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {(overview?.conversion_rate ?? 4.8).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 font-medium">dari total view</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pengunjung yang mengisi formulir
          </p>
        </div>

        {/* Integration Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Sinkronisasi Provider
          </span>
          <div className="flex items-center gap-2 mt-2.5">
            <span
              className={`w-2 h-2 rounded-full ${
                formConfig.provider !== 'none' && formConfig.api_key
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-sm font-bold text-slate-800 capitalize">
              {formConfig.provider === 'none' ? 'Tersimpan Lokal' : formConfig.provider}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formConfig.provider !== 'none'
              ? 'Tersambung ke autoresponder'
              : 'Database Klikin mandiri'}
          </p>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'list'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Daftar Leads ({totalLeads})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Kustomisasi Form & Integrasi
        </button>
      </div>

      {/* TAB 1: DAFTAR LEADS */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Export CSV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative max-w-sm w-full">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan email..."
                className="w-full pl-9 pr-4 py-2 text-xs text-slate-900 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
              />
            </form>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchLeads(page, searchQuery)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                title="Muat Ulang"
              >
                <RefreshCwIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <DownloadIcon className="w-4 h-4 text-slate-500" />
                <span>Export CSV (Pro)</span>
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Kontak Email</th>
                    <th className="py-3 px-4">Sumber</th>
                    <th className="py-3 px-4">Waktu Bergabung</th>
                    <th className="py-3 px-4">Persetujuan GDPR</th>
                    <th className="py-3 px-4">Sinkronisasi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <MailIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Belum ada email leads yang masuk</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Aktifkan form email pada tab Kustomisasi Form untuk mulai mengumpulkan kontak pengunjung.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {lead.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                            {lead.source || 'Bio Page'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(lead.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <CheckIcon className="w-3 h-3 text-emerald-600" />
                            <span>Disetujui</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {lead.synced_to_provider ? (
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckIcon className="w-3 h-3 text-emerald-600" />
                              <span>Tersinkron</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500">
                              Tersimpan Lokal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDeletingLead(lead)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Lead"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Halaman {page} dari {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => fetchLeads(page - 1, searchQuery)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => fetchLeads(page + 1, searchQuery)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KUSTOMISASI FORM & INTEGRASI */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left (7 cols): Configuration Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* Form Activation Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Aktifkan Form Email Capture
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Menampilkan blok form email interaktif di halaman bio profil Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormConfig({ ...formConfig, is_enabled: !formConfig.is_enabled })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formConfig.is_enabled ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        formConfig.is_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Form Copy Customization Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100">
                  Kustomisasi Teks Formulir
                </h3>

                {/* Form Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Judul Formulir
                  </label>
                  <input
                    type="text"
                    value={formConfig.title}
                    onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
                    placeholder="Contoh: Dapatkan Katalog & Promo Spesial"
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Form Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Deskripsi Singkat / Value Proposition
                  </label>
                  <textarea
                    rows={2}
                    value={formConfig.description}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, description: e.target.value })
                    }
                    placeholder="Jelaskan keuntungan yang didapat audiens setelah mengisi email..."
                    className="w-full px-3.5 py-2 text-xs text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Form Placeholder & Button Text (2 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Teks Placeholder
                    </label>
                    <input
                      type="text"
                      value={formConfig.placeholder}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, placeholder: e.target.value })
                      }
                      placeholder="Masukkan alamat email Anda..."
                      className="w-full px-3.5 py-2.5 text-xs text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Teks Tombol Aksi
                    </label>
                    <input
                      type="text"
                      value={formConfig.button_text}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, button_text: e.target.value })
                      }
                      placeholder="Contoh: Dapatkan Promo"
                      className="w-full px-3.5 py-2.5 text-xs text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Success Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pesan Sukses Setelah Submit
                  </label>
                  <input
                    type="text"
                    value={formConfig.success_message}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, success_message: e.target.value })
                    }
                    placeholder="Terima kasih! Email Anda telah kami terima."
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* GDPR Consent Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Checkbox Persetujuan (GDPR-Friendly)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormConfig({
                        ...formConfig,
                        consent_enabled: !formConfig.consent_enabled,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formConfig.consent_enabled ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        formConfig.consent_enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teks Persetujuan
                  </label>
                  <input
                    type="text"
                    value={formConfig.consent_text}
                    disabled={!formConfig.consent_enabled}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, consent_text: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Wajib dicentang oleh pengunjung sebelum data email dapat dikirimkan.
                  </p>
                </div>
              </div>

              {/* Notification & Integration Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100">
                  Notifikasi & Integrasi Email (Opsional)
                </h3>

                {/* Email Notification Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Notifikasi Email Saat Lead Baru Masuk
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dapatkan email pemberitahuan setiap ada pengunjung baru yang mendaftar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormConfig({
                        ...formConfig,
                        notify_on_new_lead: !formConfig.notify_on_new_lead,
                      })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formConfig.notify_on_new_lead ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        formConfig.notify_on_new_lead ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {formConfig.notify_on_new_lead && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Penerima Notifikasi
                    </label>
                    <input
                      type="email"
                      value={formConfig.notify_email}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, notify_email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                )}

                {/* 3rd Party Provider Selector */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Integrasi Platform Autoresponder
                    </label>
                    <span className="text-[10px] text-slate-400">Pilih tujuan database lead</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'none',
                        title: 'Database Lokal',
                        desc: 'Tersimpan di server Klikin, ekspor CSV kapan saja',
                        badge: 'Standar',
                      },
                      {
                        id: 'mailchimp',
                        title: 'Mailchimp API',
                        desc: 'Sinkronisasi kontak otomatis ke Audience Mailchimp',
                        badge: 'Cloud Sync',
                      },
                      {
                        id: 'convertkit',
                        title: 'ConvertKit (Kit)',
                        desc: 'Kirim lead langsung ke form / tag subscriber Kit',
                        badge: 'Cloud Sync',
                      },
                    ].map((p) => {
                      const isSelected = formConfig.provider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormConfig({ ...formConfig, provider: p.id })}
                          className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                            isSelected
                              ? 'border-slate-900 bg-white ring-2 ring-slate-900/10 shadow-sm'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                              {p.badge}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">{p.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formConfig.provider !== 'none' && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        API Key ({formConfig.provider.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={formConfig.api_key}
                        onChange={(e) =>
                          setFormConfig({ ...formConfig, api_key: e.target.value })
                        }
                        placeholder={
                          formConfig.provider === 'mailchimp'
                            ? 'Contoh: xxxxxxxxx-us19'
                            : 'Contoh: api_key_convertkit'
                        }
                        className="w-full px-3 py-2 text-xs font-mono text-slate-900 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Audience ID / List ID / Tag
                      </label>
                      <input
                        type="text"
                        value={formConfig.list_id}
                        onChange={(e) =>
                          setFormConfig({ ...formConfig, list_id: e.target.value })
                        }
                        placeholder="Contoh: aud_12345 atau tag_vip"
                        className="w-full px-3 py-2 text-xs font-mono text-slate-900 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleTestIntegration}
                        disabled={testingIntegration || !formConfig.api_key}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        {testingIntegration && (
                          <RefreshCwIcon className="w-3 h-3 animate-spin" />
                        )}
                        <span>Tes Koneksi API</span>
                      </button>

                      {testResult && (
                        <span
                          className={`text-[11px] font-medium ${
                            testResult.success ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {testResult.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Perubahan Formulir</span>
              </button>
            </form>
          </div>

          {/* Right (5 cols): Live Interactive Bio Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Live Preview Tampilan Formulir:
              </span>

              {/* Simulated Card on Bio Page */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <MailIcon className="w-5 h-5" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {formConfig.title || 'Dapatkan Katalog & Promo Spesial'}
                  </h4>
                  {formConfig.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {formConfig.description}
                    </p>
                  )}
                </div>

                {previewSubmitted ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formConfig.success_message}</span>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setPreviewSubmitted(true);
                      setTimeout(() => setPreviewSubmitted(false), 4000);
                    }}
                    className="space-y-2.5"
                  >
                    <input
                      type="email"
                      value={previewEmail}
                      onChange={(e) => setPreviewEmail(e.target.value)}
                      placeholder={formConfig.placeholder}
                      required
                      className="w-full px-3.5 py-2.5 text-xs text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />

                    {formConfig.consent_enabled && (
                      <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-500">
                        <input
                          type="checkbox"
                          checked={previewConsent}
                          onChange={(e) => setPreviewConsent(e.target.checked)}
                          required
                          className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span>{formConfig.consent_text}</span>
                      </label>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <SendIcon className="w-3.5 h-3.5" />
                      <span>{formConfig.button_text}</span>
                    </button>
                  </form>
                )}

                <div className="pt-2 text-center text-[10px] text-slate-400">
                  Pratinjau langsung sesuai input kustomisasi Anda di sebelah kiri.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrashIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Kontak Lead?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Alamat <strong className="text-slate-800 font-mono">{deletingLead.email}</strong> akan dihapus permanen dari daftar kontak Anda.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLead(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteLead}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Paywall Modal */}
      <AnalyticsPaywallModal
        isOpen={paywallModalOpen}
        onClose={() => setPaywallModalOpen(false)}
        featureName="Email Capture & Leads (Pro)"
      />
    </div>
  );
}
