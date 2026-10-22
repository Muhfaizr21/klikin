import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';
import {
  XIcon,
  ShieldAlertIcon,
  ExternalLinkIcon,
  BanIcon,
  CheckIcon,
  LockIcon,
  VerifiedBadgeIcon,
  LinkIcon,
  AlertCircleIcon,
} from '../Icons';

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1971) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ModerationDetailDrawer({
  pageId,
  token,
  isOpen,
  onClose,
  onOpenFlag,
  onOpenTakeDown,
  onOpenBanUser,
  onOpenReviewReport,
  onQuickBlacklistUrl,
  onRefreshParent,
}) {
  const [activeTab, setActiveTab] = useState('links'); // 'links' | 'reports' | 'logs'
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (isOpen && pageId) {
      fetchDetail();
    } else {
      setDetail(null);
      setActiveTab('links');
    }
  }, [isOpen, pageId]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/moderation/pages/${pageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memuat detail keamanan halaman');
      }
      setDetail(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFlagOrRestore = async (type) => {
    if (!detail?.page) return;
    setActionBusy(true);
    try {
      const endpoint =
        type === 'restore'
          ? `${API_BASE}/admin/moderation/pages/${detail.page.id}/restore`
          : `${API_BASE}/admin/moderation/pages/${detail.page.id}/clear-flag`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note:
            type === 'restore'
              ? 'Dipulihkan kembali ke status LIVE oleh Super Admin setelah peninjauan.'
              : 'Flag dibersihkan oleh Super Admin setelah inspeksi tautan.',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memperbarui status halaman');
      }
      await fetchDetail();
      onRefreshParent?.(json.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  if (!isOpen) return null;

  const page = detail?.page;
  const owner = detail?.owner;
  const blocks = detail?.blocks || [];
  const links = detail?.links || [];
  const reports = detail?.reports || [];
  const logs = detail?.logs || [];
  const matchedBlacklist = detail?.matched_blacklist || [];

  const allUrls = [
    ...links.map((l) => ({
      id: l.id,
      kind: 'Link Utama',
      title: l.title,
      url: l.url,
      clicks: l.click_count || 0,
      active: l.is_active,
    })),
    ...blocks
      .filter((b) => b.url)
      .map((b) => ({
        id: b.id,
        kind: `Blok (${b.type})`,
        title: b.title || b.type,
        url: b.url,
        clicks: 0,
        active: b.is_active,
      })),
  ];

  const getModStatusBadge = (status) => {
    switch (status) {
      case 'flagged':
        return {
          label: 'Flagged',
          className: 'bg-amber-50 text-amber-800 border-amber-200/90',
        };
      case 'taken_down':
        return {
          label: 'Taken Down',
          className: 'bg-rose-50 text-rose-700 border-rose-200/90',
        };
      default:
        return {
          label: 'Aman (Clean)',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {(page?.slug?.charAt(0) || 'P').toUpperCase()}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono truncate">
                  /{page?.slug || 'Memuat...'}
                </h3>
                {owner?.is_verified && (
                  <VerifiedBadgeIcon className="w-4 h-4 text-sky-500 shrink-0" />
                )}
                {page && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                      getModStatusBadge(page.moderation_status).className
                    }`}
                  >
                    {getModStatusBadge(page.moderation_status).label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Pemilik: @{owner?.username} ({owner?.email}) • Akun:{' '}
                <span className="font-semibold text-slate-700 capitalize">{owner?.status || 'active'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {page?.slug && (
              <a
                href={`/${page.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
              >
                <span>Buka Live</span>
                <ExternalLinkIcon className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 cursor-pointer shadow-2xs"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200/80 bg-white flex items-center gap-2">
          {[
            { id: 'links', label: `Inspeksi Tautan & Konten (${allUrls.length})` },
            { id: 'reports', label: `Laporan Pengunjung (${reports.length})` },
            { id: 'logs', label: `Log Moderasi (${logs.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />
              <span>Memindai struktur halaman, blok tautan, dan riwayat laporan...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {error}
            </div>
          ) : detail && page ? (
            <>
              {/* Security Status Banner & Quick Enforcement Controls */}
              <div className="p-5 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Judul & Bio Halaman Publik
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      {page.title || `Halaman @${owner?.username}`}
                    </h4>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {page.bio || 'Tidak ada deskripsi bio.'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                      Skor Risiko Keamanan
                    </span>
                    <span
                      className={`text-xl font-bold font-mono ${
                        detail.risk_score >= 60
                          ? 'text-rose-600'
                          : detail.risk_score >= 30
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {detail.risk_score}/100
                    </span>
                  </div>
                </div>

                {matchedBlacklist.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                    <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">
                        Terdeteksi tautan menuju domain blacklist platform
                      </span>
                      <span className="font-mono text-[11px]">
                        Domain cocok: {matchedBlacklist.join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {page.flag_reason && page.moderation_status === 'flagged' && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="text-[10px] font-semibold uppercase block text-amber-700">
                      Alasan Flag Aktif ({page.flag_category} • {page.flag_severity}):
                    </span>
                    <p className="mt-0.5 font-medium">{page.flag_reason}</p>
                  </div>
                )}

                {page.takedown_reason && page.moderation_status === 'taken_down' && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                    <span className="text-[10px] font-semibold uppercase block text-rose-700">
                      Alasan Take-Down ({formatDateShort(page.taken_down_at)}):
                    </span>
                    <p className="mt-0.5 font-medium">{page.takedown_reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenFlag?.({
                        ...page,
                        page_id: page.id,
                        username: owner?.username,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ShieldAlertIcon className="w-3.5 h-3.5" />
                    <span>Flag Konten</span>
                  </button>

                  {page.moderation_status === 'flagged' && (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleClearFlagOrRestore('clear')}
                      className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Bersihkan Flag</span>
                    </button>
                  )}

                  {page.moderation_status !== 'taken_down' ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTakeDown?.({
                          ...page,
                          page_id: page.id,
                          username: owner?.username,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <BanIcon className="w-3.5 h-3.5" />
                      <span>Take Down Halaman</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleClearFlagOrRestore('restore')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Pulihkan Halaman Live</span>
                    </button>
                  )}

                  {owner?.status !== 'banned' && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenBanUser?.({
                          user_id: owner?.id,
                          username: owner?.username,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer ml-auto shadow-2xs"
                    >
                      <LockIcon className="w-3.5 h-3.5" />
                      <span>Ban Akun User</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TAB 1: LINKS & BLOCKS */}
              {activeTab === 'links' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 text-xs">
                      Daftar Tautan Keluar pada Halaman /{page.slug}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Inspeksi URL target & domain
                    </span>
                  </div>

                  {allUrls.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Halaman ini belum memiliki tautan keluar aktif.
                    </div>
                  ) : (
                    allUrls.map((item) => {
                      let domainHost = '';
                      try {
                        domainHost = new URL(item.url).hostname;
                      } catch {
                        domainHost = item.url;
                      }
                      const isMatched = matchedBlacklist.some((pat) =>
                        item.url.toLowerCase().includes(pat.toLowerCase())
                      );

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isMatched
                              ? 'border-rose-200 bg-rose-50/60'
                              : 'border-slate-200/80 bg-white'
                          }`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-900 truncate">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {item.kind}
                              </span>
                              {isMatched && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                                  Blacklisted
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-[11px] text-indigo-600 truncate">
                              {item.url}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {domainHost && !isMatched && (
                              <button
                                type="button"
                                onClick={() => onQuickBlacklistUrl?.(domainHost)}
                                className="px-2.5 py-1 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] cursor-pointer"
                              >
                                + Blacklist Domain
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: VISITOR REPORTS */}
              {activeTab === 'reports' && (
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Tidak ada laporan pengunjung untuk halaman ini.
                    </div>
                  ) : (
                    reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {rep.reporter_name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({rep.reporter_ip})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              {rep.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                rep.status === 'pending'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : rep.status === 'actioned'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {rep.status === 'pending'
                                ? 'Menunggu'
                                : rep.status === 'actioned'
                                ? 'Ditindak'
                                : 'Diabaikan'}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-normal">{rep.description}</p>
                        {rep.target_url && (
                          <p className="font-mono text-[11px] text-rose-600">
                            URL: {rep.target_url}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                          <span>Dilaporkan: {formatDateShort(rep.created_at)}</span>
                          {rep.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenReviewReport?.({
                                  ...rep,
                                  owner_username: owner?.username,
                                })
                              }
                              className="px-3 py-1 rounded-md bg-slate-900 text-white font-semibold text-[11px] cursor-pointer hover:bg-slate-800 shadow-2xs"
                            >
                              Tinjau Laporan
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: MODERATION LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                      Belum ada riwayat tindakan moderasi pada halaman ini.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/50 flex items-start justify-between gap-3"
                      >
                        <div>
                          <span className="font-mono font-semibold text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {log.action}
                          </span>
                          <p className="text-slate-800 font-medium mt-1.5">{log.details}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Oleh: {log.admin_name}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formatDateShort(log.created_at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Page ID: {page?.id || pageId}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
