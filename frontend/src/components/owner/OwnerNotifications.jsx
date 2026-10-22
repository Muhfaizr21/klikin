import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  CheckIcon,
  AlertCircleIcon,
  TrashIcon,
  RefreshCwIcon,
  MailIcon,
  ExternalLinkIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '../Icons';
import { supabase } from '../../lib/supabase';

const API_BASE = 'http://localhost:8080/api';

export default function OwnerNotifications({ user, token }) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter tabs: 'all' vs 'unread' vs 'emails' vs 'preferences'
  const [activeTab, setActiveTab] = useState('all');

  // Preferences form
  const [prefs, setPrefs] = useState({
    email_marketing: false,
    email_security: true,
    email_billing: true,
    email_domain_status: true,
    email_new_lead: true,
    in_app_sound: true,
  });

  const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';
  const effectiveUserId = user?.id || 'usr_owner_kopi';

  useEffect(() => {
    fetchNotifications();

    // Supabase Realtime WebSocket Subscription
    let channel;
    try {
      channel = supabase
        .channel(`notifications-view-${effectiveUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${effectiveUserId}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [effectiveUserId]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/owner/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setOverview(result.data);
        if (result.data.preferences) {
          setPrefs({
            email_marketing: result.data.preferences.email_marketing ?? false,
            email_security: result.data.preferences.email_security ?? true,
            email_billing: result.data.preferences.email_billing ?? true,
            email_domain_status: result.data.preferences.email_domain_status ?? true,
            email_new_lead: result.data.preferences.email_new_lead ?? true,
            in_app_sound: result.data.preferences.in_app_sound ?? true,
          });
        }
      } else {
        setError(result.error || 'Gagal memuat notifikasi');
      }
    } catch (err) {
      setError('Koneksi terputus: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      const res = await fetch(`${API_BASE}/owner/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        fetchNotifications();
        window.dispatchEvent(new CustomEvent('klikin:notifications-updated'));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/notifications/read-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: 'Semua notifikasi telah ditandai dibaca' });
        fetchNotifications();
        window.dispatchEvent(new CustomEvent('klikin:notifications-updated'));
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotif = async (notifId) => {
    try {
      const res = await fetch(`${API_BASE}/owner/notifications/${notifId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        fetchNotifications();
        window.dispatchEvent(new CustomEvent('klikin:notifications-updated'));
      }
    } catch (err) {
      console.error('Error deleting notif:', err);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(prefs),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback({ type: 'success', message: 'Preferensi notifikasi berhasil disimpan!' });
        fetchNotifications();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Gagal menyimpan preferensi' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-sm">
        <RefreshCwIcon className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Memuat pusat notifikasi dan riwayat email...</p>
      </div>
    );
  }

  const notifs = overview?.notifications || [];
  const unreadCount = overview?.unread_count || 0;
  const recentEmails = overview?.recent_emails || [];

  const displayNotifs = activeTab === 'unread' ? notifs.filter((n) => !n.is_read) : notifs;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between border shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BellIcon className="w-5 h-5 text-slate-700" />
              <span>Pusat Notifikasi & Riwayat Transaksional</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Live (WebSocket)</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pembaruan sistem in-app, status domain, email leads masuk, dan riwayat faktur email secara langsung.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({notifs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Belum Dibaca</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emails')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'emails'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Email Transaksional ({recentEmails.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'preferences'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Preferensi
          </button>
        </div>
      </div>

      {/* Tab: In-App Notifications Feed (All / Unread) */}
      {(activeTab === 'all' || activeTab === 'unread') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {activeTab === 'unread' ? 'Notifikasi Belum Dibaca' : 'Semua Notifikasi In-App'}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
              >
                <CheckIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {displayNotifs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <BellIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Tidak ada notifikasi untuk ditampilkan saat ini.</p>
              </div>
            ) : (
              displayNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`py-4 px-3 rounded-xl flex items-start justify-between gap-4 transition-colors ${
                    !n.is_read ? 'bg-slate-50/70 border border-slate-100' : 'hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Type Badge Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'domain'
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          : n.type === 'lead'
                          ? 'bg-purple-50 text-purple-600 border border-purple-100'
                          : n.type === 'billing'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <BellIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title="Belum dibaca" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(n.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                        {n.action_url && (
                          <a
                            href={n.action_url}
                            className="font-semibold text-slate-800 hover:underline flex items-center gap-0.5"
                          >
                            <span>Buka Halaman</span>
                            <ExternalLinkIcon className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold"
                        title="Tandai telah dibaca"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteNotif(n.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Hapus notifikasi"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Transactional Email Audit Trail */}
      {activeTab === 'emails' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MailIcon className="w-4 h-4 text-slate-700" />
              <span>Log Email Transaksional Akun</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh korespondensi otomatis sistem (Welcome, Verifikasi, Tagihan & Kwitansi, Status Domain).
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Subjek Email</th>
                  <th className="py-3 px-4">Penerima</th>
                  <th className="py-3 px-4">Status Pengiriman</th>
                  <th className="py-3 px-4 text-right">Waktu Terkirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentEmails.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      Belum ada catatan email transaksional yang dikirim.
                    </td>
                  </tr>
                ) : (
                  recentEmails.map((em) => (
                    <tr key={em.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {em.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{em.subject}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{em.recipient}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <CheckIcon className="w-3 h-3 text-emerald-600" />
                          <span>Terkirim (Delivered)</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {new Date(em.sent_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Notification Preferences Form */}
      {activeTab === 'preferences' && (
        <form
          onSubmit={handleSavePreferences}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-slate-700" />
                <span>Preferensi Pengiriman Email Notifikasi</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih jenis email notifikasi yang ingin Anda terima ke alamat <strong>{user?.email || 'owner@kopiseduh.id'}</strong>.
              </p>
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              {actionLoading && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Preferensi</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Security */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="pr-3">
                <p className="text-xs font-bold text-slate-900">Email Keamanan & Login Baru</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pemberitahuan penting jika terdeteksi aktivitas login dari perangkat baru atau perubahan kata sandi akun.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.email_security}
                onChange={(e) => setPrefs({ ...prefs, email_security: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Billing */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="pr-3">
                <p className="text-xs font-bold text-slate-900">Tagihan & Bukti Pembayaran (Invoices)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Salinan faktur PDF otomatis setiap kali perpanjangan langganan berhasil didebit.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.email_billing}
                onChange={(e) => setPrefs({ ...prefs, email_billing: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Domain Status */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="pr-3">
                <p className="text-xs font-bold text-slate-900">Status Domain Kustom & Pembaruan SSL</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Notifikasi ketika domain kustom berhasil diverifikasi DNS atau sertifikat SSL diperbarui.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.email_domain_status}
                onChange={(e) => setPrefs({ ...prefs, email_domain_status: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* New Lead */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="pr-3">
                <p className="text-xs font-bold text-slate-900">Pemberitahuan Lead / Kontak Pengunjung Baru</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Email instan setiap kali pengunjung mengisi formulir email capture di bio link Anda.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.email_new_lead}
                onChange={(e) => setPrefs({ ...prefs, email_new_lead: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Marketing Deals */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="pr-3">
                <p className="text-xs font-bold text-slate-900">Penawaran Promo & Buletin Fitur Baru</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Informasi pembaruan fitur eksklusif, template baru, dan voucher diskon langganan Klikin.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.email_marketing}
                onChange={(e) => setPrefs({ ...prefs, email_marketing: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* In-app sound */}
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="pr-3">
                <p className="text-xs font-bold text-slate-900">Suara Notifikasi In-App</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bunyikan nada lonceng halus saat ada klik tautan baru atau pengunjung mendaftar newsletter.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.in_app_sound}
                onChange={(e) => setPrefs({ ...prefs, in_app_sound: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </form>
      )}
    </div>
  );
}
