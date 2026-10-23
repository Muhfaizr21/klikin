import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';
import {
  XIcon,
  CreditCardIcon,
  SparklesIcon,
  ClockIcon,
  TagIcon,
  MailIcon,
  ReceiptIcon,
  BanIcon,
} from '../Icons';

const formatIDR = (val) => `Rp ${(Number(val) || 0).toLocaleString('id-ID')}`;

/**
 * 1. CHANGE PLAN MANUAL MODAL (Upgrade / Downgrade tanpa Stripe)
 */
export function ChangePlanModal({ subscription, token, isOpen, onClose, onSuccess }) {
  const [plan, setPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState('29000');
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (subscription) {
      setPlan(subscription.plan === 'pro' ? 'pro' : 'free');
      setBillingCycle(subscription.billing_cycle || 'monthly');
      setUseCustomPrice(false);
      setCustomPrice(subscription.billing_cycle === 'yearly' ? '290000' : '29000');
      setGenerateInvoice(true);
      setAdminNotes(subscription.admin_notes || '');
      setError(null);
    }
  }, [subscription, isOpen]);

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        plan,
        billing_cycle: billingCycle,
        generate_invoice: plan === 'pro' ? generateInvoice : false,
        admin_notes: adminNotes,
      };
      if (plan === 'pro' && useCustomPrice) {
        const parsed = parseInt(customPrice, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          payload.custom_price = parsed;
        }
      }

      const res = await fetch(`${API_BASE}/admin/subscriptions/${subscription.user_id}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengubah paket langganan');
      }
      onSuccess?.(json.message || 'Paket langganan berhasil diperbarui');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <CreditCardIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Ubah Paket Manual</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                @{subscription.username} ({subscription.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Pilih Paket Target</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                  plan === 'pro'
                    ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Klikin Pro</span>
                  <SparklesIcon className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fitur penuh, domain kustom, analitik lengkap
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPlan('free')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                  plan === 'free'
                    ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50/60'
                }`}
              >
                <div className="font-semibold text-slate-900">Free Tier</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Paket dasar gratis tanpa biaya berlangganan
                </p>
              </button>
            </div>
          </div>

          {plan === 'pro' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Siklus Penagihan</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingCycle('monthly');
                      if (!useCustomPrice) setCustomPrice('29000');
                    }}
                    className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Bulanan (Rp 29.000)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingCycle('yearly');
                      if (!useCustomPrice) setCustomPrice('290000');
                    }}
                    className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                      billingCycle === 'yearly'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Tahunan (Rp 290.000)
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={useCustomPrice}
                    onChange={(e) => setUseCustomPrice(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Atur Harga Kustom / Komplementer (Rp 0)</span>
                </label>

                {useCustomPrice && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Nominal Harga (IDR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                      placeholder="0 untuk gratis atau 29000"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 pt-1 border-t border-slate-200/60">
                  <input
                    type="checkbox"
                    checked={generateInvoice}
                    onChange={(e) => setGenerateInvoice(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Terbitkan Invoice Lunas Otomatis di Riwayat User</span>
                </label>
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Catatan Admin / Alasan Perubahan</label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Contoh: Upgrade manual via transfer bank atau kemitraan khusus..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan Paket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. EXTEND GOODWILL MODAL (Perpanjang Manual Goodwill)
 */
export function ExtendGoodwillModal({ subscription, token, isOpen, onClose, onSuccess }) {
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setDays(30);
      setReason('Apresiasi loyalitas & kompensasi layanan (Goodwill)');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !subscription) return null;

  const presets = [7, 14, 30, 60, 90, 365];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/${subscription.user_id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ days: Number(days), reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memperpanjang masa aktif');
      }
      onSuccess?.(json.message || `Masa aktif diperpanjang +${days} hari`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <SparklesIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Perpanjang Manual (Goodwill)</h3>
              <p className="text-[11px] text-slate-400 font-mono">@{subscription.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-2">Pilih Tambahan Hari Aktif</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {presets.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`py-1.5 px-3 rounded-lg border font-semibold text-xs transition-colors cursor-pointer ${
                    Number(days) === d
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  +{d} Hari
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="730"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Alasan Goodwill (Tercatat di Invoice Rp 0 & Audit)</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 text-xs cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Memproses...' : `Tambah +${days} Hari Gratis`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. MANAGE TRIAL MODAL (Perpanjang, Shorten, Start, atau Konversi ke Paid)
 */
export function ManageTrialModal({ subscription, token, isOpen, onClose, onSuccess }) {
  const [action, setAction] = useState('extend');
  const [days, setDays] = useState(7);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (subscription && isOpen) {
      setAction(subscription.status === 'trial' ? 'extend' : 'start');
      setDays(7);
      setBillingCycle(subscription.billing_cycle || 'monthly');
      setReason('');
      setError(null);
    }
  }, [subscription, isOpen]);

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/${subscription.user_id}/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          days: Number(days),
          billing_cycle: billingCycle,
          reason,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memperbarui masa trial');
      }
      onSuccess?.(json.message || 'Pengaturan trial berhasil disimpan');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <ClockIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Kelola Masa Trial</h3>
              <p className="text-[11px] text-slate-400 font-mono">@{subscription.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-2">Pilih Operasi Trial</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'start', label: 'Mulai Trial Baru', desc: 'Reset & aktifkan trial Pro' },
                { id: 'extend', label: 'Perpanjang Trial', desc: 'Tambah hari masa trial' },
                { id: 'shorten', label: 'Persingkat (Shorten)', desc: 'Kurangi sisa hari trial' },
                { id: 'convert_to_paid', label: 'Konversi ke Paid', desc: 'Jadikan Pro berbayar penuh' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAction(opt.id)}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    action === opt.id
                      ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {action === 'convert_to_paid' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Siklus Berbayar Setelah Konversi</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-2 px-3 rounded-lg border font-medium text-xs cursor-pointer transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Bulanan (Rp 29.000)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`py-2 px-3 rounded-lg border font-medium text-xs cursor-pointer transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Tahunan (Rp 290.000)
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {action === 'shorten' ? 'Jumlah Hari Dikurangi' : 'Durasi Hari Trial'}
              </label>
              <div className="flex items-center gap-2">
                {[3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      Number(days) === d
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d} Hari
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Catatan Admin (Opsional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Permintaan evaluasi dari tenant..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 text-xs cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Terapkan Konfigurasi Trial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 4. CANCEL SUBSCRIPTION MODAL (Batalkan Langganan)
 */
export function CancelSubscriptionModal({ subscription, token, isOpen, onClose, onSuccess }) {
  const [immediate, setImmediate] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setImmediate(false);
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !subscription) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/${subscription.user_id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ immediate, reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal membatalkan langganan');
      }
      onSuccess?.(json.message || 'Langganan berhasil dibatalkan');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <BanIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Batalkan Langganan</h3>
              <p className="text-[11px] text-slate-400 font-mono">@{subscription.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">Metode Pembatalan</label>
            <label
              onClick={() => setImmediate(false)}
              className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                !immediate ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900 shadow-2xs' : 'border-slate-200 hover:bg-slate-50/60'
              }`}
            >
              <input
                type="radio"
                checked={!immediate}
                onChange={() => setImmediate(false)}
                className="mt-0.5 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <div className="font-semibold text-slate-900">Batalkan di Akhir Periode (Graceful)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Akses Pro tetap aktif hingga {new Date(subscription.current_period_end).toLocaleDateString('id-ID')}
                </div>
              </div>
            </label>

            <label
              onClick={() => setImmediate(true)}
              className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                immediate ? 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600 shadow-2xs' : 'border-slate-200 hover:bg-slate-50/60'
              }`}
            >
              <input
                type="radio"
                checked={immediate}
                onChange={() => setImmediate(true)}
                className="mt-0.5 text-rose-600 focus:ring-rose-600"
              />
              <div>
                <div className="font-semibold text-rose-700">Cabut Sekarang & Turunkan ke Free</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Menghentikan akses Pro dan mengembalikan paket ke Free secara langsung
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Alasan Pembatalan</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Permintaan penghentian langganan oleh pemilik akun..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 text-xs cursor-pointer transition-colors"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Konfirmasi Pembatalan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 5. REFUND INVOICE MODAL (Proses Refund)
 */
export function RefundInvoiceModal({ invoice, token, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [downgradeToFree, setDowngradeToFree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setReason('Permintaan pengembalian dana (Garansi Kepuasan Pelanggan)');
      setDowngradeToFree(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/invoices/${invoice.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          downgrade_to_free: downgradeToFree,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memproses refund');
      }
      onSuccess?.(json.message || `Invoice ${invoice.invoice_number} berhasil di-refund`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Proses Refund Pembayaran</h3>
              <p className="text-[11px] font-mono text-slate-500">{invoice.invoice_number}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Paket / Layanan:</span>
              <span className="font-semibold text-slate-900">{invoice.plan_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nominal Dikembalikan:</span>
              <span className="font-semibold font-mono text-slate-900 text-sm">{formatIDR(invoice.total)}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Alasan Refund</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <input
              type="checkbox"
              checked={downgradeToFree}
              onChange={(e) => setDowngradeToFree(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Otomatis kembalikan status langganan user ke Free Tier</span>
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 text-xs cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Memproses Refund...' : `Proses Refund ${formatIDR(invoice.total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 6. PROMO CODE MODAL (Buat / Edit Kupon Diskon)
 */
export function PromoCodeModal({ promo, token, isOpen, onClose, onSuccess }) {
  const isEdit = Boolean(promo?.id);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [description, setDescription] = useState('');
  const [maxUses, setMaxUses] = useState(200);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (promo && isOpen) {
      setCode(promo.code || '');
      setDiscountPercent(promo.discount_percent || 20);
      setDescription(promo.description || '');
      setMaxUses(promo.max_uses || 100);
      setExpiresAt(promo.expires_at ? promo.expires_at.slice(0, 10) : '');
      setIsActive(promo.is_active !== false);
      setError(null);
    } else if (isOpen) {
      setCode('');
      setDiscountPercent(25);
      setDescription('');
      setMaxUses(250);
      setExpiresAt('');
      setIsActive(true);
      setError(null);
    }
  }, [promo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = isEdit ? `${API_BASE}/admin/promos/${promo.id}` : `${API_BASE}/admin/promos`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          discount_percent: Number(discountPercent),
          description,
          max_uses: Number(maxUses),
          is_active: isActive,
          expires_at: expiresAt,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan kupon promo');
      }
      onSuccess?.(json.message || 'Kupon promo berhasil disimpan');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <TagIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isEdit ? `Edit Kupon ${promo.code}` : 'Buat Kupon Promo Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">Voucher potongan harga langganan Klikin Pro</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Kupon</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CONTOH: PROMO50"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-semibold uppercase text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diskon (%)</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-semibold text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deskripsi Promo</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Diskon khusus pengguna baru"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batas Kuota Klaim</label>
              <input
                type="number"
                required
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batas Tanggal (Opsional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Kupon Aktif & Dapat Digunakan Saat Checkout</span>
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 text-xs cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : isEdit ? 'Perbarui Kupon' : 'Simpan Kupon Promo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 7. DUNNING REMINDER MODAL (Kirim Reminder Pembayaran Gagal)
 */
export function DunningReminderModal({ item, token, isOpen, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item && isOpen) {
      setMessage(
        `Halo ${item.full_name || item.username}, kami mendeteksi tagihan perpanjangan Klikin Pro (${item.failed_invoice_number}) sebesar ${formatIDR(item.overdue_amount)} belum berhasil terproses pada kartu berakhiran •••• ${item.payment_method_last4}. Mohon perbarui metode pembayaran Anda agar domain kustom dan fitur Pro tetap aktif.`
      );
      setError(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/dunning/${item.user_id}/remind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengirim pengingat pembayaran');
      }
      onSuccess?.(json.message || 'Pengingat dunning berhasil dikirim');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <MailIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Kirim Pengingat Pembayaran (Dunning)</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Penerima: {item.email} (@{item.username})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">Tagihan Tertunggak ({item.failed_invoice_number})</span>
              <span className="font-semibold text-slate-900 text-sm font-mono">{formatIDR(item.overdue_amount)}</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
              Terlambat {item.days_overdue} Hari • Reminder ke-{(item.dunning_reminder_count || 0) + 1}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Isi Pesan (Dikirim ke Email Transaksional & Notifikasi In-App User)
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 leading-relaxed transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 text-xs cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Mengirim...' : 'Kirim Email & Notifikasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
