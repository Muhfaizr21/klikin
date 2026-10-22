import React from 'react';
import { SPACING_OPTIONS } from './themes';
import { CodeIcon, ImageIcon, GlobeIcon, SparklesIcon, CheckIcon, TrashIcon, UploadIcon } from '../../Icons';
import { fileToWebP } from '../../../utils/imageUtils';

const BG_PRESETS = [
  {
    id: 'studio-dark',
    name: 'Studio Dark',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=60',
  },
  {
    id: 'coffee-aesthetic',
    name: 'Kopi Estetik',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=120&q=60',
  },
  {
    id: 'minimal-slate',
    name: 'Minimal Slate',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=120&q=60',
  },
  {
    id: 'warm-gradient',
    name: 'Warm Sunset',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=120&q=60',
  },
];

const CSS_PRESETS = [
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    desc: 'Efek kartu kaca transparan blur',
    code: `.klikin-page a {\n  backdrop-filter: blur(12px) !important;\n  background-color: rgba(255, 255, 255, 0.15) !important;\n  border: 1px solid rgba(255, 255, 255, 0.3) !important;\n  color: #ffffff !important;\n}`,
  },
  {
    id: 'soft-glow',
    name: 'Soft Glow',
    desc: 'Pendar cahaya saat hover tombol',
    code: `.klikin-page a:hover {\n  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5) !important;\n  transform: translateY(-2px);\n}`,
  },
  {
    id: 'pill-minimal',
    name: 'Pill Outline',
    desc: 'Tombol pill outline elegan',
    code: `.klikin-page a {\n  border-radius: 9999px !important;\n  border: 1.5px solid currentColor !important;\n  font-weight: 600 !important;\n}`,
  },
  {
    id: 'smooth-lift',
    name: 'Smooth Lift',
    desc: 'Animasi naik lembut saat disentuh',
    code: `.klikin-page a {\n  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;\n}\n.klikin-page a:hover {\n  transform: translateY(-3px) scale(1.01);\n}`,
  },
];

export default function ProCustomizer({
  customCss,
  blockSpacing,
  pageShadow,
  bgImageUrl,
  faviconUrl,
  isUserPro = false,
  onChangeField,
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-6">
      {/* Header with Pro Badge */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Kustomisasi Pro</h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
              PRO MODULE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kontrol tingkat lanjut untuk branding eksklusif, CSS styling, dan aset kustom.
          </p>
        </div>
      </div>

      {!isUserPro && (
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold flex items-center gap-1.5 text-white">
              <SparklesIcon className="w-4 h-4 text-amber-400" />
              Tingkatkan ke Klikin Pro
            </h4>
            <p className="text-[11px] text-slate-300">
              Buka akses injeksi CSS kustom, gambar latar belakang resolusi tinggi, dan favicon branding.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#billing';
            }}
            className="px-3.5 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-lg hover:bg-slate-100 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            Upgrade Pro
          </button>
        </div>
      )}

      {/* Spacing Antar Blok */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-900 block">
          Jarak Antar Blok (Block Spacing)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SPACING_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChangeField('block_spacing', s.id)}
              className={`py-2.5 px-3 text-xs border rounded-xl text-left transition-all ${
                blockSpacing === s.id
                  ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-xs'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              <span className="block">{s.name.split('(')[0]}</span>
              <span className="text-[10px] opacity-70 block">({s.name.split('(')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shadow Kontainer Halaman */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-900 block">
          Efek Bayangan Kartu Kontainer (Page Shadow)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'none', label: 'Tanpa Shadow' },
            { id: 'subtle', label: 'Subtil' },
            { id: 'floating', label: 'Melayang (Floating)' },
            { id: 'glow', label: 'Soft Glow' },
          ].map((sh) => (
            <button
              key={sh.id}
              type="button"
              onClick={() => onChangeField('page_shadow', sh.id)}
              className={`py-2 px-3 text-xs border rounded-xl transition-all ${
                pageShadow === sh.id
                  ? 'border-slate-900 bg-slate-900 text-white font-bold'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              {sh.label}
            </button>
          ))}
        </div>
      </div>

      {/* Background Image with 1-Click Presets */}
      <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-700" />
            <label className="text-xs font-bold text-slate-900">
              Gambar Latar Belakang Kustom
            </label>
          </div>
          {bgImageUrl && (
            <button
              type="button"
              onClick={() => onChangeField('bg_image_url', '')}
              className="text-[11px] text-rose-600 font-semibold hover:underline flex items-center gap-1"
            >
              <TrashIcon className="w-3 h-3" /> Hapus Latar
            </button>
          )}
        </div>

        {/* 1-Click Curated Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Pilihan Gambar Cepat (1-Klik)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BG_PRESETS.map((p) => {
              const isSelected = bgImageUrl === p.url;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChangeField('bg_image_url', p.url)}
                  className={`group relative h-16 rounded-xl overflow-hidden border text-left transition-all ${
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={p.thumb}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-white truncate block">
                      {p.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-slate-900 flex items-center justify-center">
                      <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom URL & Upload Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-600 block">
              Atau Gunakan Tautan URL / Upload Gambar Sendiri:
            </label>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              Otomatis WebP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={bgImageUrl || ''}
              onChange={(e) => onChangeField('bg_image_url', e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-2xs">
              <UploadIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Upload WebP</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const res = await fileToWebP(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.88 });
                      onChangeField('bg_image_url', res.dataUrl);
                    } catch (err) {
                      alert('Gagal memproses gambar: ' + err.message);
                    }
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Custom Favicon URL & Upload */}
      <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlobeIcon className="w-4 h-4 text-slate-700" />
            <label className="text-xs font-bold text-slate-900">
              Favicon Tab Browser Kustom (Favicon URL / File)
            </label>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
            Otomatis WebP
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Ikon 32x32 atau 64x64 piksel yang muncul pada tab browser pengunjung halaman bio Anda.
        </p>
        <div className="flex items-center gap-2">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt="Favicon"
              className="w-8 h-8 rounded p-1 border border-slate-300 bg-white object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
              ICO
            </div>
          )}
          <input
            type="url"
            value={faviconUrl || ''}
            onChange={(e) => onChangeField('favicon_url', e.target.value)}
            placeholder="https://domain-anda.com/favicon.ico"
            className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-2xs">
            <UploadIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const res = await fileToWebP(file, { maxWidth: 128, maxHeight: 128, quality: 0.90 });
                    onChangeField('favicon_url', res.dataUrl);
                  } catch (err) {
                    alert('Gagal memproses favicon: ' + err.message);
                  }
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Custom CSS Code Editor with 1-Click Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CodeIcon className="w-4 h-4 text-slate-700" />
            <label className="text-xs font-bold text-slate-900">
              Injeksi CSS Kustom (Custom CSS)
            </label>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Scoped .klikin-page</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Gunakan preset siap pakai di bawah untuk menerapkan efek visual modern, atau tulis aturan CSS Anda sendiri.
        </p>

        {/* 1-Click CSS Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Preset Efek CSS 1-Klik:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CSS_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (customCss && customCss.trim()) {
                    onChangeField('custom_css', `${customCss.trim()}\n\n/* ${preset.name} */\n${preset.code}`);
                  } else {
                    onChangeField('custom_css', `/* ${preset.name} */\n${preset.code}`);
                  }
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all group"
              >
                <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-600">
                  + {preset.name}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 block mt-0.5">
                  {preset.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Container */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0f172a]">
          <div className="bg-[#1e293b] px-3.5 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800">
            <span>custom-style.css</span>
            <div className="flex items-center gap-2">
              {customCss && (
                <button
                  type="button"
                  onClick={() => onChangeField('custom_css', '')}
                  className="text-rose-400 hover:text-rose-300 text-[10px]"
                >
                  Bersihkan CSS
                </button>
              )}
              <span className="text-emerald-400 font-semibold">Live Scoped</span>
            </div>
          </div>
          <textarea
            rows={5}
            value={customCss || ''}
            onChange={(e) => onChangeField('custom_css', e.target.value)}
            placeholder={`/* Contoh Kustomisasi CSS */\n.klikin-button {\n  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n}\n.klikin-button:hover {\n  transform: translateY(-2px);\n}`}
            className="w-full p-3.5 bg-transparent text-slate-200 text-xs font-mono focus:outline-none resize-none leading-relaxed selection:bg-slate-700"
          />
        </div>
      </div>
    </div>
  );
}
