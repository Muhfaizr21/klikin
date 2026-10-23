import React, { useState } from 'react';
import { PieChartIcon } from '../Icons';

const COLOR_PALETTE = ['#0f172a', '#334155', '#4f46e5', '#059669', '#d97706', '#94a3b8'];
const BG_PALETTE = ['bg-slate-900', 'bg-slate-700', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-slate-400'];

const DEFAULT_SOURCES = [
  { id: 'ig', name: 'Instagram Bio & Story', percentage: 54, count: '1.392', color: '#0f172a', bg: 'bg-slate-900' },
  { id: 'tt', name: 'TikTok Profil & VT', percentage: 32, count: '796', color: '#334155', bg: 'bg-slate-700' },
  { id: 'wa', name: 'WhatsApp Direct Share', percentage: 10, count: '248', color: '#4f46e5', bg: 'bg-indigo-600' },
  { id: 'dr', name: 'Langsung & Referensi', percentage: 4, count: '92', color: '#94a3b8', bg: 'bg-slate-400' },
];

export default function TrafficSourceDonutChart({ sources }) {
  const displaySources = React.useMemo(() => {
    if (!sources || sources.length === 0) return DEFAULT_SOURCES;
    return sources.map((src, idx) => ({
      id: `src-${idx}`,
      name: src.name || 'Langsung / Direct',
      percentage: Math.round(src.percentage || 0),
      count: (src.count || 0).toLocaleString('id-ID'),
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      bg: BG_PALETTE[idx % BG_PALETTE.length],
    }));
  }, [sources]);

  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const activeSource =
    displaySources.find((src) => src.id === selectedSourceId) ||
    displaySources[0] ||
    DEFAULT_SOURCES[0];
  const setActiveSource = (src) => setSelectedSourceId(src?.id || null);

  // SVG Donut calculation: circumference = 2 * PI * r = 2 * 3.14159 * 38 ≈ 238.76
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash offsets without mutating outer variables
  const segments = displaySources.reduce(
    (acc, src) => {
      const arcLength = (src.percentage / 100) * circumference;
      const strokeDasharray = `${arcLength} ${circumference}`;
      const strokeDashoffset = -acc.offset;
      return {
        offset: acc.offset + arcLength,
        items: [...acc.items, { ...src, strokeDasharray, strokeDashoffset }],
      };
    },
    { offset: 0, items: [] }
  ).items;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Komposisi Kanal Rujukan</h3>
          <p className="text-[11px] text-slate-500">Asal kedatangan pengunjung profil bio</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600 shrink-0">
          <PieChartIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Donut Chart Visual & Legend */}
      <div className="flex items-center gap-4 py-2">
        {/* SVG Donut */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
            {/* Segment circles */}
            {segments.map((seg) => (
              <circle
                key={seg.id}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={activeSource?.id === seg.id ? "14" : "12"}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setActiveSource(seg)}
              />
            ))}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] text-slate-400 font-medium leading-none">Total</span>
            <span className="text-sm font-bold text-slate-900 leading-tight font-mono">
              {displaySources.reduce((acc, s) => acc + (parseInt(String(s.count).replace(/\./g, ''), 10) || 0), 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="flex-1 space-y-1.5">
          {displaySources.map((src) => (
            <div
              key={src.id}
              onMouseEnter={() => setActiveSource(src)}
              className={`p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                activeSource?.id === src.id ? 'bg-slate-50 font-semibold' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2.5 h-2.5 rounded-full ${src.bg} shrink-0`} />
                <span className="text-slate-700 truncate text-[11px]">{src.name}</span>
              </div>
              <span className="font-mono text-slate-900 text-[11px] shrink-0 font-bold ml-2">
                {src.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Strategy Footnote */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        {(() => {
          const topSources = [...displaySources].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
          const topTwoPct = Math.round((topSources[0]?.percentage || 0) + (topSources[1]?.percentage || 0));
          const topTwoNames = [topSources[0]?.name, topSources[1]?.name].filter(Boolean).join(' dan ');
          return (
            <span>
              {topTwoPct > 0
                ? `${topTwoPct}% kunjungan didominasi oleh ${topTwoNames}`
                : 'Menunggu data rujukan pengunjung'}
            </span>
          );
        })()}
        <span className="text-[10px] font-mono text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          Kanal Utama
        </span>
      </div>
    </div>
  );
}
