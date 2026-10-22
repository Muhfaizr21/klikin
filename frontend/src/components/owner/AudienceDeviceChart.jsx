import React from 'react';
import { SmartphoneIcon, MonitorIcon, ChevronRightIcon } from '../Icons';

export default function AudienceDeviceChart({ devices, summary, leadsCount = 0, onAddLeadForm }) {
  const mobileMetric = devices?.find((d) => d.name?.toLowerCase().includes('mobile') || d.name?.toLowerCase().includes('ponsel'));
  const mobilePct = mobileMetric ? Math.round(mobileMetric.percentage) : 88;
  const desktopPct = 100 - mobilePct;

  const views = summary?.page_views || 0;
  const clicks = summary?.total_clicks || 0;
  const ctr = summary?.ctr || (views > 0 ? (clicks / views) * 100 : 0);
  const unique = summary?.unique_visitors || 0;
  const leads = leadsCount || 0;

  const funnelStages = [
    {
      stage: 'Kunjungan Bio',
      count: views.toLocaleString('id-ID'),
      percentage: 100,
      barWidth: '100%',
      color: 'bg-slate-900',
    },
    {
      stage: 'Klik Tautan',
      count: clicks.toLocaleString('id-ID'),
      percentage: Math.round(ctr),
      barWidth: `${Math.min(100, Math.max(10, Math.round(ctr)))}%`,
      color: 'bg-slate-700',
    },
    {
      stage: 'Pengunjung Unik',
      count: unique.toLocaleString('id-ID'),
      percentage: Math.round((unique / Math.max(views, 1)) * 100),
      barWidth: `${Math.min(100, Math.max(10, Math.round((unique / Math.max(views, 1)) * 100)))}%`,
      color: 'bg-slate-500',
    },
    {
      stage: 'Kontak Terkumpul',
      count: leads.toLocaleString('id-ID'),
      percentage: Math.round((leads / Math.max(views, 1)) * 100),
      barWidth: `${Math.min(100, Math.max(8, Math.round((leads / Math.max(views, 1)) * 100)))}%`,
      color: 'bg-emerald-600',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Karakteristik & Corong Konversi</h3>
          <span className="text-[10px] font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-mono">
            {leads} Kontak Terkumpul
          </span>
        </div>
        <p className="text-[11px] text-slate-500">Distribusi perangkat dan alur konversi pengunjung</p>
      </div>

      {/* Device Ratio Segmented Bar */}
      <div className="my-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
          <div className="flex items-center gap-1.5">
            <SmartphoneIcon className="w-3.5 h-3.5 text-slate-700" />
            <span>Ponsel Cerdas: {mobilePct}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <MonitorIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Komputer / PC: {desktopPct}%</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
          <div style={{ width: `${mobilePct}%` }} className="bg-slate-900 h-full rounded-l-full" title={`${mobilePct}% Smartphone`} />
          <div style={{ width: `${desktopPct}%` }} className="bg-slate-300 h-full rounded-r-full" title={`${desktopPct}% Desktop`} />
        </div>
        <p className="text-[10px] text-slate-500">
          Mayoritas pengunjung mengakses melalui layar sentuh ({mobilePct}%). Pastikan konten utama terlihat tanpa menggulir layar.
        </p>
      </div>

      {/* Conversion Funnel Horizontal Bars */}
      <div className="space-y-2.5 mb-3">
        <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
          Corong Interaksi Bio:
        </span>
        {funnelStages.map((item) => (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">{item.stage}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 font-mono">{item.count}</span>
                <span className="text-[10px] text-slate-400 font-mono w-10 text-right">({item.percentage}%)</span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: item.barWidth }}
                className={`h-full rounded-full transition-all duration-200 ${item.color}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Button: Leads Capture Form */}
      <button
        type="button"
        onClick={onAddLeadForm || (() => alert('Membuka konfigurasi formulir tangkap leads (Klikin Pro)...'))}
        className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
      >
        <span>Kelola Formulir Kontak & Leads</span>
        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-500" />
      </button>
    </div>
  );
}
