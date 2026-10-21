import React, { useState } from 'react';
import {
  ShoppingBagIcon,
  MessageCircleIcon,
  PlayCircleIcon,
  FileTextIcon,
  CheckIcon,
  InfoIcon,
} from './Icons';

const INITIAL_LINKS = [
  {
    id: '1',
    title: 'Toko Online Official',
    subtitle: 'Katalog produk dan promo minggu ini',
    clicks: 1240,
    icon: ShoppingBagIcon,
    iconColor: 'text-emerald-400',
  },
  {
    id: '2',
    title: 'Konsultasi WhatsApp Cepat',
    subtitle: 'Admin siap melayani 08.00 - 21.00 WIB',
    clicks: 890,
    icon: MessageCircleIcon,
    iconColor: 'text-[var(--color-acid-lime)]',
  },
  {
    id: '3',
    title: 'Video Tutorial & Review Produk',
    subtitle: 'Tips dan unboxing produk di YouTube',
    clicks: 540,
    icon: PlayCircleIcon,
    iconColor: 'text-sky-400',
  },
  {
    id: '4',
    title: 'Unduh Pricelist Grosir PDF',
    subtitle: 'Daftar harga reseller edisi 2026',
    clicks: 310,
    icon: FileTextIcon,
    iconColor: 'text-indigo-400',
  },
];

export default function BioPagePreview() {
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [activeTheme, setActiveTheme] = useState('midnight');
  const [totalClicks, setTotalClicks] = useState(2980);
  const [lastClickedId, setLastClickedId] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'analytics'

  const handleLinkClick = (id) => {
    setLinks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, clicks: item.clicks + 1 } : item
      )
    );
    setTotalClicks((prev) => prev + 1);
    setLastClickedId(id);
    setTimeout(() => setLastClickedId(null), 1800);
  };

  const getThemeConfig = () => {
    switch (activeTheme) {
      case 'emerald':
        return {
          bg: 'bg-[#08130b]',
          border: 'border-emerald-900/50',
          itemBg: 'bg-emerald-950/20 hover:bg-emerald-900/30',
          itemBorder: 'border-emerald-800/40 hover:border-emerald-500/60',
          text: 'text-emerald-100',
        };
      case 'obsidian':
        return {
          bg: 'bg-[#121316]',
          border: 'border-white/10',
          itemBg: 'bg-white/[0.03] hover:bg-white/[0.06]',
          itemBorder: 'border-white/10 hover:border-white/20',
          text: 'text-zinc-100',
        };
      case 'midnight':
      default:
        return {
          bg: 'bg-[#0a0b0d]',
          border: 'border-[var(--color-graphite)]',
          itemBg: 'bg-[var(--color-carbon)] hover:bg-[#141518]',
          itemBorder: 'border-[var(--color-graphite)] hover:border-zinc-700',
          text: 'text-[var(--color-mist)]',
        };
    }
  };

  const currentTheme = getThemeConfig();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-2 sm:p-4">
      {/* Left Column: Interactive Simulation Control Center */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div>
          <h3 className="text-2xl sm:text-3xl font-[510] text-[var(--color-paper)] tracking-tight mb-2.5">
            Cepat, interaktif, dan langsung menghasilkan closing.
          </h3>
          <p className="text-[var(--color-mist)] text-sm sm:text-base leading-relaxed">
            Pengunjung bio profil Anda dapat langsung memilih produk, membuka WhatsApp dengan format pesan otomatis, atau mengakses promosi tanpa hambatan.
          </p>
        </div>

        {/* Tab Switcher: Preview vs Analytics Mode */}
        <div className="flex items-center gap-2 p-1 bg-[var(--color-carbon)] border border-[var(--color-graphite)] rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-[var(--color-obsidian)] text-white shadow-sm border border-[var(--color-smoke)]'
                : 'text-[var(--color-fog)] hover:text-white'
            }`}
          >
            Pratinjau Ponsel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-[var(--color-obsidian)] text-white shadow-sm border border-[var(--color-smoke)]'
                : 'text-[var(--color-fog)] hover:text-white'
            }`}
          >
            Insight Analitik
          </button>
        </div>

        {/* Theme Pill Buttons */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[var(--color-fog)] font-mono">
            Ganti Preset Tema Tampilan:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTheme('midnight')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all border ${
                activeTheme === 'midnight'
                  ? 'bg-[var(--color-acid-lime)] text-[var(--color-void)] border-[var(--color-acid-lime)] font-[510]'
                  : 'bg-[var(--color-carbon)] border-[var(--color-graphite)] text-[var(--color-mist)] hover:border-zinc-700'
              }`}
            >
              Midnight Void
            </button>
            <button
              type="button"
              onClick={() => setActiveTheme('emerald')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all border ${
                activeTheme === 'emerald'
                  ? 'bg-emerald-400 text-black border-emerald-400 font-[510]'
                  : 'bg-[var(--color-carbon)] border-[var(--color-graphite)] text-[var(--color-mist)] hover:border-zinc-700'
              }`}
            >
              Emerald Glass
            </button>
            <button
              type="button"
              onClick={() => setActiveTheme('obsidian')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all border ${
                activeTheme === 'obsidian'
                  ? 'bg-zinc-100 text-black border-zinc-100 font-[510]'
                  : 'bg-[var(--color-carbon)] border-[var(--color-graphite)] text-[var(--color-mist)] hover:border-zinc-700'
              }`}
            >
              Obsidian Dark
            </button>
          </div>
        </div>

        {/* Dynamic Metric Box */}
        <div className="pro-card p-4 flex items-center justify-between bg-gradient-to-r from-[var(--color-carbon)] to-[var(--color-obsidian)]">
          <div>
            <div className="text-xs font-mono text-[var(--color-fog)]">
              Total Klik Terakumulasi
            </div>
            <div className="text-2xl font-[510] text-[var(--color-paper)] font-mono mt-0.5">
              {totalClicks.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-emerald-400 flex items-center justify-end">
              <span>CTR 24.8%</span>
            </div>
            <div className="text-[11px] text-[var(--color-fog)] mt-1">
              Rata-rata load 0.48 detik
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Sleek Phone Mockup */}
      <div className="lg:col-span-5 flex justify-center">
        <div className="w-full max-w-[340px] rounded-[32px] p-3 bg-gradient-to-b from-[#1c1d22] via-[#0c0d0e] to-[#050506] border border-white/10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85)] relative">
          {/* Subtle Phone Speaker & Camera Notch */}
          <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1b1c20]" />
            <div className="w-6 h-1 rounded-full bg-[#131417]" />
          </div>

          {/* Screen Content */}
          <div
            className={`rounded-[22px] p-5 flex flex-col items-center min-h-[460px] border transition-colors duration-200 ${currentTheme.bg} ${currentTheme.border}`}
          >
            {activeTab === 'preview' ? (
              <>
                {/* Creator Avatar with monogram instead of emoji */}
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-[var(--color-smoke)] flex items-center justify-center text-sm font-mono font-medium text-white shadow-md tracking-wider">
                    KN
                  </div>
                </div>

                <h4 className="text-[15px] font-[510] text-[var(--color-paper)] tracking-tight">
                  Kopi Seduh Nusantara
                </h4>
                <div className="text-xs font-mono text-[var(--color-fog)] mb-2 flex items-center gap-1">
                  <span>kopiseduh.klikin.id</span>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-xs text-[var(--color-mist)] text-center max-w-[220px] leading-relaxed mb-5">
                  Roastery biji kopi lokal single origin dan alat seduh manual. Pengiriman seluruh Indonesia.
                </p>

                {/* Link Buttons with clean Vector SVG Icons */}
                <div className="w-full flex flex-col gap-2.5">
                  {links.map((item) => {
                    const isClicked = lastClickedId === item.id;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleLinkClick(item.id)}
                        className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all duration-150 ${currentTheme.itemBg} ${currentTheme.itemBorder} ${
                          isClicked ? 'scale-[0.98] border-[var(--color-acid-lime)]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden pr-2">
                          <span className={`shrink-0 ${item.iconColor}`}>
                            <IconComponent className="w-4 h-4" />
                          </span>
                          <div className="overflow-hidden">
                            <div className={`text-xs font-medium ${currentTheme.text}`}>
                              {item.title}
                            </div>
                            <div className="text-[10px] text-[var(--color-fog)] truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--color-fog)] shrink-0 bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                          {item.clicks}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Micro branding footer */}
                <div className="mt-auto pt-6 text-[10px] text-[var(--color-fog)] font-mono flex items-center gap-1">
                  <span>Powered by</span>
                  <span className="text-white font-[510]">klikin</span>
                </div>
              </>
            ) : (
              /* Simulated Analytics Breakdown Tab */
              <div className="w-full flex flex-col gap-4 text-left py-2 animate-in fade-in duration-150">
                <div className="text-xs font-mono text-[var(--color-fog)] border-b border-white/5 pb-2">
                  Laporan Performa 7 Hari
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">Instagram Bio</span>
                      <span className="text-mono text-emerald-400">58% (1.728)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[58%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">WhatsApp Direct</span>
                      <span className="text-mono text-[var(--color-acid-lime)]">28% (834)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-acid-lime)] rounded-full w-[28%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">TikTok Profile</span>
                      <span className="text-mono text-sky-400">14% (417)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full w-[14%]" />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 mt-4 text-[11px] text-[var(--color-fog)] flex items-start gap-2">
                  <InfoIcon className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Insight:</strong> Jam sibuk trafik Anda pukul 19.00 - 21.00 WIB. Disarankan pasang penawaran flash sale pada jam tersebut.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
