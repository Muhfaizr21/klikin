import React from 'react';
import { ExternalLinkIcon } from '../Icons';

export default function DailyMeetingCard({
  slug = 'kopiseduh',
  customDomain = null,
  visitorsCount = 0,
  realtimeActive = 0,
  onNavigateToEditor,
}) {
  const bioUrl = customDomain ? `https://${customDomain}` : `${window.location.origin}/#p/${slug}`;
  const displayUrl = customDomain ? customDomain : `klikin.id/${slug}`;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Status Bio Publik</h3>
            <p className="text-[11px] text-slate-500 font-mono">Aktif · Kecepatan muat &lt; 0.8s</p>
          </div>
        </div>

        {/* Slug info */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 my-2">
          <span className="text-[10px] text-slate-500 block font-medium">URL Publik Aktif:</span>
          <span className="text-xs font-mono font-bold text-slate-900 break-all">{displayUrl}</span>
        </div>

        {/* Realtime Traffic Metric */}
        <div className="flex items-center justify-between p-2.5 my-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {realtimeActive > 0 ? `${realtimeActive} Pengunjung Aktif Live` : 'Trafik Realtime'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {visitorsCount > 0 ? `${visitorsCount.toLocaleString('id-ID')} unik` : '0 unik'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-2">
        <a
          href={bioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <span>Buka Halaman Bio</span>
          <ExternalLinkIcon className="w-3 h-3 text-slate-400" />
        </a>

        {onNavigateToEditor && (
          <button
            type="button"
            onClick={onNavigateToEditor}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
          >
            Buka Editor Bio
          </button>
        )}
      </div>
    </div>
  );
}
