import React from 'react';
import { SparklesIcon } from '../Icons';

export default function UpgradeProCard({ onUpgrade }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#115e59] p-5 text-white flex flex-col justify-between shadow-sm min-h-[145px]">
      {/* Decorative Doodles in Background */}
      <div className="absolute top-2 right-2 opacity-15 pointer-events-none">
        <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8m-8 4h5" />
        </svg>
      </div>
      <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
        <SparklesIcon className="w-20 h-20" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1">
          <SparklesIcon className="w-3.5 h-3.5 text-[#ccff00]" />
          <h3 className="text-xs font-bold tracking-tight text-teal-50">Upgrade to Pro</h3>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold tracking-tight text-white">$4.20</span>
          <span className="text-xs text-teal-200 font-normal">/ Month</span>
        </div>
        <p className="text-[10px] text-teal-200/90 font-medium">$50 Billed Annually</p>
      </div>

      <div className="relative z-10 mt-3">
        <button
          type="button"
          onClick={onUpgrade || (() => alert('Fitur Upgrade Pro Klikin aktif!'))}
          className="bg-[#ccff00] hover:bg-[#b8e600] active:scale-[0.98] text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
