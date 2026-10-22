import React, { useState, useEffect } from 'react';
import {
  GlobeIcon,
  CheckIcon,
  AlertCircleIcon,
  CopyIcon,
  RefreshCwIcon,
  LockIcon,
  ExternalLinkIcon,
  SparklesIcon,
  SearchIcon,
  SlidersIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from '../Icons';
import { navigateTo } from '../../utils/navigation';
import { API_BASE } from '../../lib/api';

export default function OwnerPageSettings({ user, token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [savingSection, setSavingSection] = useState(null);

  // Form States
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState(null);

  const [visibility, setVisibility] = useState('public');

  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [pagePassword, setPagePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [custom404, setCustom404] = useState('');
  const [faviconURL, setFaviconURL] = useState('');

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Tracking Pixels
  const [ga4ID, setGa4ID] = useState('');
  const [metaPixelID, setMetaPixelID] = useState('');
  const [tiktokPixelID, setTiktokPixelID] = useState('');

  const [copiedLink, setCopiedLink] = useState(false);

  const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
  const effectiveUserId = user?.id || 'usr_owner_kopi';

  useEffect(() => {
    fetchPageSettings();
  }, []);

  const fetchPageSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/owner/page/settings`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setSlug(result.data.slug || '');
        setVisibility(result.data.visibility || (result.data.is_published ? 'public' : 'private'));
        setIsPasswordProtected(result.data.is_password_protected || false);
        setCustom404(result.data.custom_404_redirect || '');
        setFaviconURL(result.data.favicon_url || '');
        setMetaTitle(result.data.meta_title || '');
        setMetaDescription(result.data.meta_description || '');
        setOgImage(result.data.og_image || '');
        setGa4ID(result.data.ga4_id || '');
        setMetaPixelID(result.data.meta_pixel_id || '');
        setTiktokPixelID(result.data.tiktok_pixel_id || '');
      } else {
        setError(result.error || 'Gagal memuat pengaturan halaman');
      }
    } catch (err) {
      setError('Koneksi terputus: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlug = async (e) => {
    e.preventDefault();
    setSlugError(null);
    setSavingSection('slug');
    try {
      const res = await fetch(`${API_BASE}/owner/page/slug`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ slug }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: 'Tautan bio baru Anda berhasil disimpan: klikin.id/' + result.data.slug });
        fetchPageSettings();
      } else {
        setSlugError(result.error || 'Gagal mengubah slug');
      }
    } catch (err) {
      setSlugError(err.message);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveVisibility = async (newVis) => {
    setVisibility(newVis);
    setSavingSection('visibility');
    try {
      const res = await fetch(`${API_BASE}/owner/page/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ visibility: newVis }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: `Status halaman diubah menjadi ${newVis === 'public' ? 'Publik' : 'Privat'}` });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal mengubah visibilitas' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setSavingSection('password');
    try {
      const res = await fetch(`${API_BASE}/owner/page/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          is_protected: isPasswordProtected,
          password: pagePassword,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: result.message || 'Pengaturan proteksi kata sandi disimpan!' });
        setPagePassword('');
        fetchPageSettings();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal menyimpan kata sandi' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveCustom404 = async (e) => {
    e.preventDefault();
    if (!isPro && custom404.trim()) {
      setFeedback({ type: 'error', message: 'Fitur Custom 404 Redirect hanya tersedia untuk pengguna Klikin Pro. Silakan upgrade paket akun Anda di menu Billing.' });
      return;
    }
    setSavingSection('404');
    try {
      const res = await fetch(`${API_BASE}/owner/page/404`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ redirect_url: custom404 }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: 'Tautan pengalihan 404 kustom berhasil diperbarui!' });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal menyimpan 404 redirect' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveFavicon = async (e) => {
    e.preventDefault();
    if (!isPro && faviconURL.trim()) {
      setFeedback({ type: 'error', message: 'Fitur Upload Favicon Kustom hanya tersedia untuk pengguna Klikin Pro. Silakan upgrade paket akun Anda di menu Billing.' });
      return;
    }
    setSavingSection('favicon');
    try {
      const res = await fetch(`${API_BASE}/owner/page/favicon`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ favicon_url: faviconURL }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: 'Favicon halaman berhasil diperbarui!' });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal menyimpan favicon' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveSEO = async (e) => {
    e.preventDefault();
    setSavingSection('seo');
    try {
      const res = await fetch(`${API_BASE}/owner/page/seo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          meta_title: metaTitle,
          meta_description: metaDescription,
          og_image: ogImage,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: 'Meta SEO & Open Graph berhasil diperbarui!' });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal menyimpan SEO' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!isPro && (ga4ID.trim() || metaPixelID.trim() || tiktokPixelID.trim())) {
      setFeedback({ type: 'error', message: 'Fitur Tracking Pixel (GA4, Meta, TikTok) hanya tersedia untuk pengguna Klikin Pro. Silakan upgrade paket akun Anda di menu Billing.' });
      return;
    }
    setSavingSection('tracking');
    try {
      const res = await fetch(`${API_BASE}/owner/page/tracking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ga4_id: ga4ID,
          meta_pixel_id: metaPixelID,
          tiktok_pixel_id: tiktokPixelID,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: 'ID Pixel tracking (GA4, Meta, TikTok) berhasil diperbarui!' });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal menyimpan tracking pixel' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingSection(null);
    }
  };

  const handleCopyBioURL = () => {
    const fullURL = `${window.location.origin}/${slug || 'demo'}`;
    navigator.clipboard.writeText(fullURL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-sm">
        <RefreshCwIcon className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Memuat konfigurasi pengaturan halaman bio...</p>
      </div>
    );
  }

  const isPro = Boolean(user?.is_pro || data?.is_pro);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between border shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <SlidersIcon className="w-5 h-5 text-slate-700" />
            <span>Pengaturan Halaman Bio</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi visibilitas, slug tautan unik, keamanan kata sandi, SEO meta, dan pixel tracking analitik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Authentic Pro Status / Upgrade CTA */}
          {isPro ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
              Klikin Pro Aktif
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                navigateTo('/owner/billing');
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
              Upgrade ke Pro
            </button>
          )}

          {/* Live URL Pill */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">klikin.id/</span>
          <span className="font-bold font-mono text-slate-900">{slug || '...'}</span>
          <button
            type="button"
            onClick={handleCopyBioURL}
            className="ml-2 text-slate-500 hover:text-slate-900 transition-colors p-1"
            title="Salin tautan bio"
          >
            {copiedLink ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
          </button>
          <a
            href={`/p/${slug || 'demo'}`}
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 hover:text-slate-900 transition-colors p-1"
            title="Buka halaman publik di tab baru"
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        </div>
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
                <h3 className="font-bold text-slate-900 text-sm">Buka Fitur Pengaturan Pro</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">PRO</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Proteksi kata sandi halaman bio, custom 404 redirect, upload favicon kustom, dan tempel pixel tracking analitik iklan (GA4, Meta Ads, TikTok Ads).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { navigateTo('/owner/billing'); }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 shrink-0 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <SparklesIcon className="w-4 h-4 text-amber-300" />
            Upgrade ke Pro
          </button>
        </div>
      )}

      {/* Section 1: Slug & Visibility */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Slug Card (7 cols) */}
        <form
          onSubmit={handleSaveSlug}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ubah Slug / Tautan Unik</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Alamat publik yang dibagikan kepada audiens Anda (misalnya di Instagram bio atau kartu nama).
            </p>
          </div>

          <div>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-1 focus-within:ring-slate-900 focus-within:border-slate-900">
              <span className="bg-slate-50 px-3 py-2.5 text-xs text-slate-500 font-mono border-r border-slate-200 select-none flex items-center">
                klikin.id/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="nama-brand"
                className="flex-1 px-3 py-2.5 text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>
            {slugError && <p className="text-[11px] text-rose-600 font-medium mt-1.5">{slugError}</p>}
            <p className="text-[11px] text-slate-400 mt-1.5">
              Hanya huruf kecil, angka, tanda minus (-), dan garis bawah (_). Minimal 3 karakter.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSection === 'slug'}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              {savingSection === 'slug' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Perubahan Slug</span>
            </button>
          </div>
        </form>

        {/* Visibility Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Visibilitas Halaman</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan apakah halaman bio dapat diakses publik atau hanya untuk persiapan draf pribadi.
            </p>

            <div className="space-y-3 mt-4">
              <label
                onClick={() => handleSaveVisibility('public')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'public'
                    ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => {}}
                  className="mt-0.5 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Publik (Dapat Diakses Siapapun)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Halaman dapat dibuka oleh semua pengunjung dan diindeks oleh mesin pencari.
                  </p>
                </div>
              </label>

              <label
                onClick={() => handleSaveVisibility('private')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'private'
                    ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => {}}
                  className="mt-0.5 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Privat (Hanya Akun Pemilik)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pengunjung umum akan diarahkan ke halaman pemeliharaan privat.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Status saat ini: <strong className="text-slate-800 uppercase">{visibility}</strong></span>
            {savingSection === 'visibility' && <span className="text-slate-500 animate-pulse">Menyimpan...</span>}
          </div>
        </div>
      </div>

      {/* Section 2: Password Protection (Pro) & Custom 404 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Password Protection Card (7 cols) */}
        <form
          onSubmit={handleSavePassword}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LockIcon className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Proteksi Kata Sandi Halaman</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
              Fitur Pro
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Hanya orang yang memiliki kata sandi yang dapat melihat isi halaman bio Anda (berguna untuk portofolio privat, proposal klien, atau konten VIP).
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Aktifkan Proteksi Kata Sandi</span>
              <input
                type="checkbox"
                checked={isPasswordProtected}
                disabled={!isPro}
                onChange={(e) => setIsPasswordProtected(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer disabled:opacity-50"
              />
            </label>

            {!isPro && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Fitur proteksi kata sandi halaman membutuhkan paket <strong>Klikin Pro</strong>. Silakan upgrade paket akun Anda di menu Billing.
              </p>
            )}

            {isPasswordProtected && isPro && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {data?.has_password ? 'Ubah Kata Sandi Baru' : 'Tetapkan Kata Sandi Halaman'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={isPasswordProtected && !data?.has_password}
                    value={pagePassword}
                    onChange={(e) => setPagePassword(e.target.value)}
                    placeholder={data?.has_password ? '•••••••• (Tetap aktif, isi untuk mengganti)' : 'Masukkan kata sandi rahasia'}
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingSection === 'password' || !isPro}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {savingSection === 'password' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Proteksi Kata Sandi</span>
            </button>
          </div>
        </form>

        {/* Custom 404 & Favicon Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Custom 404 Redirect */}
          <form
            onSubmit={handleSaveCustom404}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Custom 404 Redirect</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
                  Fitur Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Arahkan pengunjung jika URL yang diketik salah atau tidak ditemukan.
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="https://brandanda.com/home"
                value={custom404}
                onChange={(e) => setCustom404(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">Kosongkan untuk menampilkan halaman 404 standar Klikin.</p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingSection === '404'}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
              >
                {savingSection === '404' ? 'Menyimpan...' : 'Simpan 404'}
              </button>
            </div>
          </form>

          {/* Favicon URL */}
          <form
            onSubmit={handleSaveFavicon}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Favicon Halaman</h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-white uppercase tracking-wider">
                  Pro
                </span>
              </div>
              {faviconURL ? (
                <img src={faviconURL} alt="Favicon" className="w-5 h-5 rounded object-contain border" />
              ) : (
                <div className="w-5 h-5 rounded bg-slate-100 border text-[10px] flex items-center justify-center font-bold text-slate-500">
                  K
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">Ikon kecil pada tab browser pengunjung saat membuka halaman bio Anda.</p>

            <input
              type="url"
              placeholder="https://cdn.brand.com/favicon.png"
              value={faviconURL}
              onChange={(e) => setFaviconURL(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-slate-900"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingSection === 'favicon'}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
              >
                {savingSection === 'favicon' ? 'Menyimpan...' : 'Simpan Favicon'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Section 3: Meta Halaman (SEO & Open Graph Card Preview) */}
      <form
        onSubmit={handleSaveSEO}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SearchIcon className="w-4 h-4 text-slate-700" />
              <span>SEO Halaman & Kartu Berbagi Sosial (Open Graph)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Optimalkan bagaimana tautan Anda tampil saat dicari di Google atau dibagikan ke WhatsApp, Twitter, dan LinkedIn.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingSection === 'seo'}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            {savingSection === 'seo' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
            <span>Simpan Pengaturan SEO</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta Title (Judul Halaman di Hasil Pencarian)
              </label>
              <input
                type="text"
                placeholder="Contoh: Kopi Seduh Nusantara | Kopi Asli Indonesia"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Direkomendasikan di bawah 60 karakter ({metaTitle.length}/60).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta Description (Ringkasan Deskripsi Cuplikan)
              </label>
              <textarea
                rows="3"
                placeholder="Contoh: Nikmati racikan biji kopi arabika pilihan Nusantara langsung dari petani lokal terbaik..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900"
              ></textarea>
              <p className="text-[11px] text-slate-400 mt-1">Direkomendasikan di bawah 160 karakter ({metaDescription.length}/160).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                OG Image URL (Gambar Cuplikan Berbagi Sosial)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">Ukuran ideal: 1200 x 630 pixel (JPG/PNG).</p>
            </div>
          </div>

          {/* Live Preview Snippet (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pratinjau Hasil di Google:</p>
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-4 h-4 rounded-full bg-slate-100 border text-[9px] flex items-center justify-center font-bold">K</div>
                <span className="text-[11px] text-slate-500 font-mono">https://klikin.id/{slug || 'kopiseduh'}</span>
              </div>
              <h4 className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
                {metaTitle || data?.title || 'Kopi Seduh Nusantara | Klikin'}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {metaDescription || data?.bio || 'Tautan resmi dan profil lengkap Kopi Seduh Nusantara di Klikin.'}
              </p>
            </div>

            {/* Social Card Preview */}
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-2">Pratinjau Kartu Sosial (WhatsApp/Twitter):</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs">
              {ogImage ? (
                <img src={ogImage} alt="OG Preview" className="w-full h-36 object-cover bg-slate-200" />
              ) : (
                <div className="w-full h-28 bg-slate-200 flex items-center justify-center text-xs text-slate-400">
                  Belum ada gambar OG
                </div>
              )}
              <div className="p-3 bg-white border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-mono uppercase">KLIKIN.ID</p>
                <p className="text-xs font-bold text-slate-900 truncate">{metaTitle || data?.title || 'Profil Bio'}</p>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{metaDescription || data?.bio || 'Klik untuk membuka tautan.'}</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Section 4: Tempel Tracking Pixels (GA4, Meta, TikTok) */}
      <form
        onSubmit={handleSaveTracking}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
                <span>Pixel Tracking & Analitik Iklan</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
                Fitur Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sambungkan ID analitik pihak ketiga untuk melacak konversi iklan TikTok Ads, Meta Ads, dan Google Ads otomatis.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingSection === 'tracking'}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            {savingSection === 'tracking' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
            <span>Simpan Pixel Tracking</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* GA4 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Google Analytics 4 (GA4)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">G-XXXX</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Lacak lalu lintas pengunjung organik dan sumber kampanye Google Ads.
            </p>
            <input
              type="text"
              placeholder="G-ABC123XYZ"
              value={ga4ID}
              onChange={(e) => setGa4ID(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase bg-white focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Meta Pixel */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Meta / Facebook Pixel</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Pixel ID</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Otomatis kirim event PageView dan Lead ke Meta Events Manager untuk retargeting iklan.
            </p>
            <input
              type="text"
              placeholder="123456789012345"
              value={metaPixelID}
              onChange={(e) => setMetaPixelID(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* TikTok Pixel */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">TikTok Pixel</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">Code ID</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Optimalkan kampanye iklan TikTok Ads dengan melacak klik dan konversi bio.
            </p>
            <input
              type="text"
              placeholder="C1234567890ABCD"
              value={tiktokPixelID}
              onChange={(e) => setTiktokPixelID(e.target.value.trim())}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
