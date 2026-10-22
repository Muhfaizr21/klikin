import React, { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  CheckIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  DownloadIcon,
  CalendarIcon,
  TagIcon,
  ClockIcon,
  ArrowRightIcon,
  XIcon,
  SearchIcon,
  ReceiptIcon,
  ZapIcon,
  ChevronDownIcon,
} from '../Icons';

const API_BASE = 'http://localhost:8080/api';

export default function OwnerBilling({ user, token, onRefreshUser }) {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Billing Cycle Toggle: monthly vs yearly
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState('pro');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [paymentMethodSelected, setPaymentMethodSelected] = useState('card');

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('pricing');
  const [cancelNotes, setCancelNotes] = useState('');

  // Update Payment Method Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cardBrand, setCardBrand] = useState('mastercard');
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardExp, setCardExp] = useState('12/28');

  // Invoice Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    renewalReminder: true,
    invoiceEmail: true,
    failedPaymentAlert: true,
    promoDeals: false,
  });

  const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
  const effectiveUserId = user?.id || 'usr_owner_kopi';

  useEffect(() => {
    fetchBillingOverview();
  }, []);

  const fetchBillingOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/owner/billing`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setBillingData(result.data);
      } else {
        setError(result.error || 'Gagal memuat data billing');
      }
    } catch (err) {
      setError('Koneksi backend terputus: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!confirm('Aktifkan uji coba gratis 14 hari Klikin Pro sekarang?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/billing/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ days: 14 }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: 'Uji coba Klikin Pro 14 hari berhasil diaktifkan!' });
        fetchBillingOverview();
        if (onRefreshUser) onRefreshUser();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal memulai masa uji coba' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidatePromo = async () => {
    if (!promoInput.trim()) {
      setPromoError('Masukkan kode promo terlebih dahulu');
      return;
    }
    setValidatingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch(`${API_BASE}/owner/billing/promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setAppliedPromo(result.data);
        setFeedback({ type: 'success', message: `Kode promo "${result.data.code}" hemat ${result.data.discount_percent}% berhasil digunakan!` });
      } else {
        setPromoError(result.error || 'Kode promo tidak valid');
        setAppliedPromo(null);
      }
    } catch (err) {
      setPromoError(err.message);
      setAppliedPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleProcessUpgrade = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/billing/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          plan: selectedPlanForUpgrade,
          billing_cycle: billingCycle,
          promo_code: appliedPromo ? appliedPromo.code : '',
        }),
      });
      const result = await res.json();
      if (result.success) {
        setUpgradeModalOpen(false);
        setAppliedPromo(null);
        setPromoInput('');
        setFeedback({
          type: 'success',
          message: 'Selamat! Anda telah resmi beralih ke paket Klikin Pro!',
        });
        fetchBillingOverview();
        if (onRefreshUser) onRefreshUser();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal memproses upgrade langganan' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!confirm('Apakah Anda yakin ingin downgrade ke paket Gratis? Akses Pro tetap aktif sampai akhir periode.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/billing/downgrade`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({
          type: 'success',
          message: 'Permintaan downgrade berhasil disimpan. Layanan Pro Anda tetap aktif hingga akhir periode pembayaran.',
        });
        fetchBillingOverview();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal memproses downgrade' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/billing/reactivate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({
          type: 'success',
          message: 'Langganan Anda berhasil direaktivasi! Perpanjangan otomatis kembali aktif.',
        });
        fetchBillingOverview();
        if (onRefreshUser) onRefreshUser();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal mereaktivasi langganan' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    try {
      const reasonLabel = `${cancelReason}: ${cancelNotes}`.trim();
      const res = await fetch(`${API_BASE}/owner/billing/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: reasonLabel }),
      });
      const result = await res.json();
      if (result.success) {
        setCancelModalOpen(false);
        setFeedback({
          type: 'success',
          message: 'Langganan Anda telah dibatalkan. Fitur Pro tetap dapat digunakan hingga akhir periode penagihan.',
        });
        fetchBillingOverview();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal membatalkan langganan' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/billing/payment-method`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          brand: cardBrand,
          last4: cardLast4,
          exp: cardExp,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setPaymentModalOpen(false);
        setFeedback({ type: 'success', message: 'Metode pembayaran utama berhasil diperbarui!' });
        fetchBillingOverview();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal memperbarui metode pembayaran' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenUpgrade = (planType) => {
    setSelectedPlanForUpgrade(planType);
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
    setUpgradeModalOpen(true);
  };

  const handleOpenReceipt = (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceModalOpen(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Calculations for Upgrade Modal
  const getUpgradeCalculations = () => {
    const isYearly = billingCycle === 'yearly';
    const basePrice = isYearly ? 490000 : 49000;

    const discountPercent = appliedPromo ? appliedPromo.discount_percent : 0;
    const discountAmount = Math.round((basePrice * discountPercent) / 100);
    const subtotal = basePrice - discountAmount;
    const taxPPN = Math.round((subtotal * 11) / 100);
    const totalAmount = subtotal + taxPPN;

    return { basePrice, discountPercent, discountAmount, subtotal, taxPPN, totalAmount };
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-sm">
        <RefreshCwIcon className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Memuat rincian paket langganan & data billing Anda...</p>
      </div>
    );
  }

  const sub = billingData?.subscription || {};
  const currentPlan = sub.plan || 'free';
  const subStatus = sub.status || 'active';
  const isCanceledAtEnd = sub.cancel_at_period_end;
  const daysLeft = billingData?.days_remaining ?? 0;
  const pricingTiers = (billingData?.pricing_tiers || []).filter((tier) => tier.plan_type !== 'agency');
  const invoices = billingData?.invoices || [];

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (!invoiceSearch.trim()) return true;
    const q = invoiceSearch.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.plan_name?.toLowerCase().includes(q) ||
      inv.payment_method?.toLowerCase().includes(q)
    );
  });

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

      {/* Top Banner: Current Subscription Status & Immediate CTAs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Langganan Saat Ini
              </span>
              {/* Plan Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentPlan === 'pro'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {currentPlan === 'pro' ? 'Klikin Pro' : 'Gratis (Free)'}
              </span>

              {/* Status Badge */}
              {subStatus === 'trial' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                  Masa Uji Coba ({daysLeft} Hari Tersisa)
                </span>
              ) : isCanceledAtEnd ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <AlertCircleIcon className="w-3.5 h-3.5 text-amber-500" />
                  Berakhir pada {billingData?.next_renewal_date} (Grace Period)
                </span>
              ) : subStatus === 'past_due' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                  <AlertCircleIcon className="w-3.5 h-3.5 text-rose-500" />
                  Gagal Perpanjang
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                  Aktif & Auto-Renew
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {currentPlan === 'free'
                ? 'Tingkatkan performa konversi tautan bio Anda'
                : 'Paket Klikin Pro Aktif'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              {currentPlan === 'free'
                ? 'Gunakan domain kustom sendiri, hilangkan watermark Klikin, dan kumpulkan email leads tanpa batasan.'
                : isCanceledAtEnd
                ? `Langganan Anda tidak akan diperpanjang secara otomatis setelah tanggal ${billingData?.next_renewal_date}. Anda tetap menikmati fasilitas premium sampai tanggal tersebut.`
                : `Siklus penagihan ${sub.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}. Perpanjangan berikutnya dijadwalkan pada ${billingData?.next_renewal_date} sebesar ${formatIDR(sub.price)}.`}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {currentPlan === 'free' ? (
              <>
                <button
                  type="button"
                  onClick={handleStartTrial}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <SparklesIcon className="w-4 h-4 text-amber-500" />
                  Mulai Trial 14 Hari
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenUpgrade('pro')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-sm flex items-center gap-2"
                >
                  <ZapIcon className="w-4 h-4 text-[#bef264]" />
                  Upgrade ke Pro
                </button>
              </>
            ) : isCanceledAtEnd ? (
              <button
                type="button"
                onClick={handleReactivate}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-sm flex items-center gap-2"
              >
                <RefreshCwIcon className={`w-4 h-4 text-[#bef264] ${actionLoading ? 'animate-spin' : ''}`} />
                Reaktivasi Langganan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all"
              >
                Batalkan Langganan
              </button>
            )}
          </div>
        </div>

        {/* Renewal Countdown Alert (Pro/Agency) */}
        {currentPlan !== 'free' && !isCanceledAtEnd && daysLeft <= 7 && (
          <div className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-3">
            <ClockIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Pengingat Pembaharuan:</span> Masa periode aktif Anda tersisa{' '}
              <span className="font-bold underline">{daysLeft} hari</span> lagi. Perpanjangan otomatis akan diproses
              pada <span className="font-bold">{billingData?.next_renewal_date}</span> menggunakan metode pembayaran kartu utama Anda.
            </div>
          </div>
        )}
      </div>

      {/* Plan Comparison Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Perbandingan Paket Klikin</h2>
            <p className="text-xs text-slate-500">Pilih skala yang tepat untuk membangun identitas digital bisnis Anda.</p>
          </div>

          {/* Monthly / Yearly Switch */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tagihan Bulanan
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Tahunan</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#bef264] text-black">
                Hemat 17%
              </span>
            </button>
          </div>
        </div>

        {/* 2 Pricing Cards (Free vs Pro) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {pricingTiers.map((tier) => {
            const isCurrent = currentPlan === tier.plan_type;
            const price = billingCycle === 'yearly' ? tier.yearly_price : tier.monthly_price;
            const isPro = tier.plan_type === 'pro';

            return (
              <div
                key={tier.plan_type}
                className={`relative bg-white rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                  isPro
                    ? 'border-slate-900 shadow-md ring-1 ring-slate-900'
                    : isCurrent
                    ? 'border-slate-300 shadow-sm'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                {/* Popular Ribbon */}
                {tier.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900 text-[#bef264] text-[10px] font-bold tracking-wider uppercase shadow-sm">
                    Paling Populer
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-slate-900">{tier.name}</h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Paket Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{tier.description}</p>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {tier.plan_type === 'free' ? 'Rp 0' : formatIDR(price)}
                      </span>
                      {tier.plan_type !== 'free' && (
                        <span className="text-xs text-slate-500 font-medium">
                          /{billingCycle === 'yearly' ? 'tahun' : 'bulan'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && tier.plan_type !== 'free' && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        Setara {formatIDR(Math.round(tier.yearly_price / 12))}/bulan (Hemat 2 bulan)
                      </p>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 mb-8">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fitur Termasuk:</p>
                    {tier.features?.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <CheckIcon className="w-3.5 h-3.5 text-slate-900 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Button */}
                <div>
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs font-bold cursor-not-allowed text-center"
                    >
                      Paket Saat Ini
                    </button>
                  ) : tier.plan_type === 'free' ? (
                    <button
                      type="button"
                      onClick={handleDowngrade}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all text-center"
                    >
                      Downgrade ke Free
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenUpgrade(tier.plan_type)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white shadow-sm"
                    >
                      <span>Pilih {tier.name}</span>
                      <ArrowRightIcon className="w-3.5 h-3.5 text-[#bef264]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method & Billing Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Method Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Metode Pembayaran Utama</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                {sub.payment_method_brand || 'Mastercard'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white relative overflow-hidden mb-4 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                  {sub.payment_method_brand || 'Mastercard'}
                </span>
                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-mono tracking-widest mb-4">
                •••• •••• •••• {sub.payment_method_last4 || '4242'}
              </p>
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>BERLAKU HINGGA: {sub.payment_method_exp || '12/28'}</span>
                <span className="text-emerald-400 font-bold">TERVERIFIKASI</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Kartu ini ditagihkan otomatis pada setiap siklus pembaruan akun. Enkripsi level perbankan PCI-DSS via Stripe.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all text-center"
            >
              Ubah Kartu
            </button>
            <a
              href={billingData?.stripe_portal_url || 'https://billing.stripe.com'}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <span>Stripe Portal</span>
              <ExternalLinkIcon className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Billing Notifications Preferences (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Notifikasi & Pengingat Tagihan</h3>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Otomatis via Email
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Atur preferensi komunikasi notifikasi agar Anda tidak pernah terlewat tanggal pembayaran atau status akun.
            </p>

            <div className="space-y-3.5">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
                <div className="pr-3">
                  <p className="text-xs font-semibold text-slate-800">Reminder Perpanjangan (H-3)</p>
                  <p className="text-[11px] text-slate-500">
                    Kirim email pengingat 3 hari sebelum kartu Anda didebit untuk perpanjangan berkala.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPreferences.renewalReminder}
                  onChange={(e) =>
                    setNotifPreferences({ ...notifPreferences, renewalReminder: e.target.checked })
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
                <div className="pr-3">
                  <p className="text-xs font-semibold text-slate-800">Kwitansi & Faktur Pajak Otomatis</p>
                  <p className="text-[11px] text-slate-500">
                    Kirim salinan PDF invoice resmi langsung ke email saat transaksi dinyatakan lunas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPreferences.invoiceEmail}
                  onChange={(e) =>
                    setNotifPreferences({ ...notifPreferences, invoiceEmail: e.target.checked })
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
                <div className="pr-3">
                  <p className="text-xs font-semibold text-slate-800">Peringatan Gagal Bayar Segera</p>
                  <p className="text-[11px] text-slate-500">
                    Peringatan instan jika kartu Anda kedaluwarsa atau transaksi ditolak oleh bank penerbit.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPreferences.failedPaymentAlert}
                  onChange={(e) =>
                    setNotifPreferences({ ...notifPreferences, failedPaymentAlert: e.target.checked })
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Email terdaftar: <strong className="text-slate-700">{user?.email || 'owner@kopiseduh.id'}</strong></span>
            <span className="text-emerald-600 font-semibold">Tersimpan</span>
          </div>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4 text-slate-700" />
              <span>Riwayat Faktur & Pembayaran</span>
            </h3>
            <p className="text-xs text-slate-500">Unduh faktur pajak dan kwitansi resmi untuk kebutuhan pembukuan Anda.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor invoice..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Nomor Invoice</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Layanan & Siklus</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">PPN 11%</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    Tidak ada riwayat invoice yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {inv.plan_name}{' '}
                      <span className="text-[10px] text-slate-400">({inv.billing_cycle === 'yearly' ? '1 Tahun' : '1 Bulan'})</span>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-500 text-[11px]">{inv.payment_method}</td>
                    <td className="py-3 px-4 text-slate-600">{formatIDR(inv.amount)}</td>
                    <td className="py-3 px-4 text-slate-500">{formatIDR(inv.tax)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatIDR(inv.total)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {inv.status === 'paid' ? 'LUNAS' : inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition-all"
                      >
                        <ReceiptIcon className="w-3 h-3 text-slate-500" />
                        <span>Kwitansi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade / Checkout Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Upgrade ke Klikin Pro
                </h3>
                <p className="text-xs text-slate-500">
                  Siklus: {billingCycle === 'yearly' ? 'Tahunan (Hemat 17%)' : 'Bulanan'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Price Calculations */}
            {(() => {
              const calc = getUpgradeCalculations();
              return (
                <div className="space-y-4">
                  {/* Voucher Code Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Punya Kode Voucher / Diskon Promo?
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <TagIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Contoh: KLIKINPRO50 atau STARTUP2026"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleValidatePromo}
                        disabled={validatingPromo}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-all"
                      >
                        {validatingPromo ? 'Cek...' : 'Terapkan'}
                      </button>
                    </div>
                    {promoError && <p className="text-[11px] text-rose-600 mt-1 font-medium">{promoError}</p>}
                    {appliedPromo && (
                      <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                        <CheckIcon className="w-3.5 h-3.5" />
                        Diskon {appliedPromo.discount_percent}% diterapkan ({appliedPromo.code})
                      </p>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Metode Pembayaran</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethodSelected('card')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          paymentMethodSelected === 'card'
                            ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold">Kartu Kredit/Debit</p>
                        <p className="text-[10px] text-slate-400">Visa / Mastercard</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethodSelected('qris')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          paymentMethodSelected === 'qris'
                            ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold">QRIS Instant</p>
                        <p className="text-[10px] text-slate-400">GoPay, OVO, Dana</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethodSelected('va')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          paymentMethodSelected === 'va'
                            ? 'border-slate-900 bg-slate-50 text-slate-900 ring-1 ring-slate-900'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold">Virtual Account</p>
                        <p className="text-[10px] text-slate-400">BCA, Mandiri, BRI</p>
                      </button>
                    </div>
                  </div>

                  {/* Detailed Price Breakdown */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Harga Paket Dasar</span>
                      <span>{formatIDR(calc.basePrice)}</span>
                    </div>
                    {calc.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Potongan Diskon Promo ({calc.discountPercent}%)</span>
                        <span>-{formatIDR(calc.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatIDR(calc.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>PPN 11% (Pajak Pertambahan Nilai)</span>
                      <span>+{formatIDR(calc.taxPPN)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                      <span>Total Tagihan</span>
                      <span className="text-base text-slate-900">{formatIDR(calc.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessUpgrade}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <ShieldCheckIcon className="w-4 h-4 text-[#bef264]" />
                <span>{actionLoading ? 'Memproses Transaksi...' : 'Bayar Sekarang & Aktifkan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal with Feedback Survey */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircleIcon className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Batalkan Langganan</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Jika dibatalkan, perpanjangan otomatis akan dinonaktifkan. Akses Pro Anda tetap berlaku hingga{' '}
              <strong className="text-slate-900">{billingData?.next_renewal_date}</strong>. Setelah itu akun Anda akan
              kembali ke paket Gratis tanpa menghapus link bio Anda.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Mohon beritahu alasan Anda:</label>
              <div className="relative">
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 pr-10 cursor-pointer shadow-sm transition"
                >
                  <option value="pricing">Biaya langganan terlalu tinggi untuk kebutuhan saya</option>
                  <option value="features">Fitur yang saya butuhkan belum tersedia</option>
                  <option value="rarely_used">Jarang menggunakan bio link belakangan ini</option>
                  <option value="alternative">Beralih ke platform penyedia lain</option>
                  <option value="other">Alasan lainnya</option>
                </select>
                <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <textarea
                rows="2"
                placeholder="Ada masukan untuk tim Klikin? (Opsional)"
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Pertahankan Langganan
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                {actionLoading ? 'Membatalkan...' : 'Konfirmasi Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Card Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePaymentMethod}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Perbarui Metode Pembayaran</h3>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Penerbit Kartu</span>
                  <span className="text-[10px] text-slate-400">Pilih jaringan kartu</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'mastercard', label: 'Mastercard' },
                    { id: 'visa', label: 'Visa' },
                    { id: 'jcb', label: 'JCB' },
                    { id: 'amex', label: 'Amex' },
                  ].map((b) => {
                    const isSelected = cardBrand === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setCardBrand(b.id)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">4 Digit Terakhir Kartu</label>
                <input
                  type="text"
                  maxLength="4"
                  required
                  placeholder="4242"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Masa Berlaku (MM/YY)</label>
                <input
                  type="text"
                  maxLength="5"
                  required
                  placeholder="12/28"
                  value={cardExp}
                  onChange={(e) => setCardExp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all"
              >
                {actionLoading ? 'Menyimpan...' : 'Simpan Kartu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official Indonesian Printable Invoice / Receipt Modal */}
      {invoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 print:p-0 print:border-none print:shadow-none animate-in fade-in zoom-in duration-150">
            {/* Header / Actions */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-900">Kwitansi & Faktur Pajak Resmi</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <DownloadIcon className="w-3.5 h-3.5 text-[#bef264]" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Printable Receipt Content */}
            <div id="printable-invoice" className="space-y-6 text-slate-800">
              {/* Company & Invoice Meta */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    klikin<span className="text-[#84cc16]">.</span>
                  </h2>
                  <p className="text-xs font-bold text-slate-700 mt-1">PT KLIKIN SOLUSI DIGITAL</p>
                  <p className="text-[11px] text-slate-500">NPWP: 02.482.910.4-012.000</p>
                  <p className="text-[11px] text-slate-500">Jakarta Selatan, DKI Jakarta 12950, Indonesia</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {selectedInvoice.status === 'paid' ? 'LUNAS (PAID)' : selectedInvoice.status}
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-2">{selectedInvoice.invoice_number}</p>
                  <p className="text-[11px] text-slate-500">
                    Tanggal:{' '}
                    {new Date(selectedInvoice.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-start text-xs">
                <div>
                  <p className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1">DITAGIHKAN KEPADA:</p>
                  <p className="font-bold text-slate-900">{user?.name || 'Kopi Seduh Nusantara'}</p>
                  <p className="text-slate-500">{user?.email || 'owner@kopiseduh.id'}</p>
                  <p className="text-slate-500 font-mono text-[11px]">User ID: {effectiveUserId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1">METODE PEMBAYARAN:</p>
                  <p className="font-bold text-slate-900 uppercase">{selectedInvoice.payment_method}</p>
                  <p className="text-slate-500 text-[11px]">Gateway: Stripe Indonesia</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5">Deskripsi Layanan</th>
                    <th className="py-2.5 text-center">Periode</th>
                    <th className="py-2.5 text-right">Jumlah (IDR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3">
                      <p className="font-bold text-slate-900">{selectedInvoice.plan_name}</p>
                      <p className="text-[11px] text-slate-500">
                        Langganan bio page premium, domain kustom, email capture, & analitik.
                      </p>
                    </td>
                    <td className="py-3 text-center text-slate-600">
                      {selectedInvoice.billing_cycle === 'yearly' ? '1 Tahun' : '1 Bulan'}
                    </td>
                    <td className="py-3 text-right font-medium text-slate-900">
                      {formatIDR(selectedInvoice.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Calculations */}
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatIDR(selectedInvoice.amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>PPN 11%:</span>
                    <span>{formatIDR(selectedInvoice.tax)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Pembayaran:</span>
                    <span className="text-base">{formatIDR(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-4 text-center">
                Dokumen ini merupakan bukti pembayaran elektronik yang sah yang diterbitkan oleh sistem penagihan otomatis Klikin.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
