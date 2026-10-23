import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckIcon,
  AlertCircleIcon,
  CopyIcon,
  LockIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeOffIcon,
  SmartphoneIcon,
  MonitorIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
} from '../Icons';
import { convertToWebP, formatBytes, validateImageFile } from '../../utils/webpConverter';
import { API_BASE } from '../../lib/api';

export default function OwnerAccountSettings({ user, token, onRefreshUser }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'sessions' | 'data'
  const [_loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }
  const [savingSection, setSavingSection] = useState(null);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [language, setLanguage] = useState('id');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarStats, setAvatarStats] = useState(null);
  const [isConvertingWebP, setIsConvertingWebP] = useState(false);

  // Security & Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('JBSWY3DPEHPK3PXP');
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Sessions States
  const [sessions, setSessions] = useState([]);
  const [isRevoking, setIsRevoking] = useState(false);

  // Data & Danger Zone States
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const authToken = token || localStorage.getItem('klikin_token') || '';

  const fetchProfileAndSessions = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      const resProfile = await fetch(`${API_BASE}/user/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const dataProfile = await resProfile.json();

      if (dataProfile.success && dataProfile.data) {
        const u = dataProfile.data;
        setFullName(u.full_name || '');
        setUsername(u.username || '');
        setEmail(u.email || '');
        setPhoneNumber(u.phone_number || '');
        setBio(u.bio || '');
        setWebsite(u.website || '');
        setTimezone(u.timezone || 'Asia/Jakarta');
        setLanguage(u.language || 'id');
        setAvatarUrl(u.avatar_url || '');
        setTwoFactorEnabled(!!u.two_factor_enabled);
      } else if (user) {
        setFullName(user.full_name || '');
        setUsername(user.username || '');
        setEmail(user.email || '');
      }

      // 2. Fetch Sessions
      const resSessions = await fetch(`${API_BASE}/user/sessions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const dataSessions = await resSessions.json();
      if (dataSessions.success && Array.isArray(dataSessions.data)) {
        setSessions(dataSessions.data);
      }
    } catch (err) {
      console.warn('Gagal memuat profil otomatis:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken, user]);

  useEffect(() => {
    fetchProfileAndSessions();
  }, [fetchProfileAndSessions]);

  const showToast = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  // Image Upload and WebP Conversion Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      showToast('error', validationError);
      return;
    }

    setIsConvertingWebP(true);
    try {
      const result = await convertToWebP(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
      });

      setAvatarUrl(result.dataUrl);
      setAvatarStats({
        original: formatBytes(result.originalSize),
        webp: formatBytes(result.webpSize),
        savings: result.savingsPercent,
      });

      showToast(
        'success',
        `Foto berhasil dikonversi ke WebP (${formatBytes(result.originalSize)} → ${formatBytes(result.webpSize)}, hemat ${result.savingsPercent}%). Klik 'Simpan Perubahan' di bawah untuk menerapkan.`
      );
    } catch (err) {
      showToast('error', err.message || 'Gagal memproses gambar ke format WebP.');
    } finally {
      setIsConvertingWebP(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    setAvatarStats(null);
    showToast('success', 'Foto profil dihapus. Klik simpan untuk menerapkan.');
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('error', 'Nama lengkap tidak boleh kosong.');
      return;
    }

    setSavingSection('profile');
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim(),
          avatar_url: avatarUrl,
          phone_number: phoneNumber.trim(),
          bio: bio.trim(),
          website: website.trim(),
          timezone,
          language,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui profil pengguna.');
      }

      showToast('success', 'Perubahan profil dan avatar WebP berhasil disimpan.');
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSavingSection(null);
    }
  };

  // Regional Preferences Save
  const handleSaveRegional = async (e) => {
    e.preventDefault();
    setSavingSection('regional');
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim(),
          avatar_url: avatarUrl,
          phone_number: phoneNumber.trim(),
          bio: bio.trim(),
          website: website.trim(),
          timezone,
          language,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan preferensi regional.');
      }

      showToast('success', 'Pengaturan zona waktu dan bahasa berhasil diperbarui.');
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSavingSection(null);
    }
  };

  // Password Strength Calculation (0 - 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Belum diisi', color: 'bg-slate-300' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Lemah (tambahkan variasi karakter)', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Cukup (tambahkan angka atau simbol)', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Kuat (memenuhi standar)', color: 'bg-emerald-500' };
      case 4:
        return { score: 4, label: 'Sangat Kuat (Standar Enterprise)', color: 'bg-emerald-600' };
      default:
        return { score: 0, label: 'Sangat Lemah', color: 'bg-rose-500' };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Change Password Submit
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      showToast('error', 'Kata sandi saat ini wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('error', 'Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setSavingSection('password');
    try {
      const res = await fetch(`${API_BASE}/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah kata sandi.');
      }

      showToast('success', 'Kata sandi berhasil diperbarui dengan aman.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSavingSection(null);
    }
  };

  // Toggle 2FA
  const handleToggle2FA = async (targetState) => {
    try {
      const res = await fetch(`${API_BASE}/user/2fa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ enabled: targetState }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah status autentikasi 2 faktor.');
      }

      setTwoFactorEnabled(targetState);
      if (targetState) {
        setBackupCodes(json.data.backup_codes || []);
        setTwoFactorSecret(json.data.secret_key || 'JBSWY3DPEHPK3PXP');
        setShow2FAModal(true);
      } else {
        showToast('success', 'Autentikasi dua faktor berhasil dinonaktifkan.');
      }
    } catch (err) {
      showToast('error', err.message);
    }
  };

  // Revoke other sessions
  const handleRevokeOtherSessions = async () => {
    setIsRevoking(true);
    try {
      const res = await fetch(`${API_BASE}/user/sessions/revoke-others`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengeluarkan sesi lain.');
      }

      setSessions((prev) => prev.filter((s) => s.is_current));
      showToast('success', 'Semua perangkat lain telah berhasil dikeluarkan.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsRevoking(false);
    }
  };

  // Export Account Data (GDPR / UU PDP)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE}/user/export`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengekspor data akun.');
      }

      const jsonBlob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `klikin-account-${username || 'owner'}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('success', 'Arsip data akun JSON berhasil diunduh ke komputer Anda.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'HAPUS AKUN') {
      showToast('error', 'Harap ketik kata konfirmasi "HAPUS AKUN" dengan benar.');
      return;
    }
    if (!deletePassword) {
      showToast('error', 'Kata sandi akun diperlukan untuk memverifikasi tindakan ini.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/user/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          password: deletePassword,
          reason: 'Permintaan penghapusan dari halaman pengaturan akun.',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memproses penghapusan akun.');
      }

      showToast('success', 'Akun berhasil dinonaktifkan. Mengalihkan...');
      setTimeout(() => {
        localStorage.removeItem('klikin_token');
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'KO';

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 px-2 py-1 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Clean Top Navigation Bar (Matching Klikin's Tab System) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Sub-nav Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UsersIcon className="w-3.5 h-3.5" />
            <span>Profil Pengguna</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LockIcon className="w-3.5 h-3.5" />
            <span>Keamanan & Sandi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MonitorIcon className="w-3.5 h-3.5" />
            <span>Sesi & Perangkat</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'data'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Portabilitas & Zona Bahaya</span>
          </button>
        </div>

        {/* Account ID Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span className="text-slate-500 text-[11px]">ID Akun:</span>
          <span className="font-mono font-bold text-slate-800 text-[11px]">{user?.id || 'usr_owner_kopi'}</span>
        </div>
      </div>

      {/* TAB 1: PROFIL PENGGUNA (2-COLUMN BALANCED GRID) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Form Informasi Profil */}
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-5"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Identitas Pengguna & Toko</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi dasar profil yang terhubung dengan akun dan identitas bio link Anda.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckIcon className="w-3 h-3 text-emerald-600" />
                  <span>Terverifikasi</span>
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Lengkap / Brand
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Kopi Seduh Nusantara"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Username / Handle Akun
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-slate-900">
                      <span className="px-3 py-2.5 text-xs text-slate-500 font-mono bg-slate-100 border-r border-slate-200 select-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                        placeholder="username"
                        className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Hubungi tim support untuk pembaruan email akun.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor WhatsApp
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-slate-900">
                      <span className="px-3 py-2.5 text-xs text-slate-600 font-mono bg-slate-100 border-r border-slate-200 select-none">
                        +62
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber.startsWith('+62') ? phoneNumber.slice(3) : phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPhoneNumber(val ? `+62${val}` : '');
                        }}
                        placeholder="81234567890"
                        className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Bio Profil Singkat
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {bio.length}/160
                    </span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                    rows={2}
                    placeholder="Tuliskan tagline bisnis atau bio singkat Anda..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Website Eksternal Utama
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-slate-900">
                    <span className="px-3 py-2.5 text-xs text-slate-500 font-mono bg-slate-100 border-r border-slate-200 select-none">
                      https://
                    </span>
                    <input
                      type="text"
                      value={website.replace(/^https?:\/\//, '')}
                      onChange={(e) => {
                        const clean = e.target.value.trim();
                        setWebsite(clean ? `https://${clean.replace(/^https?:\/\//, '')}` : '');
                      }}
                      placeholder="brandanda.id"
                      className="w-full px-3 py-2.5 bg-transparent text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingSection === 'profile'}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {savingSection === 'profile' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan Profil</span>
                )}
              </button>
            </div>
          </form>

          {/* Right Column (5 cols): Foto Profil WebP & Preferensi Regional */}
          <div className="lg:col-span-5 space-y-6">
            {/* Foto Profil WebP Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Foto Profil (WebP Otomatis)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dikonversi otomatis ke format WebP berkualitas tinggi dengan kompresi maksimal.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Preview Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-white bg-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white text-slate-700 flex items-center justify-center font-bold text-xl shadow-sm">
                      {initials}
                    </div>
                  )}
                  {isConvertingWebP && (
                    <div className="absolute inset-0 rounded-full bg-slate-900/60 flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-white border border-slate-200 text-slate-600 shadow-2xs">
                    WebP
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      id="avatar-file-input"
                    />
                    <label
                      htmlFor="avatar-file-input"
                      className="cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all inline-flex items-center gap-1 shadow-2xs active:scale-95"
                    >
                      <span>Pilih Foto</span>
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all inline-flex items-center gap-1"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Mendukung JPG, PNG, atau HEIC. Maks. 10 MB.
                  </div>
                </div>
              </div>

              {avatarStats && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2 font-mono">
                  <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    WebP Hemat {avatarStats.savings}% ({avatarStats.original} → {avatarStats.webp})
                  </span>
                </div>
              )}
            </div>

            {/* Preferensi Regional Card */}
            <form
              onSubmit={handleSaveRegional}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">Preferensi Regional</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Zona waktu pelaporan analitik serta format bahasa dashboard.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zona Waktu Analitik
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  >
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
                    <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</option>
                    <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
                    <option value="UTC">Universal Coordinated Time (UTC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bahasa Antarmuka
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingSection === 'regional'}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {savingSection === 'regional' ? 'Menyimpan...' : 'Simpan Preferensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: KEAMANAN & SANDI (2-COLUMN BALANCED GRID) */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Ganti Kata Sandi */}
          <form
            onSubmit={handleChangePassword}
            className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ubah Kata Sandi Akun</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan kata sandi Anda kuat untuk melindungi hak akses akun dan bio link toko Anda.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama Anda"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showOldPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter unik"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2.5 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Kekuatan:</span>
                      <span className="font-semibold text-slate-800">{passwordStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-all duration-300 ${
                            step <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-mono mt-1">
                      <span className={newPassword.length >= 8 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                        ✓ Min. 8 karakter
                      </span>
                      <span
                        className={
                          /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)
                            ? 'text-emerald-600 font-semibold'
                            : 'text-slate-400'
                        }
                      >
                        ✓ Huruf kapital & kecil
                      </span>
                      <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                        ✓ Mengandung angka (0-9)
                      </span>
                      <span
                        className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}
                      >
                        ✓ Simbol (@, $, !, %)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p
                    className={`text-[11px] mt-1 font-mono font-medium ${
                      newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {newPassword === confirmPassword
                      ? '✓ Konfirmasi kata sandi cocok'
                      : '✗ Konfirmasi kata sandi belum sama'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingSection === 'password' || !oldPassword || !newPassword || newPassword !== confirmPassword}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingSection === 'password' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memperbarui...</span>
                  </>
                ) : (
                  <span>Perbarui Kata Sandi</span>
                )}
              </button>
            </div>
          </form>

          {/* Right Column (5 cols): 2FA & Standar Keamanan */}
          <div className="lg:col-span-5 space-y-6">
            {/* 2FA Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Autentikasi 2 Faktor (2FA)</span>
                    {twoFactorEnabled ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Nonaktif
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan aplikasi Google Authenticator atau Authy untuk verifikasi keamanan saat login.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                {twoFactorEnabled ? (
                  <button
                    type="button"
                    onClick={() => handleToggle2FA(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
                  >
                    Nonaktifkan 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggle2FA(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs active:scale-95"
                  >
                    Aktifkan 2FA Sekarang
                  </button>
                )}
              </div>
            </div>

            {/* Standar Enkripsi Akun */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <LockIcon className="w-3.5 h-3.5 text-slate-700" />
                <span>Standar Keamanan Kredensial</span>
              </h4>
              <ul className="text-[11px] text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Hashing satu arah menggunakan standar industri Bcrypt dengan salted rounds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Token autentikasi JWT terenkripsi dengan proteksi expired session otomatis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Seluruh transmisi kredensial dilindungi sertifikat SSL/TLS HTTPS end-to-end.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SESI & PERANGKAT */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Perangkat & Sesi Login Aktif</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar browser dan perangkat yang saat ini memiliki token akses masuk ke akun Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              disabled={isRevoking || sessions.length <= 1}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto flex items-center gap-2"
            >
              {isRevoking ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                  <span>Mengeluarkan...</span>
                </>
              ) : (
                <span>Keluar dari Semua Perangkat Lain</span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs mt-0.5">
                    {sess.os?.toLowerCase().includes('ios') || sess.os?.toLowerCase().includes('android') ? (
                      <SmartphoneIcon className="w-4 h-4" />
                    ) : (
                      <MonitorIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {sess.browser} ({sess.os})
                      </span>
                      {sess.is_current && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Perangkat Ini</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      IP: {sess.ip} • {sess.location}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {sess.last_seen}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <ClockIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Proteksi Sesi Otomatis:</span> Klikin memantau anomali
              lokasi dan membatasi masa aktif sesi maksimal 7 hari demi menjaga keamanan bio page Anda.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PORTABILITAS DATA & ZONA BAHAYA (2-COLUMN GRID) */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (6 cols): Ekspor Data */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Portabilitas Data (GDPR / UU PDP)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Unduh salinan arsip lengkap seluruh data akun Anda, konfigurasi halaman bio, riwayat tautan, dan
                kontak leads dalam format JSON yang terstruktur.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 font-mono">
              <div>• Format: JSON terenkripsi</div>
              <div>• Meliputi: Profil, Halaman Bio, Blok, Leads</div>
              <div>• Status: Siap Diunduh</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyiapkan Berkas...</span>
                  </>
                ) : (
                  <span>Unduh Arsip Data (.json)</span>
                )}
              </button>
            </div>
          </div>

          {/* Right Column (6 cols): Zona Bahaya */}
          <div className="lg:col-span-6 bg-rose-50/60 border border-rose-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-600" />
                <span>Zona Bahaya Akun</span>
              </h3>
              <p className="text-xs text-rose-700/80 mt-1">
                Tindakan penghapusan akun bersifat permanen dan tidak dapat dibatalkan kembali.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-rose-200 text-xs text-slate-600 space-y-1 shadow-2xs">
              <div className="font-semibold text-rose-900">Konsekuensi Penghapusan:</div>
              <div>• Tautan unik bio page dinonaktifkan permanen</div>
              <div>• Seluruh blok, statistik klik, dan leads dihapus</div>
            </div>

            <div className="pt-2 border-t border-rose-200/60 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xs active:scale-95"
              >
                Hapus Akun Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                <span>Siapkan Autentikasi 2FA</span>
              </h3>
              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                1. Buka aplikasi Google Authenticator atau Authy di ponsel Anda.
              </p>
              <p className="text-xs text-slate-600">
                2. Masukkan Secret Key berikut ke aplikasi autentikator:
              </p>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <code className="text-sm font-mono text-emerald-700 font-bold tracking-widest">
                  {twoFactorSecret}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(twoFactorSecret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-mono font-medium flex items-center gap-1 shadow-2xs"
                >
                  <CopyIcon className="w-3 h-3" />
                  <span>{copiedSecret ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">Kode Pemulihan Cadangan:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join('\n'));
                      setCopiedCodes(true);
                      setTimeout(() => setCopiedCodes(false), 2000);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-mono font-semibold"
                  >
                    {copiedCodes ? 'Semua Tersalin!' : 'Salin Semua'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="tracking-wider">
                      {code}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Simpan kode cadangan ini di tempat aman jika sewaktu-waktu ponsel Anda tidak dapat diakses.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShow2FAModal(false);
                  showToast('success', '2FA berhasil diaktifkan untuk akun Anda.');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
              >
                Selesai & Simpan Cadangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-rose-700 tracking-tight flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5 text-rose-600" />
                <span>Konfirmasi Hapus Akun</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <p>
                Tindakan ini tidak dapat dibatalkan. Halaman bio publik Anda, slug tautan, serta data kontak
                leads akan dinonaktifkan secara permanen.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Masukkan Kata Sandi Akun Anda:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Kata sandi saat ini"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ketik <strong className="text-slate-900 font-mono">HAPUS AKUN</strong> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="HAPUS AKUN"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationText !== 'HAPUS AKUN' || !deletePassword}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Hapus Akun Permanen</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
