import React from 'react';
import { ChevronRightIcon, TrendingUpIcon, ShoppingBagIcon } from '../Icons';

export default function MoreAnalysisCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">More Analysis</h3>
        <p className="text-[11px] text-slate-400">There are more to view</p>
      </div>

      {/* Analysis Navigation Links */}
      <div className="space-y-2.5 my-3">
        <button
          type="button"
          onClick={() => alert('Membuka rincian Store Sell Ratio...')}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100/80 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUpIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold">Store Sell Ratio</span>
          </div>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => alert('Membuka analisis Top item sold...')}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100/80 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShoppingBagIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold">Top item sold</span>
          </div>
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Footer Branding */}
      <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
        <span>Analysis created by</span>
        <span className="w-4 h-4 rounded-full bg-[#bef264] text-slate-900 font-bold flex items-center justify-center text-[9px] shadow-2xs">
          K
        </span>
        <span className="font-semibold text-slate-700">Klikin AI</span>
      </div>
    </div>
  );
}
