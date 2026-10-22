import React, { useState, useEffect } from 'react';
import {
  GlobeIcon,
  LockIcon,
  ServerIcon,
  RefreshCwIcon,
  MailIcon,
  ShieldAlertIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SettingsIcon,
} from '../Icons';

function formatDateID(dateStr) {
  if (!dateStr) return 'Belum pernah dicek';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Waktu tidak valid';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDomainStatusBadge(status) {
  const s = (status || 'pending').toLowerCase();
  switch (s) {
    case 'active':
      return {
        label: 'ACTIVE',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'verifying':
      return {
        label: 'VERIFYING',
        cls: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      };
    case 'error':
      return {
        label: 'ERROR',
        cls: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    case 'expired':
      return {
        label: 'EXPIRED',
        cls: 'bg-slate-200 text-slate-800 border-slate-300',
      };
    default:
      return {
        label: 'PENDING',
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
      };
  }
}

function getSSLStatusBadge(sslStatus) {
  const s = (sslStatus || 'provisioning').toLowerCase();
  switch (s) {
    case 'active':
      return {
        label: 'SSL ACTIVE',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'failed':
      return {
        label: 'SSL FAILED',
        cls: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    case 'expired':
      return {
        label: 'SSL EXPIRED',
        cls: 'bg-slate-200 text-slate-800 border-slate-300',
      };
    default:
      return {
        label: 'PROVISIONING',
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
      };
  }
}

export default function DomainDetailDrawer({
  isOpen,
  loading,
  error,
  detail,
  actionLoading,
  onClose,
  onReverifyDNS,
  onOpenTriggerSSL,
  onOpenSendGuide,
  onOpenReleaseDomain,
  onOpenUpdateStatus,
}) {
  const [activeTab, setActiveTab] = useState('dns');
  const [copiedKey, setCopiedKey] = useState(null);

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

  if (!isOpen) return null;

  const domain = detail?.domain;
  const diagLogs = detail?.diagnostic_logs || [];
  const emailLogs = detail?.email_logs || [];
  const notifications = detail?.notifications || [];

  const handleCopy = (key, value) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const domBadge = getDomainStatusBadge(domain?.status);
  const sslBadge = getSSLStatusBadge(domain?.ssl_status);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-950/50"
      role="dialog"
      aria-modal="true"
      aria-label="Inspektur Diagnostik Domain Kustom"
    >
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <GlobeIcon className="w-5 h-5 text-slate-900 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-mono truncate">
                {domain?.domain || 'Memuat Domain...'}
              </h3>
              {domain && (
                <>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${domBadge.cls}`}>
                    {domBadge.label}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${sslBadge.cls}`}>
                    {sslBadge.label}
                  </span>
                </>
              )}
            </div>
            {domain && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span>
                  Target Bio:{' '}
                  <a
                    href={`/${domain.page_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-slate-900 underline hover:text-indigo-700"
                  >
                    /{domain.page_slug}
                  </a>
                </span>
                <span>•</span>
                <span>
                  Pemilik: <strong className="text-slate-900">@{domain.owner_username}</strong> ({domain.owner_email})
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel detail domain"
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer shrink-0"
          >
            Tutup (Esc)
          </button>
        </div>

        {/* Action Toolbar */}
        {domain && (
          <div className="px-5 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onReverifyDNS(domain.id, false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Re-Verify DNS</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenTriggerSSL(domain)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              <LockIcon className="w-3.5 h-3.5" />
              <span>Trigger Ulang SSL</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSendGuide(domain)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              <MailIcon className="w-3.5 h-3.5" />
              <span>Kirim Panduan DNS</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenUpdateStatus(domain)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Ubah Status</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenReleaseDomain(domain)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold focus-visible:ring-2 focus-visible:ring-rose-700 cursor-pointer ml-auto"
            >
              <ShieldAlertIcon className="w-3.5 h-3.5" />
              <span>Lepas Domain</span>
            </button>
          </div>
        )}

        {/* Sub-Tabs */}
        <div className="px-5 sm:px-6 border-b border-slate-200 bg-slate-50/40 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'dns', label: 'Konfigurasi DNS & SSL' },
            { id: 'logs', label: `Log Diagnostik DNS (${diagLogs.length})` },
            { id: 'comms', label: `Riwayat Panduan (${emailLogs.length + notifications.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-600 space-y-3">
              <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
              <p className="font-mono text-xs">Memuat telemetri DNS dan sertifikat SSL...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3">
              <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">Gagal Memuat Detail Domain</p>
                <p className="text-rose-800 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && domain && activeTab === 'dns' && (
            <div className="space-y-5">
              {/* Current Diagnostic Alert */}
              {domain.error_message ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Kendala Resolusi DNS / SSL Terdeteksi</span>
                    </div>
                    {domain.last_error_code && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 border border-rose-300 font-mono text-[10px] font-bold text-rose-900">
                        {domain.last_error_code}
                      </span>
                    )}
                  </div>
                  <p className="text-rose-800 leading-relaxed">{domain.error_message}</p>
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onReverifyDNS(domain.id, true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Force Verify & Aktifkan Sekarang
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSendGuide(domain)}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-100 text-rose-900 font-bold text-[11px] cursor-pointer"
                    >
                      Kirim Instruksi Perbaikan ke Owner
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <p className="font-bold">Resolusi DNS & Sertifikat SSL Berjalan Normal</p>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Trafik menuju {domain.domain} diteruskan secara aman ke halaman /{domain.page_slug}.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/${domain.page_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold text-[11px] hover:bg-emerald-100 shrink-0"
                  >
                    <span>Buka Halaman</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Expected DNS Records Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ServerIcon className="w-4 h-4 text-slate-700" />
                    <h4 className="font-bold text-slate-900">Konfigurasi Record DNS Wajib</h4>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600">
                    Dicek {domain.check_count || 0}x • Terakhir: {formatDateID(domain.last_checked_at)}
                  </span>
                </div>

                <div className="divide-y divide-slate-200">
                  {(domain.dns_records || []).map((rec) => (
                    <div key={rec.type} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold">
                            {rec.type}
                          </span>
                          <span className="text-slate-600 font-medium">{rec.description}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(rec.type, rec.expected)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] cursor-pointer"
                        >
                          {copiedKey === rec.type ? <CheckIcon className="w-3 h-3 text-emerald-600" /> : <CopyIcon className="w-3 h-3" />}
                          <span>{copiedKey === rec.type ? 'Disalin' : 'Salin Target'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] font-semibold text-slate-500 block">Host / Name</span>
                          <span className="font-mono font-bold text-slate-900 break-all">{rec.host}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] font-semibold text-slate-500 block">Expected Value / Points To</span>
                          <span className="font-mono font-bold text-slate-900 break-all">{rec.expected}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SSL & Routing Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <LockIcon className="w-4 h-4 text-slate-700" />
                    <span>Detail Sertifikat SSL/TLS</span>
                  </div>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Otoritas Penerbit:</span>
                      <span className="font-mono font-bold text-slate-900">{domain.ssl_issuer || "Let's Encrypt R3"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status Sertifikat:</span>
                      <span className="font-mono font-bold uppercase text-slate-900">{domain.ssl_status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kedaluwarsa SSL:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {domain.ssl_expires_at ? formatDateID(domain.ssl_expires_at) : 'Belum diterbitkan'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <GlobeIcon className="w-4 h-4 text-slate-700" />
                    <span>Routing & Kepemilikan Tenant</span>
                  </div>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Redirect WWW:</span>
                      <span className="font-bold text-slate-900">{domain.redirect_www ? 'Aktif (301)' : 'Nonaktif'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fallback Subdomain:</span>
                      <span className="font-bold text-slate-900">{domain.fallback_subdomain ? 'Aktif' : 'Nonaktif'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Panduan DNS Dikirim:</span>
                      <span className="font-mono font-bold text-slate-900">{domain.guide_sent_count || 0} kali</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && activeTab === 'logs' && (
            <div className="space-y-3">
              {diagLogs.length === 0 ? (
                <div className="p-8 rounded-2xl border border-slate-200 text-center text-slate-600">
                  Belum ada catatan log diagnostik DNS untuk domain ini.
                </div>
              ) : (
                diagLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                            log.severity === 'error' || log.severity === 'critical'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : log.severity === 'warning'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {log.event_type}
                        </span>
                        {log.error_code && (
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            [{log.error_code}]
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-600">{formatDateID(log.created_at)}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{log.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-mono pt-0.5">
                      <span>Aktor: {log.actor_name || 'System'}</span>
                      {log.resolved_cname && <span>• CNAME: {log.resolved_cname}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && !error && activeTab === 'comms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">Riwayat Pengiriman Panduan & Notifikasi Domain</h4>
                <button
                  type="button"
                  onClick={() => onOpenSendGuide(domain)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-800 cursor-pointer"
                >
                  + Kirim Panduan Baru
                </button>
              </div>

              {emailLogs.length === 0 && notifications.length === 0 ? (
                <div className="p-8 rounded-2xl border border-slate-200 text-center text-slate-600">
                  Belum ada riwayat email panduan atau notifikasi domain untuk pengguna ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {emailLogs.map((em) => (
                    <div key={em.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold">
                            EMAIL
                          </span>
                          <span className="font-bold text-slate-900">{em.subject}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-mono">
                          Tujuan: {em.recipient} • Status: {em.status}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-600 shrink-0">{formatDateID(em.sent_at)}</span>
                    </div>
                  ))}

                  {notifications.map((nf) => (
                    <div key={nf.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono text-[10px] font-bold">
                            IN-APP
                          </span>
                          <span className="font-bold text-slate-900">{nf.title}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{nf.message}</p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-600 shrink-0">{formatDateID(nf.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
