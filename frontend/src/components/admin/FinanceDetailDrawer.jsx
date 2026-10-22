import React, { useState, useEffect } from 'react';
import {
  XIcon,
  CreditCardIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  ServerIcon,
  ShieldCheckIcon,
  EditIcon,
  TrashIcon,
} from '../Icons';

/**
 * Slide-Over Detail Drawer 360 derajat untuk Faktur / Biaya Operasional
 */
export default function FinanceDetailDrawer({
  isOpen,
  onClose,
  item,
  type = 'transaction', // 'transaction' | 'expense'
  onEditExpense,
  onDeleteExpense,
}) {
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    setActiveTab('summary');
  }, [item, type]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isTx = type === 'transaction';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {isTx ? 'Detail Faktur Keuangan' : 'Detail Biaya Infrastruktur'}
                </span>
                {isTx ? (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      item.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'failed'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.status === 'paid' ? 'Lunas' : item.status === 'failed' ? 'Gagal' : 'Refund'}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {item.category}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5 truncate">
                {isTx ? item.invoice_number : item.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Underline Tabs */}
          <div className="flex items-center border-b border-slate-200 px-5 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === 'summary'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Ringkasan & Nilai
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {isTx ? 'Profil Tenant' : 'Alokasi & Unit'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Catatan & Audit
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isTx ? (
              /* Transaction Drawer View */
              activeTab === 'summary' ? (
                <div className="space-y-4 text-xs">
                  {/* Amount Breakdown Card */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200/90 p-4 space-y-3">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Rincian Tagihan & Pajak
                    </span>
                    <div className="space-y-1.5 divide-y divide-slate-100">
                      <div className="flex items-center justify-between pb-1.5">
                        <span className="text-slate-500">Subtotal Layanan:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          Rp {Number(item.amount).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-500">Pajak PPN 11%:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          Rp {Number(item.tax).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-bold text-slate-900">Total Tagihan (Settled):</span>
                        <span className="font-mono font-bold text-slate-950 text-sm">
                          Rp {Number(item.total).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Card */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-2.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Informasi Transaksi
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Paket / Layanan</span>
                        <span className="font-medium text-slate-900">{item.plan_name || 'Klikin Pro'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Siklus Penagihan</span>
                        <span className="font-medium text-slate-900">
                          {item.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Metode Pembayaran</span>
                        <span className="font-mono font-medium text-slate-900 uppercase">
                          {item.payment_channel || 'QRIS'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Alasan Billing</span>
                        <span className="font-mono text-slate-700">{item.billing_reason || 'subscription_cycle'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block">Tanggal Pelunasan</span>
                        <span className="font-mono text-slate-700">
                          {item.paid_at
                            ? new Date(item.paid_at).toLocaleString('id-ID')
                            : new Date(item.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'details' ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Profil Akun Pembeli
                    </span>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nama Lengkap</span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {item.full_name || 'Pelanggan Klikin'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Email Terdaftar</span>
                        <span className="font-mono text-slate-800">{item.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Username / Halaman Bio</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-semibold text-indigo-700">@{item.username}</span>
                          {item.page_slug && (
                            <a
                              href={`/p/${item.page_slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-600 inline-flex items-center gap-0.5 text-[11px]"
                            >
                              <span>Lihat Halaman</span>
                              <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Catatan & Riwayat Audit
                    </span>
                    <p className="text-slate-600 italic">
                      {item.notes || 'Tidak ada catatan administratif khusus pada transaksi ini.'}
                    </p>
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      ID Transaksi Sistem: <span className="font-mono">{item.id}</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Expense Drawer View */
              activeTab === 'summary' ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 rounded-xl border border-slate-200/90 p-4 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Nilai Pengeluaran Operasional
                    </span>
                    <div className="text-2xl font-bold font-mono text-slate-900">
                      Rp {Number(item.amount).toLocaleString('id-ID')}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                      Siklus Penagihan: {item.billing_cycle || 'Bulanan'}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-2.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Rincian Vendor & Periode
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Vendor / Provider</span>
                        <span className="font-medium text-slate-900">{item.vendor}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Periode Anggaran</span>
                        <span className="font-mono font-medium text-slate-900">{item.month_period}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Tanggal Transaksi</span>
                        <span className="font-mono text-slate-700">
                          {item.incurred_date
                            ? new Date(item.incurred_date).toLocaleDateString('id-ID')
                            : new Date(item.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Kategori Biaya</span>
                        <span className="font-mono text-slate-700">{item.category}</span>
                      </div>
                    </div>
                  </div>

                  {item.receipt_url && (
                    <div className="bg-white rounded-xl border border-slate-200/90 p-4">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Bukti Bayar / Faktur Vendor
                      </span>
                      <a
                        href={item.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
                      >
                        <span>Buka Tautan Kuitansi</span>
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ) : activeTab === 'details' ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Alokasi Terhadap Unit Economics
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      Biaya ini dialokasikan langsung ke akun laba-rugi (P&L) Klikin pada periode {item.month_period}.
                      Mempengaruhi kalkulasi margin kotor dan margin laba bersih platform.
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                      <span>Status Deductible:</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Pajak & Operasional Diakui
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Catatan Administratif
                    </span>
                    <p className="text-slate-600">
                      {item.notes || 'Tidak ada catatan tambahan untuk biaya ini.'}
                    </p>
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      Dicatat oleh: <span className="font-mono">{item.created_by || 'Super Administrator'}</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Drawer Footer Actions */}
          {!isTx && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  onDeleteExpense(item);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Hapus Biaya</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onEditExpense(item);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>Edit Biaya</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
