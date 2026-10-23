import React, { useState } from 'react';
import BioPagePreview from './BioPagePreview';
import { CheckIcon, AlertCircleIcon } from './Icons';
import { navigateTo } from '../utils/navigation';

export default function Hero({ onNavigateToLogin, onNavigateToRegister: _onNavigateToRegister }) {
  const [username, setUsername] = useState('');
  const [claimStatus, setClaimStatus] = useState(null);

  const handleClaim = (e) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean) {
      try {
        localStorage.setItem('klikin_claimed_slug', clean);
      } catch  {
        // ignore storage error
      }
    }
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      navigateTo('/login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="claim" className="pt-12 sm:pt-20 pb-20 relative overflow-hidden">
      {/* Subtle atmospheric radial spotlight background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-white/[0.04] via-transparent to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-[510] text-[var(--color-paper)] tracking-[-0.022em] leading-[1.06] max-w-4xl mb-5">
          Satu link untuk semua channel jualan dan konten Anda.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[var(--color-mist)] leading-relaxed max-w-2xl mb-8">
          Arahkan audiens Instagram dan TikTok langsung ke toko online, WhatsApp kasir, dan katalog produk. Halaman web ringan, cepat, dan siap dalam 3 menit.
        </p>

        {/* Interactive Username Claimer Box */}
        <form
          onSubmit={handleClaim}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-xl mb-4"
        >
          <div className="flex-1 flex items-center bg-[var(--color-carbon)] border border-[var(--color-graphite)] focus-within:border-zinc-500 rounded-md px-3.5 py-1.5 transition-colors shadow-inner">
            <span className="text-[var(--color-fog)] font-mono text-sm select-none pr-1">
              klikin.id/
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                if (claimStatus) setClaimStatus(null);
              }}
              placeholder="namabrand"
              aria-label="Ketik username Anda"
              className="bg-transparent border-none text-white placeholder-[var(--color-ash)] text-sm py-1.5 w-full focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            className="btn-acid text-sm py-2.5 px-5 shrink-0"
          >
            Klaim Link Saya
          </button>
        </form>

        {/* Claim Status Feedback */}
        {claimStatus && (
          <div
            className={`text-xs font-mono flex items-center gap-2 mb-6 ${
              claimStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {claimStatus.type === 'success' ? (
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span>{claimStatus.message}</span>
          </div>
        )}

        {/* Guarantee Checklist */}
        <div className="flex items-center gap-6 text-xs text-[var(--color-fog)] mb-14 flex-wrap">
          <span className="flex items-center gap-1.5">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> Gratis selamanya untuk fitur dasar
          </span>
          <span className="flex items-center gap-1.5">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> Tanpa perlu kartu kredit
          </span>
          <span className="flex items-center gap-1.5">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> Loading di bawah 1 detik
          </span>
        </div>

        {/* Product Showcase Frame (Linear precision screenshot style) */}
        <div
          id="demo"
          className="pro-card p-4 sm:p-8 bg-gradient-to-b from-[var(--color-carbon)] to-[var(--color-obsidian)]"
        >
          <BioPagePreview />
        </div>
      </div>
    </section>
  );
}
