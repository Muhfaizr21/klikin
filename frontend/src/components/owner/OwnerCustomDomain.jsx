import React, { useState, useEffect } from 'react';
import {
  GlobeIcon,
  CheckIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  CopyIcon,
  RefreshCwIcon,
  TrashIcon,
  ShieldCheckIcon,
  ServerIcon,
  LockIcon,
  SparklesIcon,
  SearchIcon,
} from '../Icons';
import AnalyticsPaywallModal from './AnalyticsPaywallModal';
import { API_BASE } from '../../lib/api';

export default function OwnerCustomDomain({ user, token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Free vs Pro preview mode (user can test both)
  const isPro = Boolean(user?.is_pro || data?.is_pro);
  const [paywallModalOpen, setPaywallModalOpen] = useState(false);

  // New domain form state
  const [newDomain, setNewDomain] = useState('');
  const [redirectWWW, setRedirectWWW] = useState(true);
  const [fallbackSubdomain, setFallbackSubdomain] = useState(true);
  const [formError, setFormError] = useState(null);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState(null);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Status feedback toast
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchDomainInfo();
  }, []);

  const fetchDomainInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/domain`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat status domain kustom.');
      }

      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
        if (result.data.domain) {
          setRedirectWWW(result.data.domain.redirect_www ?? true);
          setFallbackSubdomain(result.data.domain.fallback_subdomain ?? true);
        }
      } else {
        throw new Error(result.error || 'Format data tidak valid');
      }
    } catch (err) {
      console.error('Fetch domain error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!isPro) {
      setPaywallModalOpen(true);
      return;
    }

    const clean = newDomain.trim().toLowerCase();
    if (!clean) {
      setFormError('Nama domain tidak boleh kosong.');
      return;
    }

    setFormError(null);
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          domain: clean,
          redirect_www: redirectWWW,
          fallback_subdomain: fallbackSubdomain,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal menambahkan domain');
      }

      setData(result.data);
      setNewDomain('');
      setFeedback({ type: 'success', message: 'Domain berhasil ditambahkan. Silakan ikuti instruksi DNS di bawah.' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDNS = async () => {
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/domain/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Verifikasi gagal');
      }

      setData(result.data);
      if (result.data.domain?.status === 'active') {
        setFeedback({ type: 'success', message: 'Verifikasi berhasil! Domain Anda telah terhubung aktif dengan SSL.' });
      } else {
        setFeedback({ type: 'warning', message: 'Record DNS belum terdeteksi. Silakan tunggu propagasi DNS (5-15 menit).' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSetting = async (key, val) => {
    const nextRedirect = key === 'redirect_www' ? val : redirectWWW;
    const nextFallback = key === 'fallback_subdomain' ? val : fallbackSubdomain;

    if (key === 'redirect_www') setRedirectWWW(val);
    if (key === 'fallback_subdomain') setFallbackSubdomain(val);

    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/domain`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          redirect_www: nextRedirect,
          fallback_subdomain: nextFallback,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Update setting error:', err);
    }
  };

  const handleDeleteDomain = async () => {
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
      const res = await fetch(`${API_BASE}/owner/domain`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal menghapus domain');
      }

      setData((prev) => ({ ...prev, domain: null, dns_instructions: null }));
      setIsDeleteModalOpen(false);
      setFeedback({ type: 'success', message: 'Domain kustom berhasil diputuskan. Halaman bio kini menggunakan tautan default.' });
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const domain = data?.domain;
  const isConfigured = Boolean(domain);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar & Pro Simulation Switch */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Domain Kustom
              </h2>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Fitur Pro
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gunakan domain pribadi (seperti <span className="font-mono text-slate-700">link.brandanda.com</span> atau <span className="font-mono text-slate-700">brandanda.id</span>) untuk halaman bio Anda
            </p>
          </div>          {/* Pro Status Badge / Upgrade CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {isPro ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Klikin Pro Aktif</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPaywallModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-white" />
                <span>Upgrade ke Pro</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-amber-600 shrink-0" />
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

      {/* Free Paywall Locked State */}
      {!isPro && (
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/90 shadow-2xs text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <GlobeIcon className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Domain Kustom Memerlukan Klikin Pro
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2">
            Gunakan domain atau subdomain bisnis Anda sendiri lengkap dengan sertifikat SSL otomatis, redirect www, dan perlindungan fallback tanpa henti.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setPaywallModalOpen(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <SparklesIcon className="w-4 h-4 text-amber-400" />
              <span>Tingkatkan ke Klikin Pro</span>
            </button>
          </div>
        </div>
      )}

      {/* Pro Content */}
      {isPro && (
        <>
          {/* STATE A: NO DOMAIN CONFIGURED YET */}
          {!isConfigured ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input Card (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Hubungkan Domain Anda
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Masukkan nama domain atau subdomain yang ingin diarahkan ke halaman bio Anda.
                  </p>
                </div>

                <form onSubmit={handleAddDomain} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nama Domain / Subdomain
                    </label>
                    <div className="relative">
                      <GlobeIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="Contoh: link.kopiseduh.id atau kopiseduh.id"
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 font-mono rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    {formError && (
                      <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircleIcon className="w-3.5 h-3.5" />
                        <span>{formError}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Disarankan menggunakan subdomain seperti <span className="font-mono text-slate-600">link.domainanda.com</span> untuk pemisahan DNS yang lebih mudah.
                    </p>
                  </div>

                  {/* Options Checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={redirectWWW}
                        onChange={(e) => setRedirectWWW(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">
                          Arahkan www secara otomatis (Redirect www)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Pengunjung yang mengetik www.domainanda.com akan otomatis dialihkan tanpa error.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fallbackSubdomain}
                        onChange={(e) => setFallbackSubdomain(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">
                          Fallback otomatis ke subdomain platform jika domain bermasalah
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Link bio Anda tetap bisa dibuka di <span className="font-mono text-slate-700">{data?.fallback_url}</span> jika DNS Anda mengalami gangguan.
                        </p>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                        <span>Mendaftarkan Domain...</span>
                      </>
                    ) : (
                      <span>Lanjutkan & Dapatkan Instruksi DNS</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Informative Guidance (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <ServerIcon className="w-4 h-4 text-slate-700" />
                  <span>Cara Kerja Domain Kustom</span>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p>
                      Masukkan nama domain atau subdomain Anda di formulir ini.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p>
                      Buka DNS Manager di penyedia domain Anda (Cloudflare, Niagahoster, Domainesia, Namecheap, dll.).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <p>
                      Tambahkan Record CNAME dan TXT sesuai panduan yang kami berikan.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                      4
                    </span>
                    <p>
                      Klik tombol Verifikasi DNS. Sertifikat SSL otomatis aktif dalam hitungan menit.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/70 text-[11px] text-slate-500">
                  Perlu bantuan pengaturan DNS? Tim teknis kami siap memandu Anda melalui live chat bantuan.
                </div>
              </div>
            </div>
          ) : (
            /* STATE B: DOMAIN ALREADY CONFIGURED (Active / Pending / Verifying / Error) */
            <div className="space-y-6">
              {/* Domain Overview & Status Banner */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                      <GlobeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight">
                          {domain.domain}
                        </span>

                        {/* Status Badge */}
                        {domain.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Terhubung & Aktif</span>
                          </span>
                        ) : domain.status === 'verifying' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            <RefreshCwIcon className="w-3 h-3 animate-spin text-indigo-600" />
                            <span>Sedang Memverifikasi...</span>
                          </span>
                        ) : domain.status === 'error' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <AlertCircleIcon className="w-3 h-3 text-rose-600" />
                            <span>Konfigurasi DNS Belum Sesuai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>Menunggu Konfigurasi DNS</span>
                          </span>
                        )}

                        {/* SSL Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            domain.ssl_status === 'active'
                              ? 'bg-slate-50 text-slate-700 border-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <ShieldCheckIcon
                            className={`w-3 h-3 ${
                              domain.ssl_status === 'active' ? 'text-emerald-600' : 'text-amber-500'
                            }`}
                          />
                          <span>
                            {domain.ssl_status === 'active'
                              ? 'SSL Aktif (TLS 1.3)'
                              : 'SSL Provisioning'}
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Halaman bio aktif: <span className="font-semibold text-slate-700">{data?.fallback_url}</span>
                        {domain.last_checked_at && (
                          <span className="text-slate-400 ml-2">
                            • Terakhir dicek: {new Date(domain.last_checked_at).toLocaleTimeString('id-ID')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Re-verify & Delete */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleVerifyDNS}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                    >
                      <RefreshCwIcon className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                      <span>Cek Verifikasi DNS</span>
                    </button>

                    {domain.status === 'active' && (
                      <a
                        href={`https://${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Kunjungi Domain</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      <span>Hapus Domain</span>
                    </button>
                  </div>
                </div>

                {/* Error diagnostics banner if DNS check failed */}
                {domain.status === 'error' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Diagnostik Verifikasi DNS:</span>
                      <p className="mt-0.5 text-rose-700">
                        {domain.error_message || 'Record CNAME belum terdeteksi mengarah ke cname.klikin.id.'}
                      </p>
                      <p className="mt-1 text-[11px] text-rose-600">
                        Tips: Jika Anda menggunakan Cloudflare, pastikan status Proxy diatur ke <strong>DNS Only (Abu-abu)</strong> terlebih dahulu.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step-by-Step DNS Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left (8 cols): Step-by-Step DNS Records */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        Instruksi Pengaturan DNS (Step-by-Step)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tambahkan 2 baris DNS Record berikut di dashboard provider domain Anda
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      TTL: Auto / 3600
                    </span>
                  </div>

                  {/* DNS Records Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Tipe</th>
                          <th className="py-2.5 px-3">Nama / Host</th>
                          <th className="py-2.5 px-3">Nilai / Target</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {/* CNAME Record */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                              CNAME
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {domain.domain.split('.').length > 2
                              ? domain.domain.split('.')[0]
                              : '@'}
                          </td>
                          <td className="py-3 px-3 text-slate-600 truncate max-w-xs">
                            {domain.cname_target}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(domain.cname_target, 'cname')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                            >
                              {copiedKey === 'cname' ? (
                                <>
                                  <CheckIcon className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <CopyIcon className="w-3 h-3 text-slate-500" />
                                  <span>Salin Target</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* TXT Verification Record */}
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              TXT
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {domain.txt_record_name}
                          </td>
                          <td className="py-3 px-3 text-slate-600 truncate max-w-xs">
                            {domain.verification_token}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(domain.verification_token, 'txt')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                            >
                              {copiedKey === 'txt' ? (
                                <>
                                  <CheckIcon className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <CopyIcon className="w-3 h-3 text-slate-500" />
                                  <span>Salin Nilai</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Provider DNS Guide Cards */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Panduan Provider Populer:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <strong className="text-slate-900 block font-semibold">Cloudflare</strong>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ubah tanda awan menjadi <strong>DNS Only (Abu-abu)</strong> saat verifikasi CNAME agar sertifikat SSL terbit sempurna.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <strong className="text-slate-900 block font-semibold">Niagahoster / cPanel</strong>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Masuk ke <em>Zone Editor</em> &gt; Tambah CNAME Record dengan Host <span className="font-mono">link</span> dan Target <span className="font-mono">cname.klikin.id</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right (4 cols): Domain Controls & Fallback */}
                <div className="lg:col-span-4 space-y-5">
                  {/* SSL Automatic Provisioning Box */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <ShieldCheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Sertifikat SSL Otomatis
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Enkripsi TLS 1.3 HTTPS
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">
                      Semua domain kustom Klikin dilengkapi sertifikat SSL gratis yang diperbarui otomatis setiap 90 hari tanpa intervensi manual.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Proteksi HTTPS Aktif</span>
                    </div>
                  </div>

                  {/* Toggles: Redirect WWW & Subdomain Fallback */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Pengaturan Akses Domain
                    </h4>

                    {/* Redirect WWW Toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Redirect www
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Alihkan traffic www ke root domain otomatis.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting('redirect_www', !redirectWWW)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          redirectWWW ? 'bg-slate-900' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            redirectWWW ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Subdomain Fallback Toggle */}
                    <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Fallback Subdomain Klikin
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pertahankan link bio tetap aktif jika domain Anda bermasalah.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSetting('fallback_subdomain', !fallbackSubdomain)
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          fallbackSubdomain ? 'bg-slate-900' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            fallbackSubdomain ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Subdomain fallback address */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                      <span className="text-slate-400 block">Alamat Cadangan Resmi:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {data?.fallback_url}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrashIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Domain Kustom?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Domain <strong className="text-slate-800 font-mono">{domain?.domain}</strong> akan diputuskan dari halaman bio Anda. Pengunjung akan diarahkan kembali ke alamat default <strong className="text-slate-800 font-mono">{data?.fallback_url}</strong>.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteDomain}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus Domain</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Paywall Modal */}
      <AnalyticsPaywallModal
        isOpen={paywallModalOpen}
        onClose={() => setPaywallModalOpen(false)}
        featureName="Domain Kustom (Pro)"
      />
    </div>
  );
}
