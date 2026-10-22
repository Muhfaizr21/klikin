import React from 'react';
import { ZapIcon } from '../Icons';

export default function TopTenantPerformanceCard({ onActionClick }) {
  const tenants = [
    {
      id: 'kopi_seduh',
      name: 'Kopi Seduh Nusantara',
      role: 'Kuliner & Kafe',
      revenue: 'Rp 58,4 jt',
      rate: '86%',
      barColor: 'bg-[#6366f1]', // Deep Indigo
      avatar: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&h=100&fit=crop&auto=format&q=80',
      initials: 'KS',
    },
    {
      id: 'fashion_style',
      name: 'Fashion Style Official',
      role: 'Pakaian & Mode',
      revenue: 'Rp 34,1 jt',
      rate: '78%',
      barColor: 'bg-[#6366f1]', // Deep Indigo
      avatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&auto=format&q=80',
      initials: 'FS',
    },
    {
      id: 'studio_desain',
      name: 'Studio Desain Kreatif',
      role: 'Jasa & Agensi',
      revenue: 'Rp 27,3 jt',
      rate: '72%',
      barColor: 'bg-[#818cf8]', // Medium Indigo
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop&auto=format&q=80',
      initials: 'SD',
    },
    {
      id: 'kulineran_solo',
      name: 'Kulineran Malam Solo',
      role: 'Makanan Ringan',
      revenue: 'Rp 22,6 jt',
      rate: '64%',
      barColor: 'bg-[#84cc16]', // Lime accent
      avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop&auto=format&q=80',
      initials: 'KM',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Performa & Keaktifan Tenant</h3>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Klik terverifikasi ÷ alokasi kapasitas bio link • Sep
        </p>
      </div>

      {/* Tenant List */}
      <div className="divide-y divide-slate-50 py-1 space-y-3.5">
        {tenants.map((t) => (
          <div key={t.id} className="pt-3.5 first:pt-2 flex items-center justify-between gap-3">
            {/* Avatar & Info */}
            <div className="flex items-center gap-2.5 min-w-[150px] sm:min-w-[190px]">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0 bg-slate-100"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-8 h-8 rounded-full bg-slate-200 hidden items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                {t.initials}
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">{t.name}</h4>
                <p className="text-[11px] text-slate-400 truncate font-medium">
                  {t.role} • <span className="text-slate-600 font-mono font-semibold">{t.revenue}</span>
                </p>
              </div>
            </div>

            {/* Horizontal Bar */}
            <div className="flex-1 max-w-[160px] bg-slate-100/80 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${t.barColor}`}
                style={{ width: t.rate }}
              />
            </div>

            {/* Rate Percentage */}
            <div className="text-right min-w-[36px]">
              <span className="text-xs font-bold text-slate-900 font-mono">{t.rate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Hint Banner */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div
          onClick={onActionClick}
          className="bg-[#f0fdf4] hover:bg-[#e6fce8] border border-[#d9f99d] rounded-xl p-2.5 px-3 flex items-center gap-2 text-[11px] text-emerald-900 font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          <ZapIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">💡 Hubungkan domain kustom kopiseduh.id untuk angkat rasio konversi ~75%</span>
        </div>
      </div>
    </div>
  );
}
