import React from 'react';

const THEMES = {
  purple: {
    bg: 'bg-[#ede9fe]/80',
    border: 'border-purple-200/60',
    dot: 'bg-purple-900',
    title: 'text-slate-700',
    sub: 'text-slate-500',
  },
  blue: {
    bg: 'bg-[#dbeafe]/80',
    border: 'border-blue-200/60',
    dot: 'bg-blue-900',
    title: 'text-slate-700',
    sub: 'text-slate-500',
  },
  mint: {
    bg: 'bg-[#dcfce7]/80',
    border: 'border-emerald-200/60',
    dot: 'bg-emerald-900',
    title: 'text-slate-700',
    sub: 'text-emerald-700 font-medium',
  },
};

export default function StatCard({ title, value, subtext, theme = 'purple' }) {
  const styles = THEMES[theme] || THEMES.purple;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-transform hover:-translate-y-0.5 ${styles.bg} ${styles.border}`}
    >
      {/* Top Header with circular dot badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
        <span className={`text-xs font-semibold tracking-tight ${styles.title}`}>
          {title}
        </span>
      </div>

      {/* Main Metric */}
      <div className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-none mb-2">
        {value}
      </div>

      {/* Subtext info */}
      <p className={`text-[11px] leading-tight ${styles.sub}`}>{subtext}</p>
    </div>
  );
}
