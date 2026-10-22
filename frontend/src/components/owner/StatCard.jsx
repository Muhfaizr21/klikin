import React from 'react';
import { BarChartIcon, LinkIcon, ClockIcon, TrendingUpIcon } from '../Icons';

export default function StatCard({ title, value, subtext, icon }) {
  const getIcon = () => {
    if (icon) return icon;
    const lower = (title || '').toLowerCase();
    if (lower.includes('interaksi')) return <BarChartIcon className="w-3.5 h-3.5 text-indigo-600" />;
    if (lower.includes('tautan') || lower.includes('link')) return <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />;
    if (lower.includes('waktu') || lower.includes('puncak')) return <ClockIcon className="w-3.5 h-3.5 text-amber-600" />;
    return <TrendingUpIcon className="w-3.5 h-3.5 text-slate-700" />;
  };

  const getBadgeStyle = () => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('interaksi')) return 'bg-indigo-50 border-indigo-100';
    if (lower.includes('tautan') || lower.includes('link')) return 'bg-emerald-50 border-emerald-100';
    if (lower.includes('waktu') || lower.includes('puncak')) return 'bg-amber-50 border-amber-100';
    return 'bg-slate-100 border-slate-200';
  };

  const isLongText = typeof value === 'string' && value.length > 12;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between min-h-[145px]">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getBadgeStyle()}`}>
            {getIcon()}
          </div>
        </div>

        {/* Main Metric Value */}
        <div
          title={typeof value === 'string' ? value : undefined}
          className={`font-bold text-slate-900 tracking-tight mb-2 ${
            isLongText
              ? 'text-lg sm:text-xl leading-snug break-words'
              : 'text-2xl sm:text-[28px] leading-none'
          }`}
        >
          {value}
        </div>
      </div>

      {/* Subtext info */}
      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
        {subtext}
      </p>
    </div>
  );
}

