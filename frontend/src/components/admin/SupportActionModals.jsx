import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';
import { XIcon, CheckCircleIcon, AlertCircleIcon, TrashIcon } from '../Icons';

/**
 * Modal Broadcast Pengumuman ke Pengguna atau Segmen (Readme 3.8)
 */
export function BroadcastAnnouncementModal({ isOpen, onClose, onSuccess, token }) {
  const [title, setTitle] = useState('');
  const [targetSegment, setTargetSegment] = useState('all');
  const [channel, setChannel] = useState('in_app');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul pengumuman wajib diisi');
      return;
    }
    if (!message.trim()) {
      setError('Isi pesan pengumuman wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/support/broadcasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          target_segment: targetSegment,
          channel,
          message: message.trim(),
          action_url: actionUrl.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengirimkan pengumuman broadcast');
      }

      onSuccess?.(json.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem saat broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="broadcast-modal-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 id="broadcast-modal-title" className="text-base font-bold text-slate-900">
              Kirim Broadcast Pengumuman
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Siarkan pesan massal ke segmen pengguna platform
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            aria-label="Tutup modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul Pengumuman <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pemeliharaan Server Terjadwal Minggu Depan"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Segmen Pengguna
              </label>
              <select
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs cursor-pointer"
              >
                <option value="all">Semua Pengguna (All)</option>
                <option value="active">Pengguna Aktif (Status Active)</option>
                <option value="pro">Pelanggan Klikin Pro</option>
                <option value="free">Pengguna Paket Gratis (Free)</option>
                <option value="suspended">Akun Ditangguhkan (Suspended)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Saluran Pengiriman
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs cursor-pointer"
              >
                <option value="in_app">Notifikasi In-App Sahaja</option>
                <option value="email">Email Transaksional Sahaja</option>
                <option value="both">Keduanya (In-App + Email)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Isi Pesan Pengumuman <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan isi pesan pengumuman lengkap secara jelas..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tautan Aksi (Opsional)
            </label>
            <input
              type="text"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="Contoh: /settings/domain atau /billing"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Pengguna yang mengklik notifikasi akan langsung diarahkan ke halaman ini.
            </p>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-800 text-[11px] leading-relaxed">
            <span className="font-bold">Perhatian:</span> Siaran pesan ini akan langsung diterbitkan secara real-time ke akun seluruh anggota segmen yang dipilih.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.25 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4.5 py-2.25 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{loading ? 'Mengirim Siaran...' : 'Kirim Siaran Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal Kirim Notifikasi Langsung ke Pengguna Spesifik (Readme 3.8)
 */
export function DirectNotificationModal({ isOpen, onClose, onSuccess, targetUser = null, token }) {
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('info');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (targetUser) {
      setUserId(targetUser.id || targetUser.user_id || '');
      setUserName(targetUser.full_name || targetUser.username || targetUser.email || '');
    } else {
      setUserId('');
      setUserName('');
    }
  }, [targetUser, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('ID pengguna target tidak boleh kosong');
      return;
    }
    if (!title.trim()) {
      setError('Judul notifikasi tidak boleh kosong');
      return;
    }
    if (!message.trim()) {
      setError('Isi pesan notifikasi tidak boleh kosong');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/support/notifications/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          title: title.trim(),
          type,
          message: message.trim(),
          action_url: actionUrl.trim(),
          send_email: sendEmail,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengirimkan notifikasi langsung');
      }

      onSuccess?.(json.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem saat kirim notifikasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="direct-notif-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 id="direct-notif-title" className="text-base font-bold text-slate-900">
              Kirim Notifikasi Langsung
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Notifikasi personal ke bel in-app pengguna
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            aria-label="Tutup modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Target Pengguna (User ID) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Contoh: usr_owner_kopi"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs font-mono"
            />
            {userName && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Target: {userName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tipe Notifikasi
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs cursor-pointer"
              >
                <option value="info">Informasi (Info)</option>
                <option value="success">Sukses (Success)</option>
                <option value="warning">Peringatan (Warning)</option>
                <option value="billing">Tagihan (Billing)</option>
                <option value="domain">Domain & DNS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tautan Aksi (Action URL)
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/settings/billing"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul Notifikasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pembaruan Status Verifikasi Akun"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pesan Notifikasi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan pesan notifikasi yang akan muncul di bel in-app..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-100/60 transition-colors">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
            />
            <span className="text-xs text-slate-700 font-medium">
              Kirimkan juga salinan pemberitahuan via email resmi
            </span>
          </label>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.25 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4.5 py-2.25 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{loading ? 'Mengirim...' : 'Kirim Notifikasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal Tambah / Edit Template Balasan Canned Responses (Readme 3.8)
 */
export function AddEditCannedResponseModal({ isOpen, onClose, onSuccess, initialItem = null, token }) {
  const isEdit = Boolean(initialItem);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title || '');
      setCategory(initialItem.category || 'general');
      setShortcut(initialItem.shortcut || '');
      setContent(initialItem.content || '');
    } else {
      setTitle('');
      setCategory('general');
      setShortcut('');
      setContent('');
    }
  }, [initialItem, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul template balasan wajib diisi');
      return;
    }
    if (!content.trim()) {
      setError('Isi template balasan wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    const url = isEdit
      ? `${API_BASE}/admin/support/canned-responses/${initialItem.id}`
      : `${API_BASE}/admin/support/canned-responses`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          shortcut: shortcut.trim(),
          content: content.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan template balasan');
      }

      onSuccess?.(json.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem saat menyimpan template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="canned-modal-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 id="canned-modal-title" className="text-base font-bold text-slate-900">
              {isEdit ? 'Perbarui Template Balasan' : 'Tambah Template Balasan Cepat'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan placeholder teks untuk efisiensi respon tim support
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            aria-label="Tutup modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama / Judul Template <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Panduan CNAME Cloudflare"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs cursor-pointer"
              >
                <option value="general">Umum (General)</option>
                <option value="domain">Domain & DNS</option>
                <option value="billing">Tagihan & Langganan</option>
                <option value="technical">Masalah Teknis</option>
                <option value="feature">Fitur & Panduan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Shortcut Cepat (Opsional)
              </label>
              <input
                type="text"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="/dns"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Isi Template Balasan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan format balasan lengkap yang akan langsung disisipkan ke kotak balasan tiket..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.25 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4.5 py-2.25 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal Ubah Status & Prioritas Tiket Cepat (Readme 3.8)
 */
export function UpdateTicketStatusModal({ isOpen, onClose, onSuccess, ticket = null, token }) {
  const [status, setStatus] = useState('open');
  const [priority, setPriority] = useState('medium');
  const [internalNote, setInternalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status || 'open');
      setPriority(ticket.priority || 'medium');
      setInternalNote('');
    }
  }, [ticket, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          priority,
          internal_note: internalNote.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui status tiket');
      }

      onSuccess?.(json.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem saat update tiket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-status-modal-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 id="ticket-status-modal-title" className="text-base font-bold text-slate-900">
              Ubah Status & Prioritas Tiket
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tiket #{ticket.ticket_number} - {ticket.subject}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            aria-label="Tutup modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status Tiket
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs cursor-pointer"
            >
              <option value="open">Menunggu Penanganan (Open)</option>
              <option value="in_progress">Sedang Diproses (In Progress)</option>
              <option value="resolved">Selesai (Resolved)</option>
              <option value="closed">Ditutup (Closed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tingkat Prioritas
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs cursor-pointer"
            >
              <option value="low">Rendah (Low)</option>
              <option value="medium">Sedang (Medium)</option>
              <option value="high">Tinggi (High)</option>
              <option value="urgent">Mendesak (Urgent)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Internal Tim Support (Opsional)
            </label>
            <textarea
              rows={3}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Tambahkan catatan singkat mengenai alasan perubahan status atau investigasi..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.25 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4.5 py-2.25 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{loading ? 'Menyimpan...' : 'Perbarui Status'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
