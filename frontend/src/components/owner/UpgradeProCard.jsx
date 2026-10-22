import React from 'react';
import { SparklesIcon, CheckIcon } from '../Icons';

export default function UpgradeProCard({ onUpgrade, isPro = false }) {
  if (isPro) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 text-white flex flex-col justify-between shadow-xs min-h-[145px]">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-semibold tracking-tight text-emerald-400 uppercase tracking-wider">
              Paket Pro Aktif
            </h3>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">Klikin Pro</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            Domain kustom aktif, formulir leads aktif, tanpa watermark.
          </p>
        </div>

        <div className="relative z-10 mt-3 pt-1">
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white border border-white/20 text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors text-center"
          >
            Kelola Langganan & Billing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 text-white flex flex-col justify-between shadow-xs min-h-[145px]">
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <SparklesIcon className="w-3.5 h-3.5 text-slate-300" />
          <h3 className="text-xs font-semibold tracking-tight text-slate-200 uppercase tracking-wider">
            Klikin Pro
          </h3>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">Rp29.000</span>
          <span className="text-xs text-slate-400 font-normal">/ bln</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Domain kustom pribadi, tangkap leads, tanpa watermark.
        </p>
      </div>

      <div className="relative z-10 mt-3 pt-1">
        <button
          type="button"
          onClick={onUpgrade}
          className="w-full sm:w-auto bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors text-center"
        >
          Aktifkan Paket Pro
        </button>
      </div>
    </div>
  );
}
