import React, { useState } from 'react';
import { THEMES, FONT_OPTIONS, RADIUS_OPTIONS, SHADOW_OPTIONS } from './themes';
import { CheckIcon } from '../../Icons';
import { navigateTo } from '../../../utils/navigation';

const COLOR_PRESETS = [
  '#ffffff',
  '#090d16',
  '#0f172a',
  '#1e293b',
  '#f8fafc',
  '#fbf9f5',
  '#18181b',
  '#0a1128',
  '#0d1f17',
  '#1c1512',
  '#e2e8f0',
  '#1c0e12',
];

export default function ThemeSelector({
  currentThemeId,
  backgroundColor,
  buttonColor,
  buttonTextColor,
  fontFamily,
  buttonRadius,
  buttonShadow,
  isUserPro = false,
  onApplyThemePreset,
  onChangeField,
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'free' | 'pro'

  const filteredThemes = THEMES.filter((t) => {
    if (filterMode === 'free') return !t.isPro;
    if (filterMode === 'pro') return t.isPro;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Katalog Tema & Palet Visual</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Pilih tema siap pakai atau sesuaikan warna, tipografi, dan bentuk tombol secara mandiri.
        </p>
      </div>

      {/* Preset Themes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900">
            Pilihan Tema ({THEMES.length} Desain Eksklusif)
          </label>
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({THEMES.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('free')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterMode === 'free' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Free (12)
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pro')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterMode === 'pro' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pro (5)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredThemes.map((theme) => {
            const isSelected = currentThemeId === theme.id;
            const isLocked = theme.isPro && !isUserPro;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  if (isLocked) {
                    navigateTo('/owner/billing');
                  } else {
                    onApplyThemePreset(theme);
                  }
                }}
                title={isLocked ? 'Klik untuk upgrade ke Klikin Pro dan membuka tema eksklusif ini' : theme.name}
                className={`relative rounded-xl p-3 border-2 text-left transition-all group flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900/15 shadow-sm'
                    : isLocked
                    ? 'border-slate-200/60 opacity-75 hover:opacity-100 bg-slate-50/50 hover:border-amber-400'
                    : 'border-slate-200/90 hover:border-slate-400 bg-white hover:shadow-xs'
                }`}
              >
                {/* Visual Preview Card Simulation */}
                <div
                  className="w-full h-24 rounded-lg p-2.5 mb-2.5 flex flex-col justify-between shadow-inner border border-black/5 overflow-hidden"
                  style={{ background: theme.backgroundColor }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ background: theme.buttonColor }}
                    />
                    <div
                      className="h-2 w-12 rounded-full opacity-60"
                      style={{ background: theme.textColor }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`w-full py-1 text-[9px] font-bold text-center ${theme.buttonRadius} ${theme.buttonShadow}`}
                      style={{
                        backgroundColor: theme.buttonColor,
                        color: theme.buttonTextColor,
                      }}
                    >
                      Tombol Demo
                    </div>
                  </div>
                </div>

                {/* Theme Title & Badges */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {theme.name}
                    </span>
                    {theme.isPro && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                    {theme.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <CheckIcon className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Base Customization Section */}
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Kustomisasi Dasar (Warna & Bentuk)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Ubah variabel warna tema sesuai identitas brand atau selera spesifik Anda.
          </p>
        </div>

        {/* Color Palette Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Background Color */}
          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Warna Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor?.startsWith('#') ? backgroundColor : '#0f172a'}
                onChange={(e) => onChangeField('background_color', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={backgroundColor || ''}
                onChange={(e) => onChangeField('background_color', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Button Background Color */}
          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Warna Tombol
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={buttonColor?.startsWith('#') ? buttonColor : '#ffffff'}
                onChange={(e) => onChangeField('button_color', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={buttonColor || ''}
                onChange={(e) => onChangeField('button_color', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Button Text Color */}
          <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Warna Teks Tombol
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={buttonTextColor?.startsWith('#') ? buttonTextColor : '#090d16'}
                onChange={(e) => onChangeField('button_text_color', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={buttonTextColor || ''}
                onChange={(e) => onChangeField('button_text_color', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Quick Swatch Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500">Palet Cepat:</span>
          {COLOR_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onChangeField('background_color', hex)}
              className="w-6 h-6 rounded-md border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
              style={{ backgroundColor: hex }}
              title={`Pilih ${hex}`}
            />
          ))}
        </div>

        {/* Font Family Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 block">
            Pilihan Tipografi (Font Family)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onChangeField('font_family', f.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  fontFamily === f.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className={`text-sm font-bold block ${f.className}`}>
                  {f.name.split(' ')[0]}
                </span>
                <span className="text-[11px] opacity-70 block mt-0.5">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Button Radius Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 block">
            Kelengkungan Sudut Tombol (Radius)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onChangeField('button_radius', r.id)}
                className={`p-2.5 border text-center transition-all ${
                  buttonRadius === r.id
                    ? 'border-slate-900 bg-slate-100 font-bold text-slate-900 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                } rounded-xl`}
              >
                <div
                  className={`w-full h-7 bg-slate-900 text-white text-[10px] flex items-center justify-center mx-auto mb-1.5 ${r.previewClass}`}
                >
                  Aa
                </div>
                <span className="text-xs">{r.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Button Shadow Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 block">
            Efek Bayangan Tombol (Shadow)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SHADOW_OPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeField('button_shadow', s.id)}
                className={`py-2 px-3 text-xs border rounded-xl transition-all ${
                  buttonShadow === s.id
                    ? 'border-slate-900 bg-slate-900 text-white font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
