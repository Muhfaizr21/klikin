import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';
import {
  XIcon,
  ShieldAlertIcon,
  AlertCircleIcon,
  BanIcon,
  CheckIcon,
  LockIcon,
  GlobeIcon,
} from '../Icons';

/**
 * 1. FLAG PAGE MODAL (Tandai Halaman: Phishing / Spam / Adult / Judi)
 */
export function FlagPageModal({ page, token, isOpen, onClose, onSuccess }) {
  const [category, setCategory] = useState('phishing');
  const [severity, setSeverity] = useState('high');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (page && isOpen) {
      setCategory(page.flag_category || 'phishing');
      setSeverity(page.flag_severity || 'high');
      setReason(page.flag_reason || '');
      setError(null);
    }
  }, [page, isOpen]);

  if (!isOpen || !page) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/pages/${page.page_id || page.id}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category, severity, reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menandai halaman');
      }
      onSuccess?.(json.message || `Halaman /${page.slug} berhasil di-flag`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <ShieldAlertIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Flag Konten Halaman Publik</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                /{page.slug} • @{page.username || 'tenant'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
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
            <label className="block font-semibold text-slate-700 mb-1.5">
              Kategori Pelanggaran Konten
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'phishing', label: 'Phishing / Scam', desc: 'Pencurian kredensial & OTP' },
                { id: 'gambling', label: 'Judi Online (Slot)', desc: 'Situs taruhan / afiliasi' },
                { id: 'adult', label: 'Konten Dewasa (18+)', desc: 'Pornografi / eksplisit' },
                { id: 'spam', label: 'Spam / Malware', desc: 'Redirect agresif / penipuan' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    category === cat.id
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-semibold shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">{cat.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Tingkat Risiko (Severity)</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'low', label: 'Low' },
                { id: 'medium', label: 'Medium' },
                { id: 'high', label: 'High' },
                { id: 'critical', label: 'Critical' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id)}
                  className={`py-1.5 px-3 rounded-lg border font-semibold text-xs cursor-pointer transition-colors ${
                    severity === s.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Catatan Temuan / Alasan Flag (Dikirim sebagai peringatan ke pemilik)
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Ditemukan tautan yang mengarah ke formulir login palsu..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. TAKE DOWN PAGE MODAL (Nonaktifkan Halaman Publik + Opsi Suspend/Ban/Blacklist)
 */
export function TakeDownPageModal({ page, token, isOpen, onClose, onSuccess }) {
  const [category, setCategory] = useState('phishing');
  const [reason, setReason] = useState('');
  const [suspendOwner, setSuspendOwner] = useState(true);
  const [banOwner, setBanOwner] = useState(false);
  const [blacklistDomain, setBlacklistDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (page && isOpen) {
      setCategory(page.flag_category || 'phishing');
      setReason(
        page.flag_reason ||
          'Halaman melanggar Kebijakan Keamanan Klikin (terdeteksi konten berbahaya / phishing / judi online).'
      );
      setSuspendOwner(true);
      setBanOwner(false);
      setBlacklistDomain('');
      setError(null);
    }
  }, [page, isOpen]);

  if (!isOpen || !page) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/admin/moderation/pages/${page.page_id || page.id}/takedown`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category,
            reason,
            suspend_owner: suspendOwner,
            ban_owner: banOwner,
            blacklist_domain: blacklistDomain,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal melakukan take-down halaman');
      }
      onSuccess?.(json.message || `Halaman /${page.slug} berhasil di-take down`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <BanIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Take Down Halaman Publik</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                /{page.slug} • Pemilik: @{page.username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
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

          <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/80 text-rose-900 leading-relaxed">
            <span className="font-semibold block mb-0.5">Tindakan Darurat:</span>
            Halaman <span className="font-mono font-bold">/{page.slug}</span> akan langsung ditarik dari status publik live (<span className="font-mono">is_published = false</span>) dan pengunjung akan melihat halaman peringatan moderasi.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Pelanggaran</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs cursor-pointer"
              >
                <option value="phishing">Phishing / Scam</option>
                <option value="gambling">Judi Online (Slot)</option>
                <option value="adult">Konten Dewasa (18+)</option>
                <option value="spam">Spam / Malware</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Blacklist Domain (Opsional)
              </label>
              <input
                type="text"
                value={blacklistDomain}
                onChange={(e) => setBlacklistDomain(e.target.value)}
                placeholder="mis. slot-vip88.xyz"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white font-mono text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alasan Resmi Take-Down</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="block font-semibold text-slate-700">Tindakan Lanjutan Akun (@{page.username})</label>
            <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={suspendOwner && !banOwner}
                onChange={(e) => {
                  setSuspendOwner(e.target.checked);
                  if (e.target.checked) setBanOwner(false);
                }}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              <span className="text-slate-700 font-medium">
                Suspend Sementara Akun (Karantina akun selama proses investigasi)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-rose-200 bg-rose-50/40 cursor-pointer hover:bg-rose-50/70">
              <input
                type="checkbox"
                checked={banOwner}
                onChange={(e) => {
                  setBanOwner(e.target.checked);
                  if (e.target.checked) setSuspendOwner(false);
                }}
                className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-rose-900 font-medium">
                Ban Permanen Akun (Blokir akses login selamanya)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Eksekusi Take-Down'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. BAN VIOLATOR MODAL (Ban Permanen User Pelanggar + Take-Down Halaman)
 */
export function BanViolatorModal({ target, token, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState(
    'Terbukti menyalahgunakan platform Klikin untuk menyebarkan tautan phishing / judi online terlarang.'
  );
  const [blacklistDomain, setBlacklistDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setBlacklistDomain('');
    }
  }, [isOpen]);

  if (!isOpen || !target) return null;

  const userId = target.user_id || target.owner_user_id || target.id;
  const username = target.username || target.owner_username || 'user';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          take_down_page: true,
          revoke_sessions: true,
          blacklist_domain: blacklistDomain,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mem-ban user pelanggar');
      }
      onSuccess?.(json.message || `Akun @${username} berhasil di-ban permanen`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center">
              <LockIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ban Permanen Akun</h3>
              <p className="text-[11px] text-slate-500 font-mono">@{username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
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
            <label className="block font-semibold text-slate-700 mb-1">Alasan Pemblokiran Permanen</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Masukkan Domain Berbahaya ke Blacklist (Opsional)
            </label>
            <input
              type="text"
              value={blacklistDomain}
              onChange={(e) => setBlacklistDomain(e.target.value)}
              placeholder="mis. phishing-link.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white font-mono text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Ban Akun & Halaman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 4. REVIEW VISITOR REPORT MODAL (Tinjau & Putuskan Laporan Pengunjung)
 */
export function ReviewReportModal({ report, token, isOpen, onClose, onSuccess }) {
  const [decision, setDecision] = useState('takedown_page');
  const [resolutionNote, setResolutionNote] = useState('');
  const [blacklistUrl, setBlacklistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (report && isOpen) {
      setDecision(report.severity === 'critical' ? 'takedown_page' : 'flag_page');
      setResolutionNote(
        `Laporan pengunjung diverifikasi (${report.category}): tindak lanjut keamanan diterapkan.`
      );
      if (report.target_url) {
        try {
          const u = new URL(report.target_url);
          if (!u.hostname.includes('klikin')) {
            setBlacklistUrl(u.hostname);
          } else {
            setBlacklistUrl('');
          }
        } catch {
          setBlacklistUrl('');
        }
      } else {
        setBlacklistUrl('');
      }
      setError(null);
    }
  }, [report, isOpen]);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/reports/${report.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          resolution_note: resolutionNote,
          severity: report.severity,
          blacklist_url: blacklistUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memproses laporan pengunjung');
      }
      onSuccess?.(json.message || 'Laporan pengunjung berhasil ditindaklanjuti');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <CheckIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tinjau Laporan Pengunjung</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Target: /{report.slug} (@{report.owner_username})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
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

          {/* Report Summary Box */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Pelapor: {report.reporter_name} ({report.reporter_ip})
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                  {report.category}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                  {report.severity}
                </span>
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed font-normal">{report.description}</p>
            {report.target_url && (
              <p className="font-mono text-[11px] text-rose-600 break-all">
                URL Terlapor: {report.target_url}
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Keputusan Moderasi</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'dismiss',
                  label: 'Tolak Laporan (Aman)',
                  desc: 'Konten tidak melanggar aturan',
                },
                {
                  id: 'flag_page',
                  label: 'Flag Halaman',
                  desc: 'Tandai & kirim peringatan ke user',
                },
                {
                  id: 'takedown_page',
                  label: 'Take-Down Halaman',
                  desc: 'Tarik halaman dari publik segera',
                },
                {
                  id: 'ban_user',
                  label: 'Ban Permanen Akun',
                  desc: 'Blokir user & take-down halaman',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDecision(opt.id)}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    decision === opt.id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">{opt.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      decision === opt.id ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {decision !== 'dismiss' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Masukkan Domain Berbahaya ke Blacklist (Opsional)
              </label>
              <input
                type="text"
                value={blacklistUrl}
                onChange={(e) => setBlacklistUrl(e.target.value)}
                placeholder="mis. hadiah-bank-resmi.my.id"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 font-mono text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Resolusi Audit</label>
            <textarea
              rows={3}
              required
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Simpan Keputusan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 5. ADD BLACKLIST MODAL (Tambah Domain / URL Berbahaya ke Daftar Hitam)
 */
export function AddBlacklistModal({ token, isOpen, onClose, onSuccess }) {
  const [pattern, setPattern] = useState('');
  const [matchType, setMatchType] = useState('domain');
  const [category, setCategory] = useState('phishing');
  const [severity, setSeverity] = useState('critical');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPattern('');
      setMatchType('domain');
      setCategory('phishing');
      setSeverity('critical');
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/blacklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pattern,
          match_type: matchType,
          category,
          severity,
          reason,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menambahkan domain ke blacklist');
      }
      onSuccess?.(json.message || 'Domain berbahaya berhasil masuk daftar hitam');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <GlobeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Blacklist Domain / URL Berbahaya</h3>
              <p className="text-[11px] text-slate-500">
                Blokir otomatis penyisipan tautan di seluruh Bio Page
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
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
            <label className="block font-semibold text-slate-700 mb-1">
              Domain atau Pola URL Berbahaya
            </label>
            <input
              type="text"
              required
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="mis. slot-gacor88.xyz atau claim-hadiah-palsu.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white font-mono text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipe Pencocokan</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium text-xs shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="domain">Seluruh Domain</option>
                <option value="url_contains">Mengandung Kata/Path</option>
                <option value="exact_url">URL Persis</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Ancaman</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium text-xs shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="phishing">Phishing / Scam</option>
                <option value="gambling">Judi Online (Slot)</option>
                <option value="adult">Konten Dewasa (18+)</option>
                <option value="spam">Spam / Malware</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tingkat Bahaya (Severity)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'medium', label: 'Medium' },
                { id: 'high', label: 'High' },
                { id: 'critical', label: 'Critical' },
              ].map((sev) => (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setSeverity(sev.id)}
                  className={`py-1.5 rounded-lg border font-semibold text-xs cursor-pointer transition-colors ${
                    severity === sev.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Keterangan / Sumber Intelijen</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Dilaporkan pengunjung & terkonfirmasi situs phishing OTP..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Tambahkan ke Blacklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
