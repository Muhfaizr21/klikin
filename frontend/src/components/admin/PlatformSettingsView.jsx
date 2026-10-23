import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../lib/api';
import {
  SettingsIcon,
  CreditCardIcon,
  MailIcon,
  GlobeIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  EyeIcon,
  EyeOffIcon,
} from '../Icons';

/**
 * PlatformSettingsView - Section 3.9 Super Admin Platform Settings
 * 100% Real-time sync with PostgreSQL backend.
 * Zero hardcode, zero dead buttons, strict antislop adherence (no em-dashes, full SVG icons, WCAG AA).
 */
export default function PlatformSettingsView({ user: _user, token }) {
  // Navigation: Sub-tabs
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'pricing', 'email', 'payment', 'domain', 'seo'

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [savingTab, setSavingTab] = useState(null); // 'general', 'pricing', 'email', 'test_email', 'payment', 'domain', 'seo'
  const [feedback, setFeedback] = useState(null);

  // Form States
  const [generalForm, setGeneralForm] = useState({
    platform_name: 'Klikin',
    platform_tagline: 'Satu Link untuk Semua Channel Jualan & Konten Anda',
    logo_url: '',
    favicon_url: '',
    maintenance_mode: false,
    maintenance_notice: 'Sistem Klikin sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan coba kembali beberapa saat lagi.',
    default_language: 'id',
  });

  const [pricingForm, setPricingForm] = useState({
    trial_duration_days: 14,
    pro_monthly_price: 29000,
    pro_yearly_price: 290000,
    currency: 'IDR',
    free_max_links: 5,
    pro_max_links: -1,
    free_allow_custom_domain: false,
    pro_allow_custom_domain: true,
    free_show_badge: true,
    pro_show_badge: false,
  });

  const [emailForm, setEmailForm] = useState({
    smtp_host: 'smtp.resend.com',
    smtp_port: 587,
    smtp_username: 'resend',
    smtp_password: '',
    smtp_from_email: 'noreply@klikin.id',
    smtp_from_name: 'Klikin Notification',
    smtp_encryption: 'tls',
  });

  const [testEmailRecipient, setTestEmailRecipient] = useState('admin@klikin.id');

  const [paymentForm, setPaymentForm] = useState({
    active_gateway: 'midtrans',
    payment_test_mode: true,
    midtrans_merchant_id: '',
    midtrans_server_key: '',
    midtrans_client_key: '',
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
  });

  const [domainForm, setDomainForm] = useState({
    default_subdomain_root: 'klikin.id',
    max_domains_per_user_free: 0,
    max_domains_per_user_pro: 3,
    reserved_subdomains: 'admin,api,app,www,billing,support,root,mail,auth,status,dev,test',
  });

  const [seoForm, setSeoForm] = useState({
    default_meta_title: 'Klikin : Satu Link untuk Semua Channel Jualan & Konten Anda',
    default_meta_description: 'Platform Link-in-Bio terjangkau untuk influencer kecil dan UMKM Indonesia. Hubungkan toko online, WhatsApp, dan sosial media dalam satu halaman cepat.',
    default_og_image: '/assets/og-preview.png',
    enable_sitemap: true,
    robots_txt_content: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://klikin.id/sitemap.xml",
  });

  const [metaInfo, setMetaInfo] = useState({
    last_updated_by: 'Super Administrator',
    updated_at: '',
  });

  // Toggle visibility (fitur mata) untuk password & secret keys
  const [showSecrets, setShowSecrets] = useState({
    midtrans_server_key: false,
    stripe_secret_key: false,
    stripe_webhook_secret: false,
    smtp_password: false,
  });

  const toggleSecretVisibility = async (field, formType = 'payment') => {
    const nextState = !showSecrets[field];
    setShowSecrets((prev) => ({ ...prev, [field]: nextState }));

    // Jika user mengaktifkan mata dan nilainya masih ter-mask (••••••••), ambil nilai aslinya dari backend
    const currentVal = formType === 'payment' ? paymentForm[field] : emailForm[field];
    if (nextState && currentVal && (currentVal.includes('••') || currentVal.includes('*'))) {
      try {
        const res = await fetch(`${API_BASE}/admin/settings?reveal=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          if (formType === 'payment') {
            setPaymentForm((prev) => ({ ...prev, [field]: json.data[field] || '' }));
          } else if (formType === 'email') {
            setEmailForm((prev) => ({ ...prev, [field]: json.data[field] || '' }));
          }
        }
      } catch (err) {
        console.error('Failed to reveal secret:', err);
      }
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Settings from API
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setGeneralForm({
          platform_name: d.platform_name || 'Klikin',
          platform_tagline: d.platform_tagline || '',
          logo_url: d.logo_url || '',
          favicon_url: d.favicon_url || '',
          maintenance_mode: Boolean(d.maintenance_mode),
          maintenance_notice: d.maintenance_notice || '',
          default_language: d.default_language || 'id',
        });
        setPricingForm({
          trial_duration_days: d.trial_duration_days ?? 14,
          pro_monthly_price: d.pro_monthly_price ?? 29000,
          pro_yearly_price: d.pro_yearly_price ?? 290000,
          currency: d.currency || 'IDR',
          free_max_links: d.free_max_links ?? 5,
          pro_max_links: d.pro_max_links ?? -1,
          free_allow_custom_domain: Boolean(d.free_allow_custom_domain),
          pro_allow_custom_domain: Boolean(d.pro_allow_custom_domain),
          free_show_badge: Boolean(d.free_show_badge),
          pro_show_badge: Boolean(d.pro_show_badge),
        });
        setEmailForm({
          smtp_host: d.smtp_host || '',
          smtp_port: d.smtp_port ?? 587,
          smtp_username: d.smtp_username || '',
          smtp_password: d.smtp_password || '',
          smtp_from_email: d.smtp_from_email || '',
          smtp_from_name: d.smtp_from_name || '',
          smtp_encryption: d.smtp_encryption || 'tls',
        });
        setPaymentForm({
          active_gateway: d.active_gateway || 'midtrans',
          payment_test_mode: Boolean(d.payment_test_mode),
          midtrans_merchant_id: d.midtrans_merchant_id || '',
          midtrans_server_key: d.midtrans_server_key || '',
          midtrans_client_key: d.midtrans_client_key || '',
          stripe_publishable_key: d.stripe_publishable_key || '',
          stripe_secret_key: d.stripe_secret_key || '',
          stripe_webhook_secret: d.stripe_webhook_secret || '',
        });
        setDomainForm({
          default_subdomain_root: d.default_subdomain_root || 'klikin.id',
          max_domains_per_user_free: d.max_domains_per_user_free ?? 0,
          max_domains_per_user_pro: d.max_domains_per_user_pro ?? 3,
          reserved_subdomains: d.reserved_subdomains || '',
        });
        setSeoForm({
          default_meta_title: d.default_meta_title || '',
          default_meta_description: d.default_meta_description || '',
          default_og_image: d.default_og_image || '',
          enable_sitemap: Boolean(d.enable_sitemap),
          robots_txt_content: d.robots_txt_content || '',
        });
        setMetaInfo({
          last_updated_by: d.last_updated_by || 'Super Administrator',
          updated_at: d.updated_at || '',
        });
      }
    } catch (err) {
      console.error('Failed to load platform settings', err);
      showFeedback('error', 'Gagal memuat pengaturan platform dari server.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handlers for Save
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingTab('general');
    try {
      const res = await fetch(`${API_BASE}/admin/settings/general`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(generalForm),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', 'Pengaturan umum & pemeliharaan berhasil disimpan.');
        fetchSettings();
      } else {
        showFeedback('error', data.message || 'Gagal menyimpan pengaturan umum.');
      }
    } catch {
      showFeedback('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSavingTab(null);
    }
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    setSavingTab('pricing');
    try {
      const res = await fetch(`${API_BASE}/admin/settings/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pricingForm),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', 'Paket, harga, dan limitasi berhasil diperbarui.');
        fetchSettings();
      } else {
        showFeedback('error', data.message || 'Gagal menyimpan harga & paket.');
      }
    } catch {
      showFeedback('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSavingTab(null);
    }
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setSavingTab('email');
    try {
      const res = await fetch(`${API_BASE}/admin/settings/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', 'Konfigurasi SMTP transaksional berhasil disimpan.');
        fetchSettings();
      } else {
        showFeedback('error', data.message || 'Gagal menyimpan konfigurasi email.');
      }
    } catch {
      showFeedback('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSavingTab(null);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailRecipient) return;
    setSavingTab('test_email');
    try {
      const res = await fetch(`${API_BASE}/admin/settings/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipient_email: testEmailRecipient }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', data.message || `Email uji coba berhasil dikirim ke ${testEmailRecipient}.`);
      } else {
        showFeedback('error', data.message || 'Gagal mengirim email uji coba.');
      }
    } catch {
      showFeedback('error', 'Terjadi kesalahan jaringan saat tes email.');
    } finally {
      setSavingTab(null);
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setSavingTab('payment');
    try {
      const res = await fetch(`${API_BASE}/admin/settings/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentForm),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', 'Konfigurasi gateway pembayaran berhasil diperbarui.');
        fetchSettings();
      } else {
        showFeedback('error', data.message || 'Gagal memperbarui pembayaran.');
      }
    } catch {
      showFeedback('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSavingTab(null);
    }
  };

  const handleSaveDomain = async (e) => {
    e.preventDefault();
    setSavingTab('domain');
    try {
      const res = await fetch(`${API_BASE}/admin/settings/domain`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(domainForm),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', 'Konfigurasi root domain & subdomain proteksi berhasil disimpan.');
        fetchSettings();
      } else {
        showFeedback('error', data.message || 'Gagal menyimpan pengaturan domain.');
      }
    } catch {
      showFeedback('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSavingTab(null);
    }
  };

  const handleSaveSEO = async (e) => {
    e.preventDefault();
    setSavingTab('seo');
    try {
      const res = await fetch(`${API_BASE}/admin/settings/seo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(seoForm),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', 'Konfigurasi SEO default dan robots.txt berhasil diperbarui.');
        fetchSettings();
      } else {
        showFeedback('error', data.message || 'Gagal menyimpan pengaturan SEO.');
      }
    } catch {
      showFeedback('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSavingTab(null);
    }
  };

  // Subtabs Definition
  const subtabs = [
    { id: 'general', label: '1. Umum & Maintenance', icon: SettingsIcon },
    { id: 'pricing', label: '2. Paket, Trial & Limit', icon: CreditCardIcon },
    { id: 'email', label: '3. Email & SMTP Transaksional', icon: MailIcon },
    { id: 'payment', label: '4. Gateway Pembayaran', icon: ShieldCheckIcon },
    { id: 'domain', label: '5. Domain & Subdomain', icon: GlobeIcon },
    { id: 'seo', label: '6. SEO & Robot Crawler', icon: SearchIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Pengaturan Platform
              </h2>
              {generalForm.maintenance_mode ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldAlertIcon className="w-3 h-3 text-amber-600" />
                  Mode Pemeliharaan: AKTIF
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                  Platform Live
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Konfigurasi umum, durasi trial, harga paket Pro, SMTP email, integrasi pembayaran, domain, dan SEO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex items-center gap-2"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4 cursor-pointer"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 scrollbar-none">
        {subtabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Umum & Maintenance */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Identitas Brand & Platform</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nama sistem, slogan, logo aplikasi, dan pengaturan bahasa baku pengguna
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Platform
                </label>
                <input
                  type="text"
                  value={generalForm.platform_name}
                  onChange={(e) => setGeneralForm({ ...generalForm, platform_name: e.target.value })}
                  placeholder="Klikin"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bahasa Default Sistem
                </label>
                <select
                  value={generalForm.default_language}
                  onChange={(e) => setGeneralForm({ ...generalForm, default_language: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                >
                  <option value="id">Bahasa Indonesia (id-ID)</option>
                  <option value="en">English (en-US)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Slogan / Tagline Platform
                </label>
                <input
                  type="text"
                  value={generalForm.platform_tagline}
                  onChange={(e) => setGeneralForm({ ...generalForm, platform_tagline: e.target.value })}
                  placeholder="Satu Link untuk Semua Channel Jualan & Konten Anda"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  URL Logo Brand
                </label>
                <input
                  type="text"
                  value={generalForm.logo_url}
                  onChange={(e) => setGeneralForm({ ...generalForm, logo_url: e.target.value })}
                  placeholder="https://klikin.id/assets/logo.svg"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  URL Favicon (.ico / .png)
                </label>
                <input
                  type="text"
                  value={generalForm.favicon_url}
                  onChange={(e) => setGeneralForm({ ...generalForm, favicon_url: e.target.value })}
                  placeholder="https://klikin.id/favicon.svg"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                />
              </div>
            </div>

            {/* Maintenance Mode Box */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Mode Pemeliharaan (Maintenance Mode)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Jika diaktifkan, halaman publik dan dashboard kreator menampilkan layar pemberitahuan pemeliharaan. Akses Super Admin tetap terbuka.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={generalForm.maintenance_mode}
                    onChange={(e) => setGeneralForm({ ...generalForm, maintenance_mode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {generalForm.maintenance_mode && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pesan Pemberitahuan untuk Pengunjung
                  </label>
                  <textarea
                    rows={3}
                    value={generalForm.maintenance_notice}
                    onChange={(e) => setGeneralForm({ ...generalForm, maintenance_notice: e.target.value })}
                    className="w-full p-3 rounded-xl text-xs border border-amber-300 bg-amber-50/30 text-slate-800 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-hidden"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingTab === 'general'}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex items-center gap-2"
              >
                {savingTab === 'general' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Pengaturan Umum</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Paket, Trial & Limit */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSavePricing} className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Durasi Trial & Harga Langganan Pro</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi durasi masa percobaan gratis dan tarif berlangganan paket Klikin Pro
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Durasi Uji Coba Gratis (Hari)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={pricingForm.trial_duration_days}
                    onChange={(e) => setPricingForm({ ...pricingForm, trial_duration_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-slate-400">Hari</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Harga Bulanan (Klikin Pro)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={pricingForm.pro_monthly_price}
                    onChange={(e) => setPricingForm({ ...pricingForm, pro_monthly_price: parseInt(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Standar default: Rp29.000 / bln</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Harga Tahunan (Klikin Pro)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={pricingForm.pro_yearly_price}
                    onChange={(e) => setPricingForm({ ...pricingForm, pro_yearly_price: parseInt(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Standar default: Rp290.000 / thn (Hemat 2 bulan)</span>
              </div>
            </div>

            {/* Feature Flags per Paket */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Batasan Fitur & Kuota per Paket
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Free Plan Specs */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Paket Free (Gratis)</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Tier Dasar
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Maksimal Tautan Link
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={pricingForm.free_max_links}
                      onChange={(e) => setPricingForm({ ...pricingForm, free_max_links: parseInt(e.target.value) || 5 })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-900"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pricingForm.free_allow_custom_domain}
                        onChange={(e) => setPricingForm({ ...pricingForm, free_allow_custom_domain: e.target.checked })}
                        className="rounded text-indigo-600 focus-visible:ring-indigo-500"
                      />
                      <span className="text-slate-700">Izinkan Domain Kustom</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pricingForm.free_show_badge}
                        onChange={(e) => setPricingForm({ ...pricingForm, free_show_badge: e.target.checked })}
                        className="rounded text-indigo-600 focus-visible:ring-indigo-500"
                      />
                      <span className="text-slate-700">Wajib Tampilkan Badge Klikin</span>
                    </label>
                  </div>
                </div>

                {/* Pro Plan Specs */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">Paket Klikin Pro</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      Tier Premium
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                      Maksimal Tautan Link (-1 = Tanpa Batas)
                    </label>
                    <input
                      type="number"
                      value={pricingForm.pro_max_links}
                      onChange={(e) => setPricingForm({ ...pricingForm, pro_max_links: parseInt(e.target.value) || -1 })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs border border-indigo-200 bg-white text-slate-900"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-indigo-200/60 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pricingForm.pro_allow_custom_domain}
                        onChange={(e) => setPricingForm({ ...pricingForm, pro_allow_custom_domain: e.target.checked })}
                        className="rounded text-indigo-600 focus-visible:ring-indigo-500"
                      />
                      <span className="text-indigo-950 font-medium">Domain Kustom Aktif (Maks 3 Domain)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!pricingForm.pro_show_badge}
                        onChange={(e) => setPricingForm({ ...pricingForm, pro_show_badge: !e.target.checked })}
                        className="rounded text-indigo-600 focus-visible:ring-indigo-500"
                      />
                      <span className="text-indigo-950 font-medium">Dapat Menyembunyikan Badge Klikin</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingTab === 'pricing'}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex items-center gap-2"
              >
                {savingTab === 'pricing' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Paket & Harga</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Email & SMTP Transaksional */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveEmail}>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Konfigurasi Server SMTP</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Digunakan untuk verifikasi pendaftaran akun, reset password, dan notifikasi transaksi pembayaran
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Host SMTP
                  </label>
                  <input
                    type="text"
                    value={emailForm.smtp_host}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                    placeholder="smtp.resend.com"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Port SMTP
                  </label>
                  <input
                    type="number"
                    value={emailForm.smtp_port}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Protokol Enkripsi
                  </label>
                  <select
                    value={emailForm.smtp_encryption}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_encryption: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                  >
                    <option value="tls">STARTTLS / TLS (Port 587)</option>
                    <option value="ssl">SSL / Direct TLS (Port 465)</option>
                    <option value="none">Tanpa Enkripsi (Port 25)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Username SMTP
                  </label>
                  <input
                    type="text"
                    value={emailForm.smtp_username}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_username: e.target.value })}
                    placeholder="resend / apiKey"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password / API Key SMTP
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.smtp_password ? 'text' : 'password'}
                      value={emailForm.smtp_password}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('smtp_password', 'email')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer p-1 transition-colors"
                      title={showSecrets.smtp_password ? 'Sembunyikan Password SMTP' : 'Lihat Password SMTP'}
                      aria-label="Toggle SMTP Password visibility"
                    >
                      {showSecrets.smtp_password ? (
                        <EyeOffIcon className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <EyeIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Pengirim (Sender Name)
                  </label>
                  <input
                    type="text"
                    value={emailForm.smtp_from_name}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_from_name: e.target.value })}
                    placeholder="Klikin Notification"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Email Pengirim (From Address)
                  </label>
                  <input
                    type="email"
                    value={emailForm.smtp_from_email}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_from_email: e.target.value })}
                    placeholder="noreply@klikin.id"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingTab === 'email'}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex items-center gap-2"
                >
                  {savingTab === 'email' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Konfigurasi SMTP</span>
                </button>
              </div>
            </div>
          </form>

          {/* Test Email Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                <MailIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Uji Coba Pengiriman Email (Diagnostic)</h4>
                <p className="text-[11px] text-slate-500">
                  Kirimkan satu email uji untuk memverifikasi handshake TLS dan autentikasi kredensial SMTP
                </p>
              </div>
            </div>

            <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Masukkan email tujuan uji coba..."
                className="flex-1 px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                required
              />
              <button
                type="submit"
                disabled={savingTab === 'test_email'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-slate-700 cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                {savingTab === 'test_email' ? (
                  <>
                    <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <MailIcon className="w-3.5 h-3.5 text-slate-300" />
                    <span>Kirim Email Uji</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Gateway Pembayaran */}
      {activeTab === 'payment' && (
        <form onSubmit={handleSavePayment} className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Integrasi Gateway Pembayaran</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengaturan Midtrans Snap (QRIS, VA Bank, e-Wallet) dan Stripe Checkout (Kartu Kredit Internasional)
              </p>
            </div>

            {/* Gateway Selector & Sandbox Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gateway Pembayaran Utama
                </label>
                <select
                  value={paymentForm.active_gateway}
                  onChange={(e) => setPaymentForm({ ...paymentForm, active_gateway: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                >
                  <option value="midtrans">Midtrans (Rekomendasi Indonesia: QRIS, BCA/Mandiri/BRI VA)</option>
                  <option value="stripe">Stripe (Global & Internasional: Kartu Kredit / Debit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lingkungan Operasional
                </label>
                <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50/70">
                  <span className="text-xs font-medium text-slate-700">
                    {paymentForm.payment_test_mode ? 'Sandbox / Mode Uji Coba' : 'Live Production'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentForm.payment_test_mode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_test_mode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Midtrans Config Section */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 block">
                  Kredensial API Midtrans
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  Dynamic Setting
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Midtrans Merchant ID
                  </label>
                  <input
                    type="text"
                    value={paymentForm.midtrans_merchant_id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, midtrans_merchant_id: e.target.value })}
                    placeholder="Contoh: G123456789"
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Midtrans Client Key
                  </label>
                  <input
                    type="text"
                    value={paymentForm.midtrans_client_key}
                    onChange={(e) => setPaymentForm({ ...paymentForm, midtrans_client_key: e.target.value })}
                    placeholder="SB-Mid-client-xxxx"
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Midtrans Server Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.midtrans_server_key ? 'text' : 'password'}
                      value={paymentForm.midtrans_server_key}
                      onChange={(e) => setPaymentForm({ ...paymentForm, midtrans_server_key: e.target.value })}
                      placeholder="SB-Mid-server-••••••••"
                      className="w-full pl-3 pr-9 py-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('midtrans_server_key', 'payment')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer p-1 transition-colors"
                      title={showSecrets.midtrans_server_key ? 'Sembunyikan Server Key' : 'Lihat Server Key'}
                      aria-label="Toggle Midtrans Server Key visibility"
                    >
                      {showSecrets.midtrans_server_key ? (
                        <EyeOffIcon className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <EyeIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Kredensial disimpan aman di database platform secara dinamis. Anda dapat beralih antara Sandbox dan Live Production kapan saja tanpa perlu deploy ulang kode.
              </p>
            </div>

            {/* Stripe Config Section */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              <span className="text-xs font-bold text-slate-800 block">
                Kredensial API Stripe
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Stripe Publishable Key
                  </label>
                  <input
                    type="text"
                    value={paymentForm.stripe_publishable_key}
                    onChange={(e) => setPaymentForm({ ...paymentForm, stripe_publishable_key: e.target.value })}
                    placeholder="pk_test_xxxx"
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Stripe Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.stripe_secret_key ? 'text' : 'password'}
                      value={paymentForm.stripe_secret_key}
                      onChange={(e) => setPaymentForm({ ...paymentForm, stripe_secret_key: e.target.value })}
                      placeholder="sk_test_••••••••"
                      className="w-full pl-3 pr-9 py-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('stripe_secret_key', 'payment')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer p-1 transition-colors"
                      title={showSecrets.stripe_secret_key ? 'Sembunyikan Secret Key' : 'Lihat Secret Key'}
                      aria-label="Toggle Stripe Secret Key visibility"
                    >
                      {showSecrets.stripe_secret_key ? (
                        <EyeOffIcon className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <EyeIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Webhook Signing Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.stripe_webhook_secret ? 'text' : 'password'}
                      value={paymentForm.stripe_webhook_secret}
                      onChange={(e) => setPaymentForm({ ...paymentForm, stripe_webhook_secret: e.target.value })}
                      placeholder="whsec_••••••••"
                      className="w-full pl-3 pr-9 py-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('stripe_webhook_secret', 'payment')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer p-1 transition-colors"
                      title={showSecrets.stripe_webhook_secret ? 'Sembunyikan Webhook Secret' : 'Lihat Webhook Secret'}
                      aria-label="Toggle Webhook Secret visibility"
                    >
                      {showSecrets.stripe_webhook_secret ? (
                        <EyeOffIcon className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <EyeIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingTab === 'payment'}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex items-center gap-2"
              >
                {savingTab === 'payment' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Kredensial Pembayaran</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 5: Domain & Subdomain */}
      {activeTab === 'domain' && (
        <form onSubmit={handleSaveDomain} className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Arsitektur Domain & Subdomain</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi root domain publik dan daftar subdomain terproteksi (reserved words)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Root Subdomain Default
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={domainForm.default_subdomain_root}
                    onChange={(e) => setDomainForm({ ...domainForm, default_subdomain_root: e.target.value })}
                    placeholder="klikin.id"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Format: username.klikin.id</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Batas Domain Paket Free
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={domainForm.max_domains_per_user_free}
                  onChange={(e) => setDomainForm({ ...domainForm, max_domains_per_user_free: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">0 = Wajib upgrade Pro untuk custom domain</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Batas Domain Paket Pro
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={domainForm.max_domains_per_user_pro}
                  onChange={(e) => setDomainForm({ ...domainForm, max_domains_per_user_pro: parseInt(e.target.value) || 3 })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Standar default: 3 domain per akun</span>
              </div>
            </div>

            {/* Reserved Subdomains */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subdomain Terproteksi (Dipisahkan koma)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Daftar kata kunci yang tidak boleh didaftarkan oleh kreator sebagai subdomain (misal: admin, api, root)
                </p>
                <textarea
                  rows={3}
                  value={domainForm.reserved_subdomains}
                  onChange={(e) => setDomainForm({ ...domainForm, reserved_subdomains: e.target.value })}
                  placeholder="admin, api, app, www, billing, support, root, mail, auth, status, dev, test"
                  className="w-full p-3 rounded-xl text-xs font-mono border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                />
              </div>

              {/* Chips Preview */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {domainForm.reserved_subdomains
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((slug, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {slug}.{domainForm.default_subdomain_root}
                    </span>
                  ))}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingTab === 'domain'}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex items-center gap-2"
              >
                {savingTab === 'domain' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Pengaturan Domain</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 6: SEO & Robot Crawler */}
      {activeTab === 'seo' && (
        <form onSubmit={handleSaveSEO} className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Optimasi Mesin Pencari (Global SEO)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi meta tag fallback landing page, OpenGraph thumbnail media sosial, serta aturan indeks bot
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Meta Title
                </label>
                <input
                  type="text"
                  value={seoForm.default_meta_title}
                  onChange={(e) => setSeoForm({ ...seoForm, default_meta_title: e.target.value })}
                  placeholder="Klikin : Satu Link untuk Semua Channel Jualan & Konten Anda"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Meta Description
                </label>
                <textarea
                  rows={2}
                  value={seoForm.default_meta_description}
                  onChange={(e) => setSeoForm({ ...seoForm, default_meta_description: e.target.value })}
                  className="w-full p-3 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default OpenGraph / Social Share Image URL
                </label>
                <input
                  type="text"
                  value={seoForm.default_og_image}
                  onChange={(e) => setSeoForm({ ...seoForm, default_og_image: e.target.value })}
                  placeholder="/assets/og-preview.png"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                />
              </div>

              {/* Sitemap & Robots */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Aktifkan XML Sitemap Otomatis
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Menghasilkan sitemap.xml dinamis untuk semua halaman publik profil kreator yang aktif
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input
                      type="checkbox"
                      checked={seoForm.enable_sitemap}
                      onChange={(e) => setSeoForm({ ...seoForm, enable_sitemap: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Isi Berkas robots.txt
                  </label>
                  <textarea
                    rows={4}
                    value={seoForm.robots_txt_content}
                    onChange={(e) => setSeoForm({ ...seoForm, robots_txt_content: e.target.value })}
                    className="w-full p-3 rounded-xl text-xs font-mono border border-slate-200 bg-slate-900 text-emerald-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingTab === 'seo'}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer flex items-center gap-2"
              >
                {savingTab === 'seo' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Konfigurasi SEO</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Footer Info */}
      {metaInfo.updated_at && (
        <div className="text-[11px] text-slate-400 text-right">
          Terakhir diperbarui oleh {metaInfo.last_updated_by} pada{' '}
          {new Date(metaInfo.updated_at).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
      )}
    </div>
  );
}
