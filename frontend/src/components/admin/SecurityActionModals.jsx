import React, { useState, useEffect } from 'react';
import {
  XIcon,
  ShieldIcon,
  ShieldAlertIcon,
  DatabaseIcon,
  SearchIcon,
} from '../Icons';

/**
 * SecurityActionModals - Dedicated interactive modals for Super Admin Security & Audit (Section 3.10)
 * Adheres strictly to antislop: Zero em-dashes, full keyboard accessibility (Escape to close),
 * WCAG AA contrast, and zero dead buttons. Uses real SVG icons throughout.
 */

// Modal 1: Add IP to Blacklist
export function AddBlacklistIPModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [ipAddress, setIpAddress] = useState('');
  const [reason, setReason] = useState('');
  const [durationDays, setDurationDays] = useState('0'); // 0 = permanent
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!ipAddress.trim()) {
      setError('Alamat IP wajib diisi.');
      return;
    }
    if (!reason.trim()) {
      setError('Alasan pemblokiran wajib diisi.');
      return;
    }

    onSubmit({
      ip_address: ipAddress.trim(),
      reason: reason.trim(),
      duration_days: parseInt(durationDays, 10),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-blacklist-title"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <ShieldAlertIcon className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 id="add-blacklist-title" className="text-base font-bold text-slate-900">
                Blacklist Alamat IP
              </h3>
              <p className="text-xs text-slate-500">Blokir akses traffic berbahaya secara instan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat IP (IPv4 atau IPv6) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 198.51.100.44"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan Pemblokiran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Brute-force login probe berulang"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Durasi Pemblokiran
            </label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="0">Permanen (Tanpa batas waktu)</option>
              <option value="1">1 Hari (24 Jam)</option>
              <option value="7">7 Hari (1 Minggu)</option>
              <option value="30">30 Hari (1 Bulan)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
            >
              {isSubmitting ? 'Memblokir...' : 'Blokir IP Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal 2: Trigger Manual Backup
export function TriggerBackupModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [backupType, setBackupType] = useState('manual');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      backup_type: backupType,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trigger-backup-title"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DatabaseIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 id="trigger-backup-title" className="text-base font-bold text-slate-900">
                Picu Backup Database Manual
              </h3>
              <p className="text-xs text-slate-500">Buat snapshot instan data platform PostgreSQL</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipe Backup Data
            </label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="manual">Full Database Snapshot (Data + Skema)</option>
              <option value="schema_only">Struktur Skema DDL Saja</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Snapshot akan mengompresi 33 tabel inti Klikin dalam arsip SQL .gz terenkripsi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Alasan Backup (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Pencadangan berkala sebelum pembaruan rute DNS & gateway"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-slate-700 cursor-pointer"
            >
              {isSubmitting ? 'Memproses Backup...' : 'Mulai Backup Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal 3: Error Detail with Stack Trace
export function ErrorDetailModal({ isOpen, onClose, errorLog, onToggleResolve, isResolving }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !errorLog) return null;

  const severityColor = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    error: 'bg-amber-50 text-amber-700 border-amber-200',
    warning: 'bg-blue-50 text-blue-700 border-blue-200',
  }[errorLog.severity] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-detail-title"
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${severityColor}`}>
              {errorLog.severity}
            </span>
            <h3 id="error-detail-title" className="text-base font-bold text-slate-900">
              Detail Log Error Aplikasi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Status Code</span>
              <span className="font-mono font-bold text-slate-900">{errorLog.status_code || 500}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Metode & Endpoint</span>
              <span className="font-mono font-semibold text-slate-900 truncate block">
                {errorLog.method} {errorLog.endpoint}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">IP Address</span>
              <span className="font-mono text-slate-900">{errorLog.ip_address || 'Internal'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Waktu Terjadi</span>
              <span className="text-slate-900">
                {new Date(errorLog.created_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">Pesan Error</span>
            <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-xs font-mono text-rose-900">
              {errorLog.message}
            </div>
          </div>

          {errorLog.stack_trace && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Stack Trace Snippet</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap max-h-56">
                {errorLog.stack_trace}
              </pre>
            </div>
          )}

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 block">Status Resolusi:</span>
              <span className="text-slate-500">
                {errorLog.resolved
                  ? `Sudah diselesaikan oleh ${errorLog.resolved_by || 'Admin'}`
                  : 'Belum ditangani (Aktif)'}
              </span>
            </div>
            <button
              type="button"
              disabled={isResolving}
              onClick={() => onToggleResolve(errorLog.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors shadow-2xs cursor-pointer ${
                errorLog.resolved
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isResolving ? 'Memperbarui...' : errorLog.resolved ? 'Buka Kembali' : 'Tandai Selesai'}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal 4: Audit Detail with Payload JSON
export function AuditDetailModal({ isOpen, onClose, auditLog }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !auditLog) return null;

  let parsedDetails = null;
  try {
    if (auditLog.details_json) {
      parsedDetails = JSON.parse(auditLog.details_json);
    }
  } catch (e) {
    parsedDetails = auditLog.details_json;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <SearchIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 id="audit-detail-title" className="text-base font-bold text-slate-900">
                Detail Audit Log
              </h3>
              <p className="text-xs text-slate-500 font-mono">ID: {auditLog.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium block">Pelaku (Actor)</span>
              <span className="font-bold text-slate-900 block truncate">{auditLog.actor_email}</span>
              <span className="text-[11px] text-indigo-600 font-mono">{auditLog.actor_role}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Alamat IP</span>
              <span className="font-mono text-slate-900">{auditLog.ip_address || '127.0.0.1'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Aksi Dilakukan</span>
              <span className="font-mono font-bold text-slate-900">{auditLog.action}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Waktu Tercatat</span>
              <span className="text-slate-900">
                {new Date(auditLog.created_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">Payload & Parameter Detail</span>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap max-h-60">
              {parsedDetails
                ? JSON.stringify(parsedDetails, null, 2)
                : 'Tidak ada detail tambahan'}
            </pre>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal 5: Security Policy & 2FA Configuration
export function SecurityPolicyModal({ isOpen, onClose, policy, onSave, isSaving }) {
  const [require2FA, setRequire2FA] = useState(true);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(5);
  const [rateLimitRpm, setRateLimitRpm] = useState(120);
  const [sessionTimeout, setSessionTimeout] = useState(24);
  const [autoIpBlock, setAutoIpBlock] = useState(true);

  useEffect(() => {
    if (policy) {
      setRequire2FA(policy.require_2fa_for_super_admin ?? true);
      setMaxFailedAttempts(policy.max_failed_login_attempts ?? 5);
      setRateLimitRpm(policy.rate_limit_requests_per_min ?? 120);
      setSessionTimeout(policy.session_timeout_hours ?? 24);
      setAutoIpBlock(policy.auto_ip_block_on_brute_force ?? true);
    }
  }, [policy]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      require_2fa_for_super_admin: require2FA,
      max_failed_login_attempts: parseInt(maxFailedAttempts, 10),
      rate_limit_requests_per_min: parseInt(rateLimitRpm, 10),
      session_timeout_hours: parseInt(sessionTimeout, 10),
      auto_ip_block_on_brute_force: autoIpBlock,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sec-policy-title"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ShieldIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 id="sec-policy-title" className="text-base font-bold text-slate-900">
                Kebijakan Keamanan & 2FA
              </h3>
              <p className="text-xs text-slate-500">Konfigurasi standar proteksi platform Klikin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Wajib 2FA untuk Super Admin</span>
              <span className="text-[11px] text-slate-500">Mewajibkan autentikasi dua faktor bagi semua administrator</span>
            </div>
            <input
              type="checkbox"
              checked={require2FA}
              onChange={(e) => setRequire2FA(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Auto-Block IP saat Brute Force</span>
              <span className="text-[11px] text-slate-500">Otomatis blacklist IP setelah gagal login berulang</span>
            </div>
            <input
              type="checkbox"
              checked={autoIpBlock}
              onChange={(e) => setAutoIpBlock(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Gagal Login
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={maxFailedAttempts}
                onChange={(e) => setMaxFailedAttempts(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">Kali percobaan</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rate Limit per Menit
              </label>
              <input
                type="number"
                min="30"
                max="1000"
                value={rateLimitRpm}
                onChange={(e) => setRateLimitRpm(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">Request per IP (RPM)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Masa Berlaku Sesi Admin
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="168"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
              <span className="text-xs text-slate-600 font-medium">Jam</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Kebijakan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
