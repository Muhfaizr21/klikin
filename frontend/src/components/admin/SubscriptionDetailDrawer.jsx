import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../lib/api';
import {
  XIcon,
  CreditCardIcon,
  SparklesIcon,
  ClockIcon,
  BanIcon,
  VerifiedBadgeIcon,
} from '../Icons';

const formatIDR = (val) => `Rp ${(Number(val) || 0).toLocaleString('id-ID')}`;

export default function SubscriptionDetailDrawer({
  userId,
  token,
  isOpen,
  onClose,
  onOpenChangePlan,
  onOpenGoodwill,
  onOpenTrial,
  onOpenCancel,
  onOpenRefund,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'invoices' | 'logs'
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memuat detail langganan');
      }
      setDetail(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchDetail();
    } else {
      setDetail(null);
      setActiveTab('overview');
    }
  }, [isOpen, userId, fetchDetail]);

  if (!isOpen) return null;

  const sub = detail?.subscription;
  const user = detail?.user;
  const invoices = detail?.invoices || [];
  const logs = detail?.activity_logs || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
              {(user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'T').toUpperCase()}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {user?.full_name || user?.username || 'Memuat Tenant...'}
                </h3>
                {user?.is_verified && <VerifiedBadgeIcon className="w-4 h-4 text-sky-500 shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                @{user?.username} • {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-navigation Tabs (Underline) */}
        <div className="px-6 border-b border-slate-200/80 bg-white flex items-center gap-5">
          {[
            { id: 'overview', label: 'Profil Langganan' },
            { id: 'invoices', label: `Riwayat Invoice (${invoices.length})` },
            { id: 'logs', label: `Audit Billing (${logs.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'border-slate-900 text-slate-900 -mb-[1px]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
              <span>Memuat rincian langganan & faktur...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {error}
            </div>
          ) : detail && sub ? (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Subscription Summary Card */}
                  <div className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          Paket & Siklus Aktif
                        </span>
                        <div className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                          <span>{sub.plan === 'pro' ? 'Klikin Pro' : 'Free Tier'}</span>
                          <span className="text-xs font-normal text-slate-500">
                            ({sub.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          sub.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sub.status === 'trial'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : sub.status === 'past_due'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {sub.status === 'active'
                          ? 'Aktif'
                          : sub.status === 'trial'
                          ? 'Trial'
                          : sub.status === 'past_due'
                          ? 'Past Due'
                          : sub.status === 'canceled'
                          ? 'Dibatalkan'
                          : 'Kedaluwarsa'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Tarif Langganan</span>
                        <span className="font-semibold font-mono text-slate-900 text-sm">
                          {formatIDR(sub.price)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Akhir Periode</span>
                        <span className="font-medium text-slate-900">
                          {new Date(sub.current_period_end).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Sisa Masa Aktif</span>
                        <span
                          className={`font-semibold font-mono ${
                            detail.days_remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {detail.days_remaining} hari
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Metode Pembayaran</span>
                        <span className="font-mono text-xs text-slate-800">
                          {sub.payment_method_brand || 'Kartu Kredit'} •••• {sub.payment_method_last4 || '4242'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Kupon Promo Terpakai</span>
                        <span className="font-mono font-medium text-slate-800">
                          {sub.applied_promo_code
                            ? `${sub.applied_promo_code} (-${sub.discount_percent}%)`
                            : 'Tidak ada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">ID Langganan</span>
                        <span className="font-mono text-[11px] text-slate-500">{sub.id}</span>
                      </div>
                    </div>

                    {sub.admin_notes && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700">
                        <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                          Catatan Internal Admin:
                        </span>
                        <p>{sub.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Administrative Controls */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-700">
                      Tindakan Administratif
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => onOpenChangePlan?.({ ...sub, username: user.username, email: user.email })}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">Ubah Paket Manual</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Upgrade atau downgrade paket</div>
                        </div>
                        <CreditCardIcon className="w-4 h-4 text-slate-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenGoodwill?.({ ...sub, username: user.username, email: user.email })}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">Perpanjang Goodwill</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Tambah hari masa aktif gratis</div>
                        </div>
                        <SparklesIcon className="w-4 h-4 text-slate-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenTrial?.({ ...sub, username: user.username, email: user.email })}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">Kelola Masa Trial</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Perpanjang atau konversi ke berbayar</div>
                        </div>
                        <ClockIcon className="w-4 h-4 text-slate-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCancel?.({ ...sub, username: user.username, email: user.email })}
                        className="p-3.5 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/30 hover:bg-rose-50 text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <div className="font-semibold text-rose-900">Batalkan Langganan</div>
                          <div className="text-[11px] text-rose-600 mt-0.5">Cabut akses atau jadwalkan berhenti</div>
                        </div>
                        <BanIcon className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'invoices' && (
                <div className="space-y-3">
                  {invoices.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Belum ada riwayat invoice untuk tenant ini.
                    </div>
                  ) : (
                    invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900">{inv.invoice_number}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : inv.status === 'refunded'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {inv.status === 'paid' ? 'Lunas' : inv.status === 'refunded' ? 'Refund' : 'Gagal'}
                            </span>
                          </div>
                          <div className="text-slate-800 font-medium">{inv.plan_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {new Date(inv.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            • Subtotal {formatIDR(inv.amount)} + PPN {formatIDR(inv.tax)}
                          </div>
                          {inv.refund_reason && (
                            <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 mt-1">
                              Refund: {inv.refund_reason}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <span className="font-mono font-semibold text-sm text-slate-900 block">
                              {formatIDR(inv.total)}
                            </span>
                          </div>
                          {inv.status === 'paid' && inv.total > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenRefund?.(inv)}
                              className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-xs transition-colors cursor-pointer"
                            >
                              Proses Refund
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-2.5">
                  {logs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">Belum ada catatan aktivitas billing.</div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-lg border border-slate-200/80 bg-white shadow-2xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <span className="font-mono font-semibold text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {log.action}
                          </span>
                          <p className="text-slate-700 mt-1.5">{log.details}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            User ID: {userId}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer shadow-2xs transition-colors"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
}
