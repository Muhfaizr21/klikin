import React from 'react';

const CHART_DATA = [
  { day: 'Sun', purple: 45, mint: 35 },
  { day: 'Mon', purple: 58, mint: 50 },
  { day: 'Tue', purple: 88, mint: 62 },
  { day: 'Wed', purple: 48, mint: 40 },
  { day: 'Thu', purple: 60, mint: 30 },
  { day: 'Fri', purple: 40, mint: 22 },
  { day: 'Sat', purple: 75, mint: 68 },
];

export default function RegularSellChart({ onExport }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      {/* Header with Title and Export Lime Badge */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Regular Sell</h3>
          <p className="text-[11px] text-slate-400">Tren penjualan dan konversi harian</p>
        </div>
        <button
          type="button"
          onClick={onExport || (() => alert('Mengekspor laporan penjualan ke CSV...'))}
          className="bg-[#d9f99d] hover:bg-[#bef264] text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs transition-all active:scale-[0.97]"
        >
          Export
        </button>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative pt-2">
        {/* Horizontal Dotted Gridlines & Y-Axis */}
        <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-6 text-right">50k</span>
            <div className="flex-1 border-b border-dashed border-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 text-right">40k</span>
            <div className="flex-1 border-b border-dashed border-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 text-right">30k</span>
            <div className="flex-1 border-b border-dashed border-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 text-right">20k</span>
            <div className="flex-1 border-b border-dashed border-slate-200" />
          </div>
        </div>

        {/* Bars Container */}
        <div className="pl-8 pr-2 h-44 flex items-end justify-between gap-2 relative z-10">
          {CHART_DATA.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Bars side by side */}
              <div className="w-full flex items-end justify-center gap-1.5 h-36">
                {/* Purple Bar */}
                <div
                  style={{ height: `${item.purple}%` }}
                  className="w-2.5 sm:w-3 bg-[#c4b5fd] group-hover:bg-[#a78bfa] rounded-t-full transition-all duration-300"
                  title={`${item.day} - Penjualan: ${item.purple}k`}
                />
                {/* Mint Bar */}
                <div
                  style={{ height: `${item.mint}%` }}
                  className="w-2.5 sm:w-3 bg-[#86efac] group-hover:bg-[#4ade80] rounded-t-full transition-all duration-300"
                  title={`${item.day} - Kunjungan: ${item.mint}k`}
                />
              </div>

              {/* Day Label */}
              <span className="text-[11px] font-medium text-slate-400 mt-2">
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
