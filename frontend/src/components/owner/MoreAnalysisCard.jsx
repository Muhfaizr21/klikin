import React from 'react';
import { ChevronRightIcon, TrendingUpIcon, ShoppingBagIcon, SparklesIcon } from '../Icons';

export default function MoreAnalysisCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Sumber Trafik & Prioritas Tautan</h3>
        <p className="text-[11px] text-slate-400">Rekomendasi tindakan berbasis alur pengunjung bio</p>
      </div>

      {/* Analysis Navigation Links */}
      <div className="space-y-2.5 my-3">
        {/* Recommendation 1: Traffic Origin */}
        <button
          type="button"
          onClick={() => alert('Sumber trafik: Instagram 56%, TikTok 32%, WhatsApp 8%, Langsung 4%.')}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100/80 group text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUpIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Instagram & TikTok (88%)</span>
              <span className="text-[10px] text-slate-400">Kanal utama, optimalkan link di IG Story & VT</span>
            </div>
          </div>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* Recommendation 2: Top Performer Link */}
        <button
          type="button"
          onClick={() => alert('Tautan terpopuler: Order WhatsApp. Pertahankan di posisi #1 teratas agar pengunjung langsung chat!')}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100/80 group text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShoppingBagIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Order WhatsApp (+42% Klik)</span>
              <span className="text-[10px] text-emerald-600 font-medium">Paling diminati, pertahankan di posisi 1</span>
            </div>
          </div>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* Recommendation 3: Low Performer / Hidden Link */}
        <button
          type="button"
          onClick={() => alert('Tautan Voucher Diskon berada di urutan #4 (di bawah layar). Geser naik ke posisi #2 untuk melipatgandakan klaim voucher!')}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 text-slate-700 transition-colors border border-amber-200/50 group text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Voucher Diskon (Hanya 4.6% Klik)</span>
              <span className="text-[10px] text-amber-700 font-medium">Butuh scroll HP, seret ke atas untuk naikkan klaim</span>
            </div>
          </div>
          <ChevronRightIcon className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>

      {/* Footer Branding */}
      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
        <span>Rekomendasi otomatis oleh</span>
        <span className="w-4 h-4 rounded-full bg-[#bef264] text-slate-900 font-bold flex items-center justify-center text-[9px] shadow-2xs">
          K
        </span>
        <span className="font-semibold text-slate-700">Klikin AI</span>
      </div>
    </div>
  );
}
