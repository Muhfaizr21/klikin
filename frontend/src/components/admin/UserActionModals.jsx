import React, { useState, useEffect } from 'react';
import {
  XIcon,
  PencilIcon,
  LockIcon,
  BanIcon,
  TrashIcon,
  ShieldAlertIcon,
  UsersIcon,
} from '../Icons';
import { API_BASE } from '../../lib/api';

/**
 * 1. EDIT USER MODAL
 * Allows editing user credentials, bio, plan, and resetting password
 */
export function EditUserModal({ user, token, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    bio: '',
    is_pro: false,
    status: 'active',
    new_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        bio: user.bio || '',
        is_pro: !!user.is_pro,
        status: user.status || 'active',
        new_password: '',
      });
      setError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number,
        bio: formData.bio,
        is_pro: formData.is_pro,
        status: formData.status,
      };
      if (formData.new_password.trim()) {
        payload.new_password = formData.new_password.trim();
      }

      const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memperbarui data pengguna');
      }

      onSuccess?.(data.message || 'Data pengguna berhasil diperbarui');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <PencilIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Profil & Kredensial</h3>
              <p className="text-[11px] text-slate-400">ID: {user.id}</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username (@)</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+628123456789"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bio Pengguna</label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Deskripsi singkat profil pengguna..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Paket Langganan</label>
              <select
                value={formData.is_pro ? 'PRO' : 'FREE'}
                onChange={(e) => setFormData({ ...formData, is_pro: e.target.value === 'PRO' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900 cursor-pointer"
              >
                <option value="FREE">Free Tier</option>
                <option value="PRO">Klikin Pro (Premium)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900 cursor-pointer"
              >
                <option value="active">Aktif (Normal)</option>
                <option value="suspended">Ditangguhkan (Suspended)</option>
                <option value="banned">Diblokir (Banned)</option>
              </select>
            </div>
          </div>

          {/* Reset Password Field */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <LockIcon className="w-3.5 h-3.5 text-amber-600" />
              <label className="font-semibold text-slate-700">Reset Password (Opsional)</label>
            </div>
            <input
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              placeholder="Kosongkan jika tidak ingin mengubah password"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none text-slate-900"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Minimal 6 karakter. Password baru akan langsung dienkripsi dengan bcrypt salt hash.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. SUSPEND USER MODAL
 */
export function SuspendUserModal({ user, token, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('Pemeriksaan berkala atas indikasi pelanggaran aturan platform');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !user) return null;

  const handleSuspend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menangguhkan akun');
      }

      onSuccess?.(`Akun @${user.username} berhasil ditangguhkan sementara.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldAlertIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tangguhkan Akun (Suspend)</h3>
            <p className="text-[11px] text-slate-400 font-medium">Pengguna: @{user.username} ({user.email})</p>
          </div>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Penangguhan bersifat sementara. Akun ini tidak dapat login ke dashboard dan halaman bio miliknya akan dinonaktifkan sementara hingga dicabut oleh admin.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSuspend} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alasan Penangguhan</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan catatan alasan administratif..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {loading ? 'Memproses...' : 'Tangguhkan Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. BAN USER MODAL
 */
export function BanUserModal({ user, token, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('Pelanggaran berat terhadap Pedoman Komunitas dan Ketentuan Layanan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !user) return null;

  const handleBan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memblokir pengguna');
      }

      onSuccess?.(`Akun @${user.username} berhasil diblokir secara permanen.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl border border-rose-200 shadow-2xl p-6 text-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <BanIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Blokir Akun Permanen (Blacklist)</h3>
            <p className="text-[11px] text-slate-400 font-medium">Target: @{user.username} ({user.email})</p>
          </div>
        </div>

        <div className="p-3 bg-rose-50/70 border border-rose-200/70 rounded-xl text-rose-800 leading-relaxed text-[11px]">
          <strong>Perhatian:</strong> Pemblokiran permanen akan memasukkan kredensial pengguna ke dalam daftar hitam. Seluruh link bio akan segera menampilkan halaman pemblokiran.
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleBan} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alasan Pemblokiran Permanen</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan justifikasi pelanggaran..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {loading ? 'Memblokir...' : 'Blokir Permanen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 4. DELETE USER MODAL (Soft + Hard Delete)
 */
export function DeleteUserModal({ user, token, isOpen, onClose, onSuccess }) {
  const [deleteMode, setDeleteMode] = useState('soft'); // 'soft' | 'hard'
  const [confirmUsername, setConfirmUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !user) return null;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (deleteMode === 'hard' && confirmUsername !== user.username) {
      setError(`Ketik "${user.username}" untuk mengonfirmasi hard delete`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}/admin/users/${user.id}?mode=${deleteMode}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus pengguna');
      }

      onSuccess?.(data.message || 'Pengguna berhasil dihapus');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <TrashIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hapus Akun Pengguna</h3>
            <p className="text-[11px] text-slate-400 font-medium">Akun: @{user.username} ({user.email})</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleDelete} className="space-y-4">
          <div className="space-y-2.5">
            <label className="block font-semibold text-slate-700">Pilih Metode Penghapusan</label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              deleteMode === 'soft' ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="deleteMode"
                value="soft"
                checked={deleteMode === 'soft'}
                onChange={() => setDeleteMode('soft')}
                className="mt-0.5 accent-amber-600"
              />
              <div>
                <div className="font-bold text-slate-900">Soft Delete (Rekomendasi)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Menonaktifkan akun dan menandainya sebagai terhapus. Riwayat analitik tetap tersimpan untuk audit platform.
                </div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              deleteMode === 'hard' ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-300' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="deleteMode"
                value="hard"
                checked={deleteMode === 'hard'}
                onChange={() => setDeleteMode('hard')}
                className="mt-0.5 accent-rose-600"
              />
              <div>
                <div className="font-bold text-rose-900">Hard Delete (Permanen Purge)</div>
                <div className="text-[11px] text-rose-700/80 mt-0.5">
                  Menghapus akun, bio pages, links, dan catatan secara permanen dari Supabase PostgreSQL. Tidak dapat dikembalikan.
                </div>
              </div>
            </label>
          </div>

          {deleteMode === 'hard' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
              <label className="block text-[11px] font-bold text-rose-900">
                Ketik nama pengguna <span className="font-mono underline">@{user.username}</span> untuk verifikasi keamanan:
              </label>
              <input
                type="text"
                required
                value={confirmUsername}
                onChange={(e) => setConfirmUsername(e.target.value)}
                placeholder={user.username}
                className="w-full px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-slate-900 font-mono outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-white font-bold disabled:opacity-50 transition-colors shadow-2xs cursor-pointer ${
                deleteMode === 'hard' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {loading ? 'Memproses...' : deleteMode === 'hard' ? 'Hapus Permanen' : 'Nonaktifkan Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 5. IMPERSONATE MODAL
 */
export function ImpersonateModal({ user, token, isOpen, onClose, onImpersonateSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !user) return null;

  const handleImpersonate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/impersonate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat sesi impersonasi');
      }

      onImpersonateSuccess?.(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Masuk sebagai Pengguna (Impersonasi)</h3>
            <p className="text-[11px] text-slate-400 font-medium">Target: @{user.username} ({user.email})</p>
          </div>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Anda akan login langsung ke ruang kerja toko milik <strong>@{user.username}</strong> dengan hak akses penuh sebagai pemilik akun. Sesi Super Admin Anda akan dicadangkan sehingga Anda dapat kembali sewaktu-waktu dengan 1-klik banner.
        </p>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-700">Audit Trail Dicatat:</div>
          <div className="text-[11px] text-slate-500">
            Aktivitas impersonasi ini akan terekam dalam Log Audit SuperAdmin dan Log Aktivitas Akun pengguna demi kepatuhan keamanan.
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleImpersonate}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            {loading ? 'Menyiapkan Sesi...' : 'Mulai Impersonasi'}
          </button>
        </div>
      </div>
    </div>
  );
}
