import React, { useRef, useEffect, useMemo } from 'react';
import ChartJS from './chartSetup';

export default function HourlyDistributionChart({ hourly = [] }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Fallback data if hourly not yet populated
  const safeHourly = useMemo(() => {
    if (Array.isArray(hourly) && hourly.length === 24) {
      return hourly;
    }
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      views: 0,
      clicks: 0,
    }));
  }, [hourly]);

  // Find peak hour
  const peakHour = useMemo(() => {
    let max = -1;
    let peakIndex = 20;
    safeHourly.forEach((h, idx) => {
      if ((h.views || 0) > max) {
        max = h.views;
        peakIndex = idx;
      }
    });
    return `${String(peakIndex).padStart(2, '0')}:00 - ${String((peakIndex + 2) % 24).padStart(2, '0')}:00`;
  }, [safeHourly]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    chartInstanceRef.current = null;

    const ctx = canvasRef.current.getContext('2d');
    const labels = safeHourly.map((h) => h.label);
    const views = safeHourly.map((h) => h.views || 0);

    // Dynamic bar colors: highlight the highest hours
    const maxVal = Math.max(...views, 1);
    const backgroundColors = views.map((v) => {
      if (v >= maxVal * 0.8) return '#4F46E5'; // Indigo peak
      if (v >= maxVal * 0.5) return '#94A3B8'; // Slate mid
      return '#E2E8F0'; // Slate light
    });

    const hoverColors = views.map((v) => {
      if (v >= maxVal * 0.8) return '#4338CA';
      return '#64748B';
    });

    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Interaksi Jam',
            data: views,
            backgroundColor: backgroundColors,
            hoverBackgroundColor: hoverColors,
            borderRadius: 4,
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400,
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
              title: (ctx) => `Pukul ${ctx[0].label}`,
              label: (ctx) => ` Volume: ${ctx.parsed.y.toLocaleString('id-ID')} interaksi`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { size: 10 },
              color: '#94A3B8',
              maxRotation: 0,
              callback: function (val, index) {
                // Show every 3 hours for clean legibility
                return index % 3 === 0 ? labels[index] : '';
              },
            },
            border: {
              color: '#F1F5F9',
            },
          },
          y: {
            display: false,
            beginAtZero: true,
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
  }, [safeHourly]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Pola Jam Kunjungan
          </h3>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            24 Jam
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Distribusi waktu saat audiens paling aktif membuka bio
        </p>

        {/* Peak Window Badge */}
        <div className="mt-3 flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-xs text-slate-600">
            Waktu Puncak:{' '}
            <strong className="text-slate-900 font-semibold">{peakHour}</strong>
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-44 mt-4">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 mt-2">
        <span>00:00 (Dini Hari)</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-xs bg-indigo-600" />
          <span className="text-slate-600 font-medium">Jam Ramai</span>
        </div>
        <span>23:00 (Malam)</span>
      </div>
    </div>
  );
}
