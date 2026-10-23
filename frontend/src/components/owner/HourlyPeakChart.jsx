import React, { useRef, useEffect } from 'react';
import ChartJS from './analytics/chartSetup';
import { ClockIcon } from '../Icons';

const BUCKET_LABELS = ['00-06', '06-11', '11-15', '15-18', '18-21', '21-24'];
const DEFAULT_DATA = [992, 3968, 5456, 3472, 8928, 1984];

export default function HourlyPeakChart({ hourly }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Compute 6 time bucket aggregations if hourly data is available
  const aggregatedData = React.useMemo(() => {
    if (!hourly || hourly.length === 0) return DEFAULT_DATA;

    const buckets = [0, 0, 0, 0, 0, 0];
    hourly.forEach((point) => {
      const h = point.hour;
      const count = (point.views || 0) + (point.clicks || 0);
      if (h >= 0 && h < 6) buckets[0] += count;
      else if (h >= 6 && h < 11) buckets[1] += count;
      else if (h >= 11 && h < 15) buckets[2] += count;
      else if (h >= 15 && h < 18) buckets[3] += count;
      else if (h >= 18 && h < 21) buckets[4] += count;
      else if (h >= 21 && h <= 24) buckets[5] += count;
    });

    return buckets;
  }, [hourly]);

  const maxVal = Math.max(...aggregatedData, 1);
  const maxIdx = aggregatedData.indexOf(maxVal);
  const peakLabel = BUCKET_LABELS[maxIdx] || '18-21';
  const totalInteractions = aggregatedData.reduce((a, b) => a + b, 0) || 1;
  const peakPercent = Math.round((maxVal / totalInteractions) * 100);

  useEffect(() => {
    if (!canvasRef.current) return;

    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    chartRef.current = null;

    const ctx = canvasRef.current.getContext('2d');

    const bgColors = aggregatedData.map((v) => (v === maxVal ? '#0F172A' : '#CBD5E1'));
    const hoverColors = aggregatedData.map((v) => (v === maxVal ? '#1E293B' : '#94A3B8'));

    const config = {
      type: 'bar',
      data: {
        labels: BUCKET_LABELS,
        datasets: [
          {
            label: 'Interaksi',
            data: aggregatedData,
            backgroundColor: bgColors,
            hoverBackgroundColor: hoverColors,
            borderRadius: 6,
            barPercentage: 0.65,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            titleFont: { size: 11, weight: 'bold' },
            bodyColor: '#E2E8F0',
            bodyFont: { size: 11 },
            padding: 8,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y.toLocaleString('id-ID')} interaksi`,
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
            display: false,
            beginAtZero: true,
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
  }, [aggregatedData, maxVal]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Sebaran Jam Kunjungan</h3>
            <span className="text-[10px] font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-mono">
              Puncak {peakLabel}:00 WIB
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Aktivitas audiens per interval waktu harian</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600 shrink-0">
          <ClockIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-44 mt-2">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 mt-2">
        <span>00:00 (Dini Hari)</span>
        <span className="text-slate-900 font-semibold">Puncak Jam Sibuk: {peakPercent}%</span>
        <span>24:00 (Larut Malam)</span>
      </div>
    </div>
  );
}
