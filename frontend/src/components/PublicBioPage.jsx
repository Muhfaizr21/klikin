import React, { useState, useEffect } from 'react';
import {
  ShoppingBagIcon,
  PlayCircleIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
  TwitterIcon,
  LinkIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
  MessageCircleIcon,
  MusicIcon,
  SparklesIcon,
  MailIcon,
  GlobeIcon,
  VerifiedBadgeIcon,
  LockIcon,
  ShieldAlertIcon,
} from './Icons';
import { API_BASE } from '../lib/api';

export default function PublicBioPage({ slug, onBackToHome }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Password Unlock State
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  // Email Lead Capture State
  const [leadEmail, setLeadEmail] = useState('');
  const [leadConsent, setLeadConsent] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccessMsg, setLeadSuccessMsg] = useState(null);
  const [leadError, setLeadError] = useState(null);

  // Visitor Content Report State (Synced with Super Admin Moderation Module 3.5)
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('phishing');
  const [reportReason, setReportReason] = useState('');
  const [reportedUrl, setReportedUrl] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    fetchPublicPage();
  }, [slug]);

  const fetchPublicPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/pages/${slug}`);
      const data = await res.json();
      if (data.success && data.data) {
        setPage(data.data);
        // Track page view event
        fetch(`${API_BASE}/track/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            page_id: data.data.id,
            referrer: document.referrer || 'direct',
          }),
        }).catch(() => {});
      } else {
        setError(data.error || 'Halaman bio tidak ditemukan atau sedang dinonaktifkan.');
      }
    } catch (err) {
      setError('Gagal memuat halaman: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = (targetTitle, targetUrl, blockId) => {
    if (!page) return;
    fetch(`${API_BASE}/track/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        page_id: page.id,
        block_id: blockId || '',
        target_title: targetTitle || 'Tautan',
        target_url: targetUrl || '',
        referrer: window.location.href,
      }),
    }).catch(() => {});
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadEmail || !page) return;
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const res = await fetch(`${API_BASE}/public/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug_or_page_id: slug || page.slug || page.id,
          email: leadEmail,
          source: document.referrer ? (document.referrer.includes('instagram') ? 'instagram' : document.referrer.includes('tiktok') ? 'tiktok' : 'referral') : 'direct',
          consent_given: leadConsent || !page.email_capture?.consent_enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim email');
      }
      setLeadSuccessMsg(data.message || page.email_capture?.success_message || 'Terima kasih!');
      setLeadEmail('');
    } catch (err) {
      setLeadError(err.message);
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleUnlockPage = async (e) => {
    e.preventDefault();
    if (!unlockPassword) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await fetch(`${API_BASE}/pages/${slug}`, {
        headers: {
          'X-Page-Password': unlockPassword,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success || data.data?.is_locked) {
        throw new Error('Kata sandi salah. Silakan coba kembali.');
      }
      setPage(data.data);
      setUnlockPassword('');
    } catch (err) {
      setUnlockError(err.message || 'Gagal membuka halaman');
    } finally {
      setUnlocking(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReportSubmitting(true);
    setReportError(null);
    try {
      const res = await fetch(`${API_BASE}/public/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug || page?.slug,
          category: reportCategory,
          reason: reportReason.trim(),
          reported_url: reportedUrl.trim(),
          reporter_email: reporterEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim laporan pelanggaran');
      }
      setReportSuccess(data.message || 'Laporan berhasil dikirim ke tim Trust & Safety Klikin.');
      setReportReason('');
      setReportedUrl('');
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-mono">Memuat halaman bio...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 font-bold text-lg">
            !
          </div>
          <h2 className="text-base font-bold text-white">Halaman Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'Halaman bio ini mungkin belum dipublikasikan atau URL tidak valid.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (page.is_locked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <LockIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-white">Halaman Diproteksi Kata Sandi</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pemilik halaman <span className="text-white font-medium">@{slug}</span> membatasi akses konten ini. Masukkan kata sandi untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={handleUnlockPage} className="space-y-3 pt-2">
            <div>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                autoFocus
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>
            {unlockError && (
              <p className="text-xs text-rose-400 font-medium">{unlockError}</p>
            )}
            <button
              type="submit"
              disabled={unlocking || !unlockPassword}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              {unlocking ? 'Memverifikasi...' : 'Buka Halaman'}
            </button>
          </form>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    title,
    bio,
    avatar_url,
    background_color = '#ffffff',
    button_color = '#0f172a',
    button_text_color = '#ffffff',
    font_family = 'sans',
    button_radius = 'rounded-xl',
    button_shadow = 'shadow-xs',
    block_spacing = 'normal',
    page_shadow = 'none',
    bg_image_url = '',
    custom_css = '',
    blocks = [],
  } = page;

  const getFontClass = () => {
    switch (font_family) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  const getSpacingClass = () => {
    switch (block_spacing) {
      case 'compact':
        return 'space-y-2.5';
      case 'relaxed':
        return 'space-y-5';
      default:
        return 'space-y-3.5';
    }
  };

  const isDarkBg = () => {
    if (bg_image_url) return true;
    if (!background_color) return false;
    const color = background_color.toLowerCase().trim();
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substr(0, 2), 16) || 0;
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substr(2, 2), 16) || 0;
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substr(4, 2), 16) || 0;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.55;
    }
    if (color.includes('gradient') || color.includes('rgb(0') || color.includes('black')) return true;
    return false;
  };

  const isDark = isDarkBg();

  const parseSocials = (settingsStr) => {
    try {
      return JSON.parse(settingsStr || '[]');
    } catch {
      return [];
    }
  };

  const renderLinkIcon = (iconId) => {
    switch (iconId) {
      case 'Shop':
        return <ShoppingBagIcon className="w-4 h-4 shrink-0 opacity-80" />;
      case 'Chat':
        return <MessageCircleIcon className="w-4 h-4 shrink-0 opacity-80" />;
      case 'Video':
        return <PlayCircleIcon className="w-4 h-4 shrink-0 opacity-80" />;
      case 'Music':
        return <MusicIcon className="w-4 h-4 shrink-0 opacity-80" />;
      case 'Promo':
        return <SparklesIcon className="w-4 h-4 shrink-0 opacity-80" />;
      default:
        return <LinkIcon className="w-4 h-4 shrink-0 opacity-80" />;
    }
  };

  const renderSocialIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram':
        return <InstagramIcon className="w-4 h-4" />;
      case 'tiktok':
        return <TikTokIcon className="w-4 h-4" />;
      case 'whatsapp':
        return <WhatsAppIcon className="w-4 h-4" />;
      case 'youtube':
        return <YouTubeIcon className="w-4 h-4" />;
      case 'twitter':
        return <TwitterIcon className="w-4 h-4" />;
      case 'shopee':
        return <ShoppingBagIcon className="w-4 h-4" />;
      case 'email':
        return <MailIcon className="w-4 h-4" />;
      case 'website':
        return <GlobeIcon className="w-4 h-4" />;
      default:
        return <LinkIcon className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 ${getFontClass()} klikin-page transition-colors duration-200`}
      style={{
        background: bg_image_url
          ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${bg_image_url}') center/cover fixed no-repeat`
          : background_color || '#ffffff',
      }}
    >
      {custom_css && (
        <style
          dangerouslySetInnerHTML={{
            __html: String(custom_css)
              .replace(/<\/?style[^>]*>/gi, '')
              .replace(/<\/?script[^>]*>/gi, '')
              .replace(/javascript\s*:/gi, ''),
          }}
        />
      )}

      {/* Top Floating Mini Bar */}
      <div className="w-full max-w-lg flex items-center justify-between py-2 text-xs opacity-75">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-current hover:opacity-100 transition-opacity"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Klikin</span>
        </button>
      </div>

      {/* Main Card Container */}
      <main className="w-full max-w-md my-auto py-6 space-y-6">
        {/* Profile Bio Header */}
        <div className="text-center space-y-3">
          <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-slate-200 border-2 border-white/80 shadow-md flex items-center justify-center">
            {avatar_url ? (
              <img
                src={avatar_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-slate-600 font-mono">
                {(title || 'K').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-1.5 px-3">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <h1
                className={`text-lg font-bold tracking-tight transition-colors ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {title}
              </h1>
              {page?.is_verified && (
                <VerifiedBadgeIcon className="w-4 h-4 text-sky-500 shrink-0" title="Kreator Terverifikasi" />
              )}
            </div>
            {bio && (
              <p
                className={`text-xs leading-relaxed max-w-sm mx-auto transition-colors ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* Blocks Content */}
        <div className={`w-full ${getSpacingClass()}`}>
          {blocks
            .filter((b) => b.is_active)
            .map((block) => {
              if (block.type === 'link') {
                const spotlightClass =
                  block.spotlight === 'pulse'
                    ? 'spotlight-pulse'
                    : block.spotlight === 'wiggle'
                    ? 'spotlight-wiggle'
                    : block.spotlight === 'bounce'
                    ? 'spotlight-bounce'
                    : '';

                return (
                  <a
                    key={block.id}
                    href={block.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleTrackClick(block.title, block.url, block.id)}
                    className={`w-full p-3.5 flex items-center justify-between border border-black/5 transition-transform active:scale-[0.98] hover:opacity-95 ${button_radius} ${button_shadow} ${spotlightClass}`}
                    style={{
                      backgroundColor: button_color || '#0f172a',
                      color: button_text_color || '#ffffff',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {block.image_url ? (
                        <img
                          src={block.image_url}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        renderLinkIcon(block.icon)
                      )}
                      <div className="min-w-0 text-left">
                        <span className="block text-xs font-bold truncate leading-tight">
                          {block.title || 'Tautan'}
                        </span>
                        {block.subtitle && (
                          <span className="block text-[11px] opacity-75 truncate leading-tight mt-0.5">
                            {block.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </a>
                );
              }

              if (block.type === 'header') {
                const isLeft = block.content === 'left';
                return (
                  <div key={block.id} className={`pt-3 pb-1 ${isLeft ? 'text-left pl-1' : 'text-center'}`}>
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {block.title}
                    </h2>
                  </div>
                );
              }

              if (block.type === 'divider') {
                const style = block.content || 'solid';
                if (style === 'space') {
                  return <div key={block.id} className="h-4" />;
                }
                return (
                  <div key={block.id} className="py-2">
                    {style === 'dots' ? (
                      <div className="flex justify-center gap-2 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      </div>
                    ) : (
                      <hr
                        className={`border-slate-300/80 ${
                          style === 'dashed' ? 'border-dashed' : 'border-solid'
                        }`}
                      />
                    )}
                  </div>
                );
              }

              if (block.type === 'text') {
                return (
                  <div
                    key={block.id}
                    className="p-3.5 rounded-xl bg-white/75 backdrop-blur-xs border border-black/5 text-slate-800 text-left space-y-1 shadow-2xs"
                  >
                    {block.title && (
                      <h4 className="text-xs font-bold text-slate-900">{block.title}</h4>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {block.content}
                    </p>
                  </div>
                );
              }

              if (block.type === 'socials') {
                const socials = parseSocials(block.settings);
                const isMultiRow = socials.length > 4;
                return (
                  <div key={block.id} className="w-full py-2">
                    <div
                      className={
                        isMultiRow
                          ? "grid grid-cols-4 gap-3 max-w-[230px] mx-auto place-items-center"
                          : "flex flex-wrap items-center justify-center gap-3"
                      }
                    >
                      {socials.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleTrackClick(s.platform, s.url, block.id)}
                          className="w-10 h-10 aspect-square shrink-0 rounded-full bg-white/95 shadow-2xs border border-slate-200/90 flex items-center justify-center text-slate-800 hover:scale-110 hover:shadow-md transition-all"
                        >
                          {renderSocialIcon(s.platform)}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }

              if (block.type === 'embed') {
                return (
                  <div
                    key={block.id}
                    className="rounded-xl overflow-hidden border border-black/10 bg-black/90 shadow-xs"
                  >
                    <div className="aspect-video w-full flex flex-col items-center justify-center text-white/90 p-4 text-center">
                      <PlayCircleIcon className="w-8 h-8 mb-2 text-white/80" />
                      <span className="text-xs font-bold line-clamp-1">{block.title}</span>
                      <a
                        href={block.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-400 font-mono mt-1 hover:underline truncate max-w-full"
                      >
                        Buka Media Eksternal ↗
                      </a>
                    </div>
                  </div>
                );
              }

              return null;
            })}

          {/* Public Email Capture Form Block (4.8 Pro) */}
          {page?.email_capture && page.email_capture.is_enabled && (
            <div
              className={`w-full p-4 sm:p-5 border border-black/10 transition-all ${button_radius} ${button_shadow}`}
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                color: isDark ? '#ffffff' : '#0f172a',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <MailIcon className="w-4 h-4 opacity-80" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold leading-tight">
                    {page.email_capture.title || 'Dapatkan Update & Promo'}
                  </h3>
                  {page.email_capture.description && (
                    <p className="text-[11px] opacity-75 mt-1 leading-relaxed">
                      {page.email_capture.description}
                    </p>
                  )}
                </div>
              </div>

              {leadSuccessMsg ? (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center animate-fade-in">
                  {leadSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder={page.email_capture.placeholder || 'Alamat email Anda...'}
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/15 bg-white/10 placeholder:opacity-50 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={leadSubmitting}
                      className="sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl shrink-0 transition-opacity active:scale-[0.98] disabled:opacity-50"
                      style={{
                        backgroundColor: button_color || '#0f172a',
                        color: button_text_color || '#ffffff',
                      }}
                    >
                      {leadSubmitting ? 'Mengirim...' : page.email_capture.button_text || 'Kirim'}
                    </button>
                  </div>

                  {page.email_capture.consent_enabled && (
                    <label className="flex items-start gap-2 cursor-pointer text-[10px] opacity-70">
                      <input
                        type="checkbox"
                        checked={leadConsent}
                        onChange={(e) => setLeadConsent(e.target.checked)}
                        required
                        className="mt-0.5 rounded border-slate-300"
                      />
                      <span>{page.email_capture.consent_text}</span>
                    </label>
                  )}

                  {leadError && (
                    <p className="text-[11px] text-rose-400 font-medium">{leadError}</p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Branding Watermark & Trust/Safety Report Link */}
      <footer className="w-full max-w-lg py-4 flex flex-col items-center gap-2 text-center text-xs">
        {!page?.is_pro && (
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onBackToHome();
            }}
            className="font-mono text-[11px] font-semibold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
          >
            Dibuat dengan Klikin
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setReportSuccess(null);
            setReportError(null);
            setReportModalOpen(true);
          }}
          className="inline-flex items-center gap-1 text-[10px] font-medium opacity-45 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <ShieldAlertIcon className="w-3 h-3" />
          <span>Laporkan Halaman</span>
        </button>
      </footer>

      {/* Visitor Report Abuse Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 text-slate-800 font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlertIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Laporkan Pelanggaran Konten</h3>
                  <p className="text-[11px] text-slate-500">Halaman @{slug} akan ditinjau oleh Trust & Safety Klikin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="space-y-4 pt-1">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                  {reportSuccess}
                </div>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Pelanggaran</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden focus:border-slate-400"
                  >
                    <option value="phishing">Phishing / Penipuan / Scam</option>
                    <option value="gambling">Judi Online / Taruhan Ilegal</option>
                    <option value="adult">Konten Dewasa / Pornografi</option>
                    <option value="spam">Spam / Malware / Tautan Mencurigakan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tautan Bermasalah (Opsional)</label>
                  <input
                    type="text"
                    value={reportedUrl}
                    onChange={(e) => setReportedUrl(e.target.value)}
                    placeholder="Contoh: https://domain-mencurigakan.xyz"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detail Laporan *</label>
                  <textarea
                    rows={3}
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Jelaskan indikasi pelanggaran pada halaman ini..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Pelapor (Opsional)</label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="email@anda.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                {reportError && (
                  <p className="text-rose-600 font-semibold text-[11px]">{reportError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting || !reportReason.trim()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    {reportSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
