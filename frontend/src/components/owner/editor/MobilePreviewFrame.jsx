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
  VerifiedBadgeIcon,
} from '../../Icons';

export default function MobilePreviewFrame({ page, blocks = [], onEditProfile }) {
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
    page_shadow = 'none',
    bg_image_url = '',
    custom_css = '',
    slug = 'kopiseduh',
    is_pro = false,
  } = page || {};

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

  // Spacing class
  const getSpacingClass = () => {
    switch (block_spacing) {
      case 'compact':
        return 'space-y-2';
      case 'relaxed':
        return 'space-y-5';
      case 'normal':
      default:
        return 'space-y-3.5';
    }
  };

  // Font class
  const getFontClass = () => {
    switch (font_family) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  // Page shadow container class
  const getPageShadowClass = () => {
    switch (page_shadow) {
      case 'subtle':
        return 'shadow-md';
      case 'floating':
        return 'shadow-2xl';
      case 'glow':
        return 'shadow-[0_0_25px_rgba(255,255,255,0.15)]';
      default:
        return '';
    }
  };

  // Active blocks filtered and ordered
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
    <div className="flex flex-col items-center">
      {/* Scope Custom CSS safely for the preview frame */}
      {custom_css && (
        <style dangerouslySetInnerHTML={{ __html: custom_css }} />
      )}

      {/* Realistic Smartphone Hardware Chassis (iPhone 16 Pro Form Factor) */}
      <div className="relative w-[340px] h-[680px] bg-[#111317] rounded-[52px] p-3 shadow-2xl border-4 border-[#2d3139] ring-1 ring-black/40 flex flex-col select-none">
        {/* Exterior Hardware Accents (Volume & Power Bar buttons) */}
        <div className="absolute -left-[7px] top-[115px] w-[3px] h-[28px] bg-[#3a3f4a] rounded-l-sm" />
        <div className="absolute -left-[7px] top-[155px] w-[3px] h-[50px] bg-[#3a3f4a] rounded-l-sm" />
        <div className="absolute -left-[7px] top-[215px] w-[3px] h-[50px] bg-[#3a3f4a] rounded-l-sm" />
        <div className="absolute -right-[7px] top-[165px] w-[3px] h-[75px] bg-[#3a3f4a] rounded-r-sm" />

        {/* Screen Bezel Area */}
        <div
          className={`relative w-full h-full rounded-[42px] overflow-hidden flex flex-col justify-between ${getFontClass()} klikin-page`}
          style={{
            background: bg_image_url
              ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('${bg_image_url}') center/cover no-repeat`
              : background_color || '#ffffff',
          }}
        >
          {/* iOS Top Status Bar & Dynamic Island */}
          <div className="relative z-20 pt-2.5 px-6 flex items-center justify-between text-slate-800 text-[11px] font-semibold mix-blend-difference filter invert">
            <span>09:41</span>
            {/* Dynamic Island Pill */}
            <div className="w-24 h-5 bg-black rounded-full mx-auto shadow-xs flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] mr-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#104e38]" />
            </div>
            <div className="flex items-center gap-1.5">
              {/* Battery & Signal icons */}
              <div className="w-3 h-2 border border-current rounded-xs relative">
                <div className="w-1.5 h-full bg-current" />
              </div>
            </div>
          </div>

          {/* Scrollable Screen Inner Content */}
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-12 scrollbar-none space-y-6">
            {/* Bio Header Profile Section (Clickable to Edit) */}
            <div
              onClick={onEditProfile}
              className={`text-center space-y-3 pt-2 cursor-pointer group transition-transform ${getPageShadowClass()}`}
              title="Klik untuk mengedit profil & nama tampilan"
            >
              {/* Avatar Photo */}
              <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-slate-200 border-2 border-white/80 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
                {avatar_url ? (
                  <img
                    src={avatar_url}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-slate-600 font-mono">
                    {(title || 'K').slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold">
                  Edit
                </div>
              </div>

              {/* Title & Bio text */}
              <div className="space-y-1 px-2">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h1
                    className={`text-base font-bold tracking-tight transition-colors ${
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
                    className={`text-xs leading-relaxed transition-colors ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {bio}
                  </p>
                )}
              </div>
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
                        className={`w-full p-3 flex items-center justify-between transition-transform active:scale-[0.98] border border-black/5 ${button_radius} ${button_shadow} hover:opacity-95 ${spotlightClass}`}
                        style={{
                          backgroundColor: button_color || '#0f172a',
                          color: button_text_color || '#ffffff',
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {block.image_url ? (
                            <img
                              src={block.image_url}
                              alt=""
                              className="w-7 h-7 rounded-md object-cover shrink-0"
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
                        <ExternalLinkIcon className="w-3 h-3 shrink-0 opacity-70" />
                      </a>
                    );
                  }

                  // 2. HEADER BLOCK
                  if (block.type === 'header') {
                    const isLeft = block.content === 'left';
                    return (
                      <div key={block.id} className={`pt-2 pb-1 ${isLeft ? 'text-left pl-1' : 'text-center'}`}>
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
                      <div key={block.id} className="py-1">
                        {style === 'dots' ? (
                          <div className="flex justify-center gap-1.5 py-1">
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
                        className="p-3 rounded-xl bg-white/70 backdrop-blur-xs border border-black/5 text-slate-800 text-left space-y-1 shadow-2xs"
                      >
                        {block.title && (
                          <h4 className="text-xs font-bold text-slate-900">{block.title}</h4>
                        )}
                        <p className="text-[11px] text-slate-600 leading-relaxed">
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
                      <div key={block.id} className="w-full py-1.5">
                        <div
                          className={
                            isMultiRow
                              ? "grid grid-cols-4 gap-2.5 max-w-[210px] mx-auto place-items-center"
                              : "flex flex-wrap items-center justify-center gap-2.5"
                          }
                        >
                          {socials.map((s, idx) => (
                            <div
                              key={idx}
                              className="w-9 h-9 aspect-square shrink-0 rounded-full bg-white/95 shadow-2xs border border-slate-200/90 flex items-center justify-center text-slate-800 hover:scale-110 transition-transform"
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
                          <PlayCircleIcon className="w-8 h-8 mb-1.5 text-white/80" />
                          <span className="text-[11px] font-bold line-clamp-1">
                            {block.title || 'Video Embed'}
                          </span>
                          <span className="text-[9px] text-white/60 font-mono mt-0.5 truncate max-w-full">
                            {block.url}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })
              )}
            </div>

            {/* Klikin Branding Watermark - Only displayed for Free tier */}
            {!is_pro && (
              <div className="pt-6 pb-2 text-center">
                <span
                  className={`text-[10px] font-semibold tracking-wider uppercase font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Klikin
                </span>
              </div>
            )}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center pointer-events-none z-20">
            <div className="w-32 h-1 bg-black/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
