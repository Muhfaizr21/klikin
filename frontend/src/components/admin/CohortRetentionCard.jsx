import React from 'react';

export default function CohortRetentionCard({ cohorts: propCohorts, months: propMonths }) {
  const defaultMonths = ['B1', 'B2', 'B3', 'B4', 'B5'];

  const defaultCohorts = [
    {
      label: 'Apr',
      data: [
        { value: '78%', active: true, bg: 'bg-[#6366f1] text-white' },
        { value: '69%', active: true, bg: 'bg-[#818cf8] text-white' },
        { value: '64%', active: true, bg: 'bg-[#a5b4fc] text-slate-900 font-semibold' },
        { value: '61%', active: true, bg: 'bg-[#c7d2fe] text-slate-900 font-semibold' },
        { value: '58%', active: true, bg: 'bg-[#e0e7ff] text-slate-800 font-semibold' },
      ],
    },
    {
      label: 'Mei',
      data: [
        { value: '81%', active: true, bg: 'bg-[#6366f1] text-white' },
        { value: '72%', active: true, bg: 'bg-[#818cf8] text-white' },
        { value: '66%', active: true, bg: 'bg-[#a5b4fc] text-slate-900 font-semibold' },
        { value: '62%', active: true, bg: 'bg-[#c7d2fe] text-slate-900 font-semibold' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
      ],
    },
    {
      label: 'Jun',
      data: [
        { value: '76%', active: true, bg: 'bg-[#6366f1] text-white' },
        { value: '70%', active: true, bg: 'bg-[#818cf8] text-white' },
        { value: '63%', active: true, bg: 'bg-[#a5b4fc] text-slate-900 font-semibold' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
      ],
    },
    {
      label: 'Jul',
      data: [
        { value: '83%', active: true, bg: 'bg-[#6366f1] text-white' },
        { value: '74%', active: true, bg: 'bg-[#818cf8] text-white' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
      ],
    },
    {
      label: 'Ags',
      data: [
        { value: '85%', active: true, bg: 'bg-[#4f46e5] text-white' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
        { value: null, active: false, bg: 'bg-slate-50 border border-slate-100' },
      ],
    },
  ];

  const months = (propMonths && propMonths.length > 0) ? propMonths : defaultMonths;
  const cohorts = (propCohorts && propCohorts.length > 0) ? propCohorts : defaultCohorts;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Retensi Berdasarkan Bulan Kunjungan</h3>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          % audiens yang kembali berinteraksi & beli di bulan ke-n
        </p>
      </div>

      {/* Cohort Heatmap Grid */}
      <div className="pt-4 overflow-x-auto scrollbar-none">
        <div className="min-w-[280px]">
          {/* Column Header: B1 .. B5 */}
          <div className="grid grid-cols-6 gap-2 mb-2">
            <span className="text-[10px] font-semibold text-slate-400 text-center" />
            {months.map((m) => (
              <span
                key={m}
                className="text-[10px] font-bold text-slate-400 text-center font-mono"
              >
                {m}
              </span>
            ))}
          </div>

          {/* Cohort Rows */}
          <div className="space-y-2">
            {cohorts.map((row) => (
              <div key={row.label} className="grid grid-cols-6 items-center gap-2">
                {/* Row Month Label */}
                <span className="text-[11px] font-bold text-slate-600 text-left pl-1">
                  {row.label}
                </span>

                {/* 5 Column Cells */}
                {row.data.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`h-9 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all shadow-2xs ${cell.bg}`}
                  >
                    {cell.value || ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Color Scale Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-start gap-2 text-[10px] text-slate-400 font-medium">
        <span>Rendah</span>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-2 rounded-xs bg-[#e0e7ff]" />
          <div className="w-3.5 h-2 rounded-xs bg-[#c7d2fe]" />
          <div className="w-3.5 h-2 rounded-xs bg-[#a5b4fc]" />
          <div className="w-3.5 h-2 rounded-xs bg-[#818cf8]" />
          <div className="w-3.5 h-2 rounded-xs bg-[#6366f1]" />
        </div>
        <span>Tinggi</span>
      </div>
    </div>
  );
}
