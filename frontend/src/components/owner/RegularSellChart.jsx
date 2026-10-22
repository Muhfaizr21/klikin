import React, { useRef, useEffect } from 'react';
import ChartJS from './analytics/chartSetup';

const DEFAULT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DEFAULT_VIEWS = [450, 580, 880, 480, 600, 400, 820];
const DEFAULT_CLICKS = [350, 500, 680, 400, 300, 250, 720];

export default function RegularSellChart({ timeline, onExport }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const labels = timeline && timeline.length > 0 ? timeline.map((t) => t.date_label || t.date) : DEFAULT_DAYS;
  const views = timeline && timeline.length > 0 ? timeline.map((t) => t.views) : DEFAULT_VIEWS;
  const clicks = timeline && timeline.length > 0 ? timeline.map((t) => t.clicks) : DEFAULT_CLICKS;

  // Calculate dynamic peak day
  const peakDayIdx = views.reduce((maxIdx, val, idx, arr) => (val > arr[maxIdx] ? idx : maxIdx), 0);
  const peakDayName = labels[peakDayIdx] || 'Hari Ini';

  useEffect(() => {
    if (!canvasRef.current) return;

    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    chartRef.current = null;

    const ctx = canvasRef.current.getContext('2d');

    const viewGrad = ctx.createLinearGradient(0, 0, 0, 180);
    viewGrad.addColorStop(0, 'rgba(15, 23, 42, 0.16)');
    viewGrad.addColorStop(1, 'rgba(15, 23, 42, 0.00)');

    const clickGrad = ctx.createLinearGradient(0, 0, 0, 180);
    clickGrad.addColorStop(0, 'rgba(79, 70, 229, 0.30)');
    clickGrad.addColorStop(1, 'rgba(79, 70, 229, 0.00)');

    const config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tampilan Profil',
            data: views,
            borderColor: '#0F172A',
            backgroundColor: viewGrad,
            fill: true,
            tension: 0.38,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#0F172A',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            borderWidth: 2.2,
          },
          {
            label: 'Tautan Diklik',
            data: clicks,
            borderColor: '#6366F1',
            backgroundColor: clickGrad,
            fill: true,
            tension: 0.38,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#6366F1',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            borderWidth: 2.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            titleFont: { size: 11, weight: 'bold' },
            bodyColor: '#E2E8F0',
            bodyFont: { size: 11 },
            padding: 8,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('id-ID')}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#94A3B8' },
            border: { color: '#F1F5F9' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(241, 245, 249, 0.9)' },
            ticks: {
              font: { size: 10 },
              color: '#94A3B8',
              maxTicksLimit: 4,
              callback: (v) => v >= 1000 ? `${v / 1000}k` : v,
            },
            border: { display: false },
          },
        },
      },
    };

    chartRef.current = new ChartJS(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [timeline]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Kunjungan Profil vs Klik Tautan
          </h3>
          <p className="text-[11px] text-slate-500">
            Puncak trafik interaksi tertinggi tercatat pada hari {peakDayName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              <span>Tampilan Bio</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Tautan Diklik</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onExport}
            disabled={!onExport}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            Ekspor Data
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-48 mt-2">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
