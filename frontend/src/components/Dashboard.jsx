import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import {
  BarChartIcon,
  LayersIcon,
  ExternalLinkIcon,
  CheckIcon,
  AlertCircleIcon,
  ShoppingBagIcon,
  MessageCircleIcon,
  PlayCircleIcon,
} from './Icons';

const API_BASE = 'http://localhost:8080/api';

export default function Dashboard({ user, token, onLogout }) {
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // SuperAdmin States
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  
  // Owner States
  const [workspace, setWorkspace] = useState(null);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  
  // Shared States
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (isSuperAdmin) {
        // Fetch Admin Stats & Users
        const [statsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const statsData = await statsRes.json();
        const usersData = await usersRes.json();

        if (statsData.success) setAdminStats(statsData.data);
        if (usersData.success) setAdminUsers(usersData.data);
      } else {
        // Fetch Owner Workspace
        const res = await fetch(`${API_BASE}/owner/workspace`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setWorkspace(data.data);
        } else {
          setFeedback({ type: 'error', message: data.error || 'Gagal memuat ruang kerja' });
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Gagal terhubung ke backend: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Owner: Add new link into their isolated workspace
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl) return;

    try {
      const res = await fetch(`${API_BASE}/owner/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newLinkTitle,
          url: newLinkUrl,
          icon: 'ShoppingBag',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewLinkTitle('');
        setNewLinkUrl('');
        setIsAddingLink(false);
        fetchDashboardData();
        setFeedback({ type: 'success', message: 'Tautan baru berhasil ditambahkan ke profil Anda!' });
      } else {
        setFeedback({ type: 'error', message: data.error });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Owner: Delete a link from their workspace
  const handleDeleteLink = async (linkId) => {
    if (!confirm('Hapus tautan ini dari halaman bio Anda?')) return;
    try {
      const res = await fetch(`${API_BASE}/owner/links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
        setFeedback({ type: 'success', message: 'Tautan berhasil dihapus.' });
      } else {
        setFeedback({ type: 'error', message: data.error });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-void)] text-white font-sans selection:bg-[var(--color-acid-lime)] selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--color-carbon)] border-b border-[var(--color-graphite)] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Logo size={26} />
          <span className="hidden sm:inline-block w-px h-4 bg-[var(--color-graphite)]" />
          <span
            className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${
              isSuperAdmin
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-[var(--color-acid-lime)]/15 text-[var(--color-acid-lime)] border-[var(--color-acid-lime)]/30'
            }`}
          >
            {isSuperAdmin ? 'SUPER ADMIN' : 'OWNER WORKSPACE'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-white font-medium">{user?.full_name || user?.username}</span>
            <span className="text-[var(--color-fog)] text-[11px]">{user?.email}</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="btn-ghost-dark text-xs py-1.5 px-3 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
          >
            Keluar (Logout)
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--color-fog)]">
            <div className="w-6 h-6 border-2 border-[var(--color-acid-lime)] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="font-mono text-xs">Memuat data dashboard...</span>
          </div>
        ) : isSuperAdmin ? (
          /* ======================================================== */
          /* SUPER ADMIN DASHBOARD VIEW                               */
          /* ======================================================== */
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-[510] text-white tracking-tight mb-1">
                Platform Control Center
              </h1>
              <p className="text-sm text-[var(--color-fog)]">
                Pantau seluruh metrik operasional, pengguna, dan performa platform Klikin secara global.
              </p>
            </div>

            {/* Platform Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="pro-card p-5">
                <span className="text-xs font-mono text-[var(--color-fog)]">Total Pengguna</span>
                <div className="text-3xl font-[510] font-mono text-white mt-1">
                  {adminStats?.total_users || 0}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  {adminStats?.pro_subscribers || 0} Akun Pro Aktif
                </div>
              </div>

              <div className="pro-card p-5">
                <span className="text-xs font-mono text-[var(--color-fog)]">Halaman Bio Aktif</span>
                <div className="text-3xl font-[510] font-mono text-white mt-1">
                  {adminStats?.total_bio_pages || 0}
                </div>
                <div className="text-[11px] text-[var(--color-fog)] font-mono mt-1">
                  {adminStats?.total_links || 0} Tautan Terdaftar
                </div>
              </div>

              <div className="pro-card p-5">
                <span className="text-xs font-mono text-[var(--color-fog)]">Total Klik Global</span>
                <div className="text-3xl font-[510] font-mono text-[var(--color-acid-lime)] mt-1">
                  {(adminStats?.total_clicks || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  Semua bio page
                </div>
              </div>

              <div className="pro-card p-5">
                <span className="text-xs font-mono text-[var(--color-fog)]">Estimasi MRR</span>
                <div className="text-3xl font-[510] font-mono text-white mt-1">
                  Rp {(adminStats?.mrr || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  Sistem: {adminStats?.system_uptime} Uptime
                </div>
              </div>
            </div>

            {/* User Directory Table */}
            <div className="pro-card overflow-hidden">
              <div className="p-5 border-b border-[var(--color-graphite)] flex items-center justify-between">
                <div>
                  <h3 className="font-[510] text-white text-base">Daftar Akun Pengguna</h3>
                  <p className="text-xs text-[var(--color-fog)]">Seluruh entitas terdaftar pada database PostgreSQL</p>
                </div>
                <button
                  type="button"
                  onClick={fetchDashboardData}
                  className="btn-ghost-dark text-xs py-1.5 px-3"
                >
                  Segarkan Data
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121316] text-[var(--color-fog)] border-b border-[var(--color-graphite)]">
                    <tr>
                      <th className="p-3.5">User ID</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Username</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Paket</th>
                      <th className="p-3.5">Bio Page</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-graphite)] text-[var(--color-mist)]">
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 text-[var(--color-fog)]">{u.id}</td>
                        <td className="p-3.5 text-white font-medium">{u.email}</td>
                        <td className="p-3.5 text-[var(--color-acid-lime)]">@{u.username}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {u.is_pro ? (
                            <span className="text-[var(--color-acid-lime)] font-semibold">PRO</span>
                          ) : (
                            <span className="text-[var(--color-fog)]">FREE</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {u.pages && u.pages.length > 0 ? (
                            <span className="text-white">/{u.pages[0].slug}</span>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* ACCOUNT OWNER DASHBOARD VIEW (Isolated Workspace)        */
          /* ======================================================== */
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header: Workspace Overview */}
            <div className="pro-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[var(--color-carbon)] to-[#15171a]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-[510] text-white tracking-tight">
                    {workspace?.title || 'Ruang Kerja Bio Anda'}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Aktif & Publik
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-fog)]">
                  <span>Tautan Publik:</span>
                  <a
                    href={`#`}
                    className="text-[var(--color-acid-lime)] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <span>klikin.id/{workspace?.slug || user?.username}</span>
                    <ExternalLinkIcon className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-xs text-[var(--color-mist)] mt-2 max-w-lg leading-relaxed">
                  {workspace?.bio || 'Belum ada deskripsi profil.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingLink(true)}
                  className="btn-acid text-xs py-2 px-4 shadow-sm"
                >
                  + Tambah Link Baru
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4">
              <div className="pro-card p-4 text-center">
                <span className="text-xs font-mono text-[var(--color-fog)]">Total Tautan</span>
                <div className="text-2xl font-[510] font-mono text-white mt-1">
                  {workspace?.links?.length || 0}
                </div>
              </div>
              <div className="pro-card p-4 text-center">
                <span className="text-xs font-mono text-[var(--color-fog)]">Akumulasi Klik</span>
                <div className="text-2xl font-[510] font-mono text-[var(--color-acid-lime)] mt-1">
                  {workspace?.links
                    ? workspace.links.reduce((acc, l) => acc + (l.click_count || 0), 0).toLocaleString('id-ID')
                    : 0}
                </div>
              </div>
              <div className="pro-card p-4 text-center">
                <span className="text-xs font-mono text-[var(--color-fog)]">Preset Tema</span>
                <div className="text-sm font-[510] font-mono text-white uppercase mt-2">
                  {workspace?.theme || 'midnight'}
                </div>
              </div>
            </div>

            {/* Add Link Form Modal / Inset Box */}
            {isAddingLink && (
              <div className="pro-card p-6 border-[var(--color-acid-lime)]/40 bg-[var(--color-obsidian)] animate-in fade-in duration-150">
                <h3 className="font-[510] text-white text-sm mb-3">Tambah Tautan Baru ke Bio Anda</h3>
                <form onSubmit={handleAddLink} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-mono text-[var(--color-fog)] mb-1">
                      Judul Tautan (Label)
                    </label>
                    <input
                      type="text"
                      required
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Contoh: Toko Online Shopee"
                      className="w-full bg-[var(--color-carbon)] border border-[var(--color-graphite)] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-mono text-[var(--color-fog)] mb-1">
                      URL Tujuan
                    </label>
                    <input
                      type="url"
                      required
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://shopee.co.id/brandanda"
                      className="w-full bg-[var(--color-carbon)] border border-[var(--color-graphite)] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <button type="submit" className="btn-acid text-xs py-2 px-3 w-full">
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingLink(false)}
                      className="btn-ghost-dark text-xs py-2 px-3"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Managed Links List */}
            <div className="pro-card p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-graphite)]">
                <h3 className="font-[510] text-white text-base">Daftar Tautan di Halaman Bio</h3>
                <span className="text-xs text-[var(--color-fog)] font-mono">
                  Ruang Mandiri: {user?.username}
                </span>
              </div>

              {!workspace?.links || workspace.links.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-fog)] text-xs font-mono">
                  Belum ada tautan aktif. Klik tombol "+ Tambah Link Baru" di atas untuk menambahkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {workspace.links.map((link) => (
                    <div
                      key={link.id}
                      className="p-4 rounded-xl bg-[var(--color-carbon)] border border-[var(--color-graphite)] hover:border-zinc-700 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-obsidian)] border border-white/5 flex items-center justify-center text-[var(--color-acid-lime)] shrink-0">
                          <ShoppingBagIcon className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-sm font-medium text-white tracking-tight">
                            {link.title}
                          </div>
                          <div className="text-xs font-mono text-[var(--color-fog)] truncate mt-0.5">
                            {link.url}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-mono text-[var(--color-acid-lime)] bg-[var(--color-acid-lime)]/10 px-2 py-0.5 rounded border border-[var(--color-acid-lime)]/20">
                          {link.click_count || 0} klik
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id)}
                          className="text-xs text-[var(--color-fog)] hover:text-rose-400 font-mono transition-colors p-1"
                          title="Hapus tautan ini"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
