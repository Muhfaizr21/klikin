import React from 'react';
import {
  LinkIcon,
  ShoppingBagIcon,
  PlayCircleIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
  TwitterIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  MusicIcon,
  SparklesIcon,
  MailIcon,
  GlobeIcon,
  LockIcon,
  VerifiedBadgeIcon,
} from '../../Icons';

export default function DesktopPreviewFrame({ page, blocks = [] }) {
  const {
    title = 'Nama Halaman Bio',
    bio = 'Deskripsi profil bio Anda',
    avatar_url = '',
    is_verified = false,
    background_color = '#ffffff',
    button_color = '#0f172a',
    button_text_color = '#ffffff',
    font_family = 'sans',
    button_radius = 'rounded-xl',
    button_shadow = 'shadow-xs',
    block_spacing = 'normal',
    bg_image_url = '',
    custom_css = '',
    slug = 'kopiseduh',
    is_published = true,
    is_pro = false,
  } = page || {};

  // Font family helper
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

  // Spacing helper
  const getSpacingClass = () => {
    switch (block_spacing) {
      case 'compact':
        return 'space-y-2';
      case 'spacious':
        return 'space-y-4';
      default:
        return 'space-y-3';
    }
  };

  // Background luminance detector for crisp contrast
  const isDarkBg = () => {
    if (bg_image_url) return true;
    const color = (background_color || '#ffffff').toLowerCase();
    if (['#000', '#000000', '#090d16', '#0f172a', '#1e293b', '#18181b', '#0a1128', '#0d1f17', '#1c1512', '#1c0e12'].includes(color)) return true;
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return luma < 128;
    }
    if (color.includes('gradient') || color.includes('rgb(0') || color.includes('black')) return true;
    return false;
  };

  const isDark = isDarkBg();
  const activeBlocks = blocks.filter((b) => b.is_active);

  // Parse social links if present
  const parseSocials = (settingsStr) => {
    try {
      return JSON.parse(settingsStr || '[]');
    } catch {
      return [
        { platform: 'instagram', url: '#' },
        { platform: 'whatsapp', url: '#' },
      ];
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
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Scope Custom CSS safely for the preview frame */}
      {custom_css && (
        <style dangerouslySetInnerHTML={{ __html: custom_css }} />
      )}

      {/* Modern Desktop Browser Mockup Chassis (MacBook Pro / Safari Form Factor) */}
      <div className="w-full bg-[#1e222b] rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col select-none ring-1 ring-black/50">
        {/* Top Browser Chrome Bar */}
        <div className="h-10 bg-[#16181e] border-b border-slate-800 px-4 flex items-center justify-between">
          {/* macOS Window Controls */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-2xs" />
          </div>

          {/* Omnibar / Address Pill */}
          <div className="max-w-md w-full mx-4 px-3 py-1 bg-[#0f1117] rounded-lg border border-slate-800 flex items-center justify-center gap-2 text-xs font-mono text-slate-300">
            <LockIcon className="w-3 h-3 text-emerald-400" />
            <span className="truncate">https://klikin.id/p/{slug || 'kopiseduh'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ml-1 ${
                is_published ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              title={is_published ? 'Status: Terpublikasi' : 'Status: Draf'}
            />
          </div>

          {/* Device Dimension Badge */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
              Desktop 1200px
            </span>
          </div>
        </div>

        {/* Browser Content Viewport */}
        <div
          className={`h-[560px] overflow-y-auto ${getFontClass()} klikin-page transition-colors duration-200 relative`}
          style={{
            background: bg_image_url
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${bg_image_url}') center/cover no-repeat`
              : background_color || '#ffffff',
          }}
        >
          {/* Centered Responsive Bio Column */}
          <div className="max-w-md w-full mx-auto py-10 px-6 flex flex-col items-center justify-between min-h-full">
            <div className="w-full flex flex-col items-center">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-200 border-4 border-white/90 shadow-md mb-3 flex items-center justify-center">
                  {avatar_url ? (
                    <img
                      src={avatar_url}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-slate-500 font-mono">
                      {(title || 'K').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h1
                    className={`text-lg font-bold tracking-tight leading-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {title || 'Nama Tampilan'}
                  </h1>
                  {is_verified && (
                    <VerifiedBadgeIcon className="w-4 h-4 text-sky-500 shrink-0" title="Kreator Terverifikasi" />
                  )}
                </div>

                {bio && (
                  <p
                    className={`text-xs mt-1.5 leading-relaxed max-w-sm ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {bio}
                  </p>
                )}
              </div>

              {/* Blocks Container */}
              <div className={`w-full ${getSpacingClass()}`}>
                {activeBlocks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Belum ada blok yang aktif
                  </div>
                ) : (
                  activeBlocks.map((block) => {
                    // 1. LINK BLOCK
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
                          rel="noreferrer"
                          onClick={(e) => e.preventDefault()}
                          className={`w-full p-3.5 flex items-center justify-between transition-all hover:scale-[1.01] border border-black/5 ${button_radius} ${button_shadow} ${spotlightClass}`}
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
                                {block.title || 'Tautan Tanpa Judul'}
                              </span>
                              {block.subtitle && (
                                <span className="block text-[10px] opacity-75 truncate leading-tight mt-0.5">
                                  {block.subtitle}
                                </span>
                              )}
                            </div>
                          </div>
                          <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        </a>
                      );
                    }

                    // 2. HEADER BLOCK
                    if (block.type === 'header') {
                      const isLeft = block.content === 'left';
                      return (
                        <div
                          key={block.id}
                          className={`pt-3 pb-1 ${isLeft ? 'text-left pl-1' : 'text-center'}`}
                        >
                          <h2
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {block.title || 'Judul Kategori'}
                          </h2>
                        </div>
                      );
                    }

                    // 3. DIVIDER BLOCK
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

                    // 4. TEXT BLOCK
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

                    // 5. SOCIALS BLOCK (4-and-4 Grid Layout for > 4 items)
                    if (block.type === 'socials') {
                      const socials = parseSocials(block.settings);
                      const isMultiRow = socials.length > 4;
                      return (
                        <div key={block.id} className="w-full py-2">
                          <div
                            className={
                              isMultiRow
                                ? 'grid grid-cols-4 gap-3 max-w-[230px] mx-auto place-items-center'
                                : 'flex flex-wrap items-center justify-center gap-3'
                            }
                          >
                            {socials.map((s, idx) => (
                              <div
                                key={idx}
                                className="w-10 h-10 aspect-square shrink-0 rounded-full bg-white/95 shadow-2xs border border-slate-200/90 flex items-center justify-center text-slate-800 hover:scale-110 hover:shadow-md transition-all"
                              >
                                {renderSocialIcon(s.platform)}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // 6. EMBED BLOCK
                    if (block.type === 'embed') {
                      return (
                        <div
                          key={block.id}
                          className="rounded-xl overflow-hidden border border-black/10 bg-black/90 shadow-xs"
                        >
                          <div className="aspect-video w-full flex flex-col items-center justify-center text-white/90 p-4 text-center">
                            <PlayCircleIcon className="w-8 h-8 mb-2 text-white/80" />
                            <span className="text-xs font-bold line-clamp-1">{block.title}</span>
                            <span className="text-[10px] text-sky-400 font-mono mt-1">
                              {block.url || 'Media Tersemat'}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })
                )}
              </div>
            </div>

            {/* Footer Branding Watermark - Only displayed for Free tier */}
            {!is_pro && (
              <div className="w-full text-center pt-8 pb-2">
                <span
                  className={`text-[11px] font-mono tracking-wide ${
                    isDark ? 'text-white/40' : 'text-slate-400'
                  }`}
                >
                  Diberdayakan oleh Klikin
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
