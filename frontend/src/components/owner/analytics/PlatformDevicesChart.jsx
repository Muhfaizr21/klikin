import React, { useRef, useEffect, useMemo } from 'react';
import ChartJS from './chartSetup';
import { LockIcon } from '../../Icons';

const DEVICE_COLORS = {
  Mobile: '#0F172A', // Slate 900
  Desktop: '#6366F1', // Indigo 500
  Tablet: '#94A3B8', // Slate 400
  Lainnya: '#CBD5E1',
};

export default function PlatformDevicesChart({
  devices = [],
  browsers = [],
  isPro = true,
  onOpenPaywall,
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const safeDevices = useMemo(() => {
    return Array.isArray(devices) ? devices : [];
  }, [devices]);

  const safeBrowsers = useMemo(() => {
    return Array.isArray(browsers) ? browsers : [];
  }, [browsers]);

  useEffect(() => {
    if (!canvasRef.current || safeDevices.length === 0) return;

    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    chartInstanceRef.current = null;

    const ctx = canvasRef.current.getContext('2d');
    const labels = safeDevices.map((d) => d.name);
    const data = safeDevices.map((d) => d.count || 0);
    const bgColors = safeDevices.map((d) => DEVICE_COLORS[d.name] || '#94A3B8');

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
            hoverOffset: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
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
                const total = data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
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
  }, [safeDevices]);

  const mobilePct = safeDevices.find((d) => d.name === 'Mobile')?.percentage || 86.2;

  return (
    <div className="relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Perangkat & Lingkungan Akses
            </h3>
            {!isPro && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                PRO
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {mobilePct.toFixed(0)}% Mobile
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Tipe perangkat dan browser in-app tempat bio dibuka
        </p>
      </div>

      {/* Doughnut Canvas with Mobile Highlight */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-36 h-36 relative">
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Smartphone
            </span>
            <span className="text-sm font-bold text-slate-900 leading-tight">
              {mobilePct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* In-App Browser Breakdown */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
          Browser In-App Populer
        </div>
        {safeBrowsers.slice(0, 3).map((browser) => (
          <div key={browser.name} className="flex items-center justify-between text-xs">
            <span className="text-slate-600 truncate">{browser.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full"
                  style={{ width: `${Math.min(browser.percentage || 0, 100)}%` }}
                />
              </div>
              <span className="font-semibold text-slate-900 w-8 text-right">
                {browser.percentage?.toFixed(0)}%
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
          <h4 className="text-sm font-bold text-slate-900">Analisis Perangkat Pro</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
            Ketahui browser in-app (IG, TikTok) yang sering mengalami issue saat membuka tautan.
          </p>
          <button
            type="button"
            onClick={() => onOpenPaywall?.('Analisis Perangkat & Browser (Pro)')}
            className="mt-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            Aktifkan Klikin Pro
          </button>
        </div>
      )}
    </div>
  );
}
