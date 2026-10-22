import React, { useRef, useEffect, useMemo } from 'react';
import ChartJS from './chartSetup';
import {
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  TwitterIcon,
  GlobeIcon,
  LockIcon,
} from '../../Icons';

const CHANNEL_COLORS = {
  Instagram: '#E1306C',
  TikTok: '#0F172A',
  WhatsApp: '#25D366',
  Direct: '#3B82F6',
  YouTube: '#EF4444',
  Twitter: '#0284C7',
  Referral: '#8B5CF6',
  Lainnya: '#94A3B8',
};

function getChannelIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('instagram')) return <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />;
  if (n.includes('tiktok')) return <TikTokIcon className="w-3.5 h-3.5 text-slate-900" />;
  if (n.includes('whatsapp')) return <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />;
  if (n.includes('twitter') || n.includes('x')) return <TwitterIcon className="w-3.5 h-3.5 text-sky-600" />;
  return <GlobeIcon className="w-3.5 h-3.5 text-slate-500" />;
}

export default function AcquisitionChannelsChart({
  sources = [],
  isPro = true,
  onOpenPaywall,
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const safeSources = useMemo(() => {
    return Array.isArray(sources) ? sources : [];
  }, [sources]);

  const totalCount = useMemo(() => {
    return safeSources.reduce((acc, s) => acc + (s.count || 0), 0);
  }, [safeSources]);

  useEffect(() => {
    if (!canvasRef.current || safeSources.length === 0) return;

    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    chartInstanceRef.current = null;

    const ctx = canvasRef.current.getContext('2d');
    const labels = safeSources.map((s) => s.name);
    const data = safeSources.map((s) => s.count || 0);
    const bgColors = safeSources.map((s) => CHANNEL_COLORS[s.name] || '#94A3B8');

    const config = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: bgColors,
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        animation: {
          duration: 500,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            titleFont: { size: 11, weight: 'bold' },
            bodyColor: '#E2E8F0',
            bodyFont: { size: 11 },
            padding: 8,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const val = context.parsed;
                const pct = totalCount > 0 ? ((val / totalCount) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${val.toLocaleString('id-ID')} (${pct}%)`;
              },
            },
          },
        },
      },
    };

    chartInstanceRef.current = new ChartJS(ctx, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [safeSources, totalCount]);

  return (
    <div className="relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Saluran Akuisisi
            </h3>
            {!isPro && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                PRO
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {safeSources.length} Kanal
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Asal rujukan trafik pengunjung membuka tautan bio Anda
        </p>
      </div>

      {/* Doughnut Canvas with Center Stat */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-40 h-40 relative">
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Total Trafik
            </span>
            <span className="text-base font-bold text-slate-900 leading-tight">
              {totalCount >= 1000 ? `${(totalCount / 1000).toFixed(1)}k` : totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        {safeSources.slice(0, 4).map((source) => (
          <div key={source.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CHANNEL_COLORS[source.name] || '#94A3B8' }}
              />
              <div className="flex items-center gap-1.5 truncate">
                {getChannelIcon(source.name)}
                <span className="text-slate-700 font-medium truncate">{source.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500">{source.count?.toLocaleString('id-ID')}</span>
              <span className="font-semibold text-slate-900 w-10 text-right">
                {source.percentage?.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Free Paywall Blur */}
      {!isPro && (
        <div className="absolute inset-0 backdrop-blur-xs bg-white/70 rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center mb-2 shadow-sm">
            <LockIcon className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Saluran Rujukan Pro</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
            Lihat perbandingan audiens dari Instagram, TikTok, WhatsApp, dan lainnya.
          </p>
          <button
            type="button"
            onClick={() => onOpenPaywall?.('Saluran Trafik Rujukan (Pro)')}
            className="mt-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            Aktifkan Klikin Pro
          </button>
        </div>
      )}
    </div>
  );
}
