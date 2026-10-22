import React, { useState, useEffect } from 'react';
import {
  GlobeIcon,
  LockIcon,
  MailIcon,
  ShieldAlertIcon,
  SettingsIcon,
  CopyIcon,
  CheckIcon,
  AlertCircleIcon,
} from '../Icons';

function useEscapeClose(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}

export function TriggerSSLModal({ isOpen, domainItem, loading, onClose, onConfirm }) {
  const [issuer, setIssuer] = useState("Let's Encrypt R3");
  const [validityDays, setValidityDays] = useState(90);
  const [forceActivate, setForceActivate] = useState(true);
  const [reason, setReason] = useState('');

  useEscapeClose(isOpen, onClose);

  useEffect(() => {
    if (domainItem) {
      setIssuer(domainItem.ssl_issuer || "Let's Encrypt R3");
      setValidityDays(90);
      setForceActivate(domainItem.status === 'error' || domainItem.status === 'pending');
      setReason('');
    }
  }, [domainItem, isOpen]);

  if (!isOpen || !domainItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(domainItem.id, {
      issuer,
      validity_days: Number(validityDays),
      force_activate: forceActivate,
      reason: reason.trim() || 'Pembaruan sertifikat SSL manual oleh Super Admin',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ssl-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <LockIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="ssl-modal-title" className="text-base font-bold text-slate-900">
                Trigger Provisioning Sertifikat SSL
              </h3>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                {domainItem.domain} (/{domainItem.page_slug})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Status DNS Saat Ini:</span>
              <span className="font-mono font-bold uppercase text-slate-900">{domainItem.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Status SSL Saat Ini:</span>
              <span className="font-mono font-bold uppercase text-slate-900">{domainItem.ssl_status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ssl-issuer" className="block font-bold text-slate-700 mb-1.5">
                Otoritas Sertifikat (CA)
              </label>
              <select
                id="ssl-issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="Let's Encrypt R3">Let&apos;s Encrypt R3 (ACME)</option>
                <option value="Let's Encrypt E1 (ECDSA)">Let&apos;s Encrypt E1 (ECDSA)</option>
                <option value="ZeroSSL DV CA">ZeroSSL DV CA</option>
                <option value="Cloudflare Edge TLS">Cloudflare Edge TLS</option>
              </select>
            </div>

            <div>
              <label htmlFor="ssl-validity" className="block font-bold text-slate-700 mb-1.5">
                Masa Berlaku Sertifikat
              </label>
              <select
                id="ssl-validity"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value={90}>90 Hari (Standar Auto-Renew)</option>
                <option value={180}>180 Hari (Extended Edge)</option>
                <option value={365}>365 Hari (1 Tahun)</option>
              </select>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
            <input
              type="checkbox"
              checked={forceActivate}
              onChange={(e) => setForceActivate(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <span className="font-bold text-slate-900 block">
                Paksa Aktifkan SSL & Sinkronkan Status Domain
              </span>
              <span className="text-slate-600 text-[11px] leading-relaxed">
                Jika dicentang, penerbitan SSL tetap dijalankan meskipun cache resolver lokal masih berstatus pending atau error, sekaligus mengaktifkan domain pada halaman bio tenant.
              </span>
            </div>
          </label>

          <div>
            <label htmlFor="ssl-reason" className="block font-bold text-slate-700 mb-1.5">
              Catatan Diagnostik (Opsional)
            </label>
            <input
              id="ssl-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Pembaruan sertifikat setelah propagasi CNAME selesai"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              {loading ? 'Memproses SSL...' : 'Terbitkan Ulang SSL Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SendDNSGuideModal({ isOpen, domainItem, loading, onClose, onConfirm }) {
  const [channel, setChannel] = useState('both');
  const [customMessage, setCustomMessage] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  useEscapeClose(isOpen, onClose);

  useEffect(() => {
    if (domainItem) {
      setChannel('both');
      setCustomMessage('');
    }
  }, [domainItem, isOpen]);

  if (!isOpen || !domainItem) return null;

  const records = domainItem.dns_records || [];

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(domainItem.id, {
      channel,
      custom_message: customMessage.trim(),
      include_txt: true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <MailIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="guide-modal-title" className="text-base font-bold text-slate-900">
                Kirim Panduan Konfigurasi DNS ke Pengguna
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Penerima: <span className="font-semibold text-slate-900">@{domainItem.owner_username}</span> ({domainItem.owner_email || 'email terdaftar'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Record DNS yang Akan Dikirimkan</span>
              <span className="font-mono text-[11px] text-slate-600">{domainItem.domain}</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {records.map((rec) => (
                <div key={rec.type} className="p-3 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold">
                      {rec.type} RECORD
                    </span>
                    <span className="text-[11px] text-slate-600 font-mono">TTL: {rec.TTL || rec.ttl || 'Auto / 3600'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1">
                    <div className="sm:col-span-4">
                      <span className="text-[10px] font-semibold text-slate-500 block">Host / Name</span>
                      <span className="font-mono font-bold text-slate-900 break-all">{rec.host}</span>
                    </div>
                    <div className="sm:col-span-6">
                      <span className="text-[10px] font-semibold text-slate-500 block">Target / Value</span>
                      <span className="font-mono font-bold text-slate-900 break-all">{rec.expected}</span>
                    </div>
                    <div className="sm:col-span-2 flex sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopy(rec.type, `${rec.type} | Host: ${rec.host} | Value: ${rec.expected}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] cursor-pointer"
                      >
                        {copiedField === rec.type ? <CheckIcon className="w-3 h-3 text-emerald-600" /> : <CopyIcon className="w-3 h-3" />}
                        <span>{copiedField === rec.type ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="guide-channel" className="block font-bold text-slate-700 mb-1.5">
              Kanal Pengiriman
            </label>
            <select
              id="guide-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <option value="both">Notifikasi In-App & Email Transaksional (Direkomendasikan)</option>
              <option value="email">Email Transaksional Saja ({domainItem.owner_email || 'Email Owner'})</option>
              <option value="in_app">Notifikasi Dashboard Owner Saja</option>
            </select>
          </div>

          <div>
            <label htmlFor="guide-custom-note" className="block font-bold text-slate-700 mb-1.5">
              Pesan Tambahan untuk Pengguna (Opsional)
            </label>
            <textarea
              id="guide-custom-note"
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Contoh: Mohon hapus A Record lama menuju IP parking registrar Anda agar CNAME cname.klikin.id dapat tervalidasi."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              {loading ? 'Mengirim Panduan...' : 'Kirim Panduan DNS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReleaseDomainModal({ isOpen, domainItem, loading, onClose, onConfirm }) {
  const [category, setCategory] = useState('abuse');
  const [reason, setReason] = useState('');
  const [addToBlacklist, setAddToBlacklist] = useState(false);
  const [unpublishPage, setUnpublishPage] = useState(false);
  const [suspendOwner, setSuspendOwner] = useState(false);
  const [notifyOwner, setNotifyOwner] = useState(true);

  useEscapeClose(isOpen, onClose);

  useEffect(() => {
    if (domainItem) {
      setCategory('abuse');
      setReason('');
      setAddToBlacklist(false);
      setUnpublishPage(false);
      setSuspendOwner(false);
      setNotifyOwner(true);
    }
  }, [domainItem, isOpen]);

  if (!isOpen || !domainItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(domainItem.id, {
      category,
      reason: reason.trim(),
      add_to_blacklist: addToBlacklist,
      unpublish_page: unpublishPage,
      suspend_owner: suspendOwner,
      notify_owner: notifyOwner,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlertIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="release-modal-title" className="text-base font-bold text-slate-900">
                Lepas Domain Kustom (Force Detach)
              </h3>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                {domainItem.domain} dari halaman /{domainItem.page_slug}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 leading-relaxed">
            Tindakan ini akan memutus tautan domain <strong className="font-mono">{domainItem.domain}</strong> dari halaman{' '}
            <strong className="font-mono">/{domainItem.page_slug}</strong> (@{domainItem.owner_username}) dan mengembalikan akses halaman ke subdomain standar Klikin.
          </div>

          <div>
            <label htmlFor="release-category" className="block font-bold text-slate-700 mb-1.5">
              Kategori Pelepasan Domain
            </label>
            <select
              id="release-category"
              value={category}
              onChange={(e) => {
                const val = e.target.value;
                setCategory(val);
                if (val === 'phishing' || val === 'gambling') {
                  setAddToBlacklist(true);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <option value="abuse">Penyalahgunaan Layanan (Abuse / Spam)</option>
              <option value="phishing">Indikasi Phishing / Penipuan</option>
              <option value="gambling">Konten Judi Online Ilegal</option>
              <option value="trademark">Pelanggaran Merek Dagang (Trademark Dispute)</option>
              <option value="expired_plan">Paket Pro Kedaluwarsa / Nonaktif</option>
              <option value="owner_request">Permintaan Resmi Pemilik Akun</option>
            </select>
          </div>

          <div>
            <label htmlFor="release-reason" className="block font-bold text-slate-700 mb-1.5">
              Alasan Pelepasan (Wajib untuk Audit Log) *
            </label>
            <textarea
              id="release-reason"
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan alasan pelepasan domain secara spesifik..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <span className="block font-bold text-slate-800">Tindakan Penegakan Terpadu (Sinkronisasi Lintas Modul)</span>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={addToBlacklist}
                onChange={(e) => setAddToBlacklist(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-600"
              />
              <div>
                <span className="font-bold text-slate-900 block">Masukkan Domain ke Daftar Hitam (Blacklist Moderasi)</span>
                <span className="text-slate-600 text-[11px]">
                  Mencegah pengguna mana pun mendaftarkan ulang atau menautkan {domainItem.domain}.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={unpublishPage}
                onChange={(e) => setUnpublishPage(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-600"
              />
              <div>
                <span className="font-bold text-slate-900 block">Unpublish & Flag Halaman Bio (/{domainItem.page_slug})</span>
                <span className="text-slate-600 text-[11px]">
                  Menonaktifkan sementara halaman publik tenant dan menandainya di antrean Moderasi Konten.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={suspendOwner}
                onChange={(e) => setSuspendOwner(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-600"
              />
              <div>
                <span className="font-bold text-slate-900 block">Suspend Akun Pemilik (@{domainItem.owner_username})</span>
                <span className="text-slate-600 text-[11px]">
                  Membekukan akses login pemilik akun karena pelanggaran kebijakan domain.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOwner}
                onChange={(e) => setNotifyOwner(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="font-bold text-slate-900 block">Kirim Pemberitahuan Resmi ke Pemilik</span>
                <span className="text-slate-600 text-[11px]">
                  Mengirimkan notifikasi dashboard dan email transaksional terkait pelepasan domain.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold focus-visible:ring-2 focus-visible:ring-rose-700 cursor-pointer"
            >
              {loading ? 'Melepas Domain...' : 'Lepas Domain Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UpdateDomainStatusModal({ isOpen, domainItem, loading, onClose, onConfirm }) {
  const [status, setStatus] = useState('active');
  const [sslStatus, setSslStatus] = useState('active');
  const [errorCode, setErrorCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [reason, setReason] = useState('');

  useEscapeClose(isOpen, onClose);

  useEffect(() => {
    if (domainItem) {
      setStatus(domainItem.status || 'pending');
      setSslStatus(domainItem.ssl_status || 'provisioning');
      setErrorCode(domainItem.last_error_code || '');
      setErrorMessage(domainItem.error_message || '');
      setReason('');
    }
  }, [domainItem, isOpen]);

  if (!isOpen || !domainItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(domainItem.id, {
      status,
      ssl_status: sslStatus,
      error_code: errorCode.trim(),
      error_message: errorMessage.trim(),
      reason: reason.trim() || 'Penyesuaian status administratif oleh Super Admin',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="override-modal-title" className="text-base font-bold text-slate-900">
                Ubah Status Domain & SSL Manual
              </h3>
              <p className="text-xs text-slate-600 font-mono mt-0.5">{domainItem.domain}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ovr-dns-status" className="block font-bold text-slate-700 mb-1.5">
                Status Domain (DNS)
              </label>
              <select
                id="ovr-dns-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="pending">pending (Menunggu DNS)</option>
                <option value="verifying">verifying (Sedang Diverifikasi)</option>
                <option value="active">active (Aktif Terhubung)</option>
                <option value="error">error (Gagal Resolusi DNS)</option>
                <option value="expired">expired (Kedaluwarsa)</option>
              </select>
            </div>

            <div>
              <label htmlFor="ovr-ssl-status" className="block font-bold text-slate-700 mb-1.5">
                Status Sertifikat SSL
              </label>
              <select
                id="ovr-ssl-status"
                value={sslStatus}
                onChange={(e) => setSslStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="provisioning">provisioning (Sedang Diterbitkan)</option>
                <option value="active">active (SSL Aktif)</option>
                <option value="failed">failed (Gagal ACME Challenge)</option>
                <option value="expired">expired (Sertifikat Kedaluwarsa)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ovr-err-code" className="block font-bold text-slate-700 mb-1.5">
              Kode Diagnostik / Error (Opsional)
            </label>
            <input
              id="ovr-err-code"
              type="text"
              value={errorCode}
              onChange={(e) => setErrorCode(e.target.value)}
              placeholder="Contoh: DNS_CNAME_MISMATCH, CAA_RESTRICTION, atau kosongkan jika normal"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div>
            <label htmlFor="ovr-err-msg" className="block font-bold text-slate-700 mb-1.5">
              Pesan Diagnostik DNS (Ditampilkan ke Owner)
            </label>
            <textarea
              id="ovr-err-msg"
              rows={2}
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Kosongkan apabila domain berstatus active normal..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div>
            <label htmlFor="ovr-reason" className="block font-bold text-slate-700 mb-1.5">
              Catatan Audit Admin
            </label>
            <input
              id="ovr-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Alasan perubahan status manual..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminAddDomainModal({ isOpen, loading, onClose, onConfirm }) {
  const [pageSlug, setPageSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [redirectWWW, setRedirectWWW] = useState(true);
  const [fallbackSubdomain, setFallbackSubdomain] = useState(true);
  const [autoVerify, setAutoVerify] = useState(true);
  const [localError, setLocalError] = useState(null);

  useEscapeClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setPageSlug('');
      setDomain('');
      setRedirectWWW(true);
      setFallbackSubdomain(true);
      setAutoVerify(true);
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pageSlug.trim() || !domain.trim()) {
      setLocalError('Slug halaman tujuan dan nama domain kustom wajib diisi.');
      return;
    }
    setLocalError(null);
    onConfirm({
      page_slug: pageSlug.trim(),
      domain: domain.trim().toLowerCase(),
      redirect_www: redirectWWW,
      fallback_subdomain: fallbackSubdomain,
      auto_verify: autoVerify,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-domain-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <GlobeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-domain-modal-title" className="text-base font-bold text-slate-900">
                Hubungkan Domain Kustom ke Halaman Tenant
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Provisioning langsung domain kustom ke slug halaman bio pengguna
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="add-page-slug" className="block font-bold text-slate-700 mb-1.5">
              Slug Halaman Bio Tujuan *
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-slate-900">
              <span className="px-3 py-2.5 bg-slate-100 text-slate-600 font-mono border-r border-slate-300">
                klikin.id/
              </span>
              <input
                id="add-page-slug"
                type="text"
                required
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                placeholder="kopiseduh atau creativestudio"
                className="w-full px-3 py-2.5 font-mono text-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label htmlFor="add-domain-name" className="block font-bold text-slate-700 mb-1.5">
              Nama Domain Kustom *
            </label>
            <input
              id="add-domain-name"
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Contoh: link.brandanda.co.id"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoVerify}
                onChange={(e) => setAutoVerify(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="font-bold text-slate-900">
                Verifikasi Otomatis & Terbitkan Sertifikat SSL Sekarang
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={redirectWWW}
                onChange={(e) => setRedirectWWW(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-slate-700 font-medium">
                Aktifkan Redirect Otomatis Subdomain www
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fallbackSubdomain}
                onChange={(e) => setFallbackSubdomain(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-slate-700 font-medium">
                Pertahankan Fallback ke klikin.id/slug Saat DNS Gangguan
              </span>
            </label>
          </div>

          {localError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{localError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              {loading ? 'Menghubungkan...' : 'Hubungkan Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
