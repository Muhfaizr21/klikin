import React from 'react';

export default function AdminStatCard({ label, value, subtext, icon: Icon, badgeColor = 'emerald' }) {
  return (
    <div className="bg-[var(--color-carbon)] border border-[var(--color-graphite)] rounded-2xl p-5 shadow-sm transition-all hover:border-white/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-[var(--color-fog)] uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
        {value}
      </div>
      {subtext && (
        <p className="text-[11px] font-mono text-[var(--color-mist)] mt-1.5 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full bg-${badgeColor}-400`} />
          <span>{subtext}</span>
        </p>
      )}
    </div>
  );
}
