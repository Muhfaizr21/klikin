import React, { useRef, useEffect, useState } from 'react';
import ChartJS from './chartSetup';

export default function TimelineActivityChart({
  timeline = [],
  summary = {},
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // View modes: 'curve' | 'bar' | 'conversion'
  const [viewMode, setViewMode] = useState('curve');
  // Metric filters: 'all' | 'views' | 'clicks'
  const [metricFilter, setMetricFilter] = useState('all');

  useEffect(() => {
    if (!canvasRef.current || !timeline || timeline.length === 0) return;

    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    chartInstanceRef.current = null;

    const ctx = canvasRef.current.getContext('2d');
    const labels = timeline.map((pt) => {
      const parts = pt.date.split('-');
      if (parts.length === 3) {
        const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${parseInt(parts[2], 10)} ${monthNames[parseInt(parts[1], 10)] || parts[1]}`;
      }
      return pt.date;
    });

    const viewsData = timeline.map((pt) => pt.views || 0);
    const clicksData = timeline.map((pt) => pt.clicks || 0);
    const ctrData = timeline.map((pt) => pt.ctr || 0);

    // Create Canvas Gradients
    const viewGrad = ctx.createLinearGradient(0, 0, 0, 320);
    viewGrad.addColorStop(0, 'rgba(15, 23, 42, 0.18)'); // Slate 900
    viewGrad.addColorStop(1, 'rgba(15, 23, 42, 0.00)');

    const clickGrad = ctx.createLinearGradient(0, 0, 0, 320);
    clickGrad.addColorStop(0, 'rgba(79, 70, 229, 0.32)'); // Indigo 600
    clickGrad.addColorStop(1, 'rgba(79, 70, 229, 0.00)');

    const ctrGrad = ctx.createLinearGradient(0, 0, 0, 320);
    ctrGrad.addColorStop(0, 'rgba(16, 185, 129, 0.28)'); // Emerald 500
    ctrGrad.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

    let datasets = [];

    if (viewMode === 'conversion') {
      datasets = [
        {
          label: 'Rasio Konversi (%)',
          data: ctrData,
          borderColor: '#10B981', // Emerald 500
          backgroundColor: ctrGrad,
          fill: true,
          tension: 0.38,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          borderWidth: 2.5,
          yAxisID: 'yCtr',
        },
      ];
    } else if (viewMode === 'bar') {
      if (metricFilter === 'all' || metricFilter === 'views') {
        datasets.push({
          type: 'bar',
          label: 'Tayangan Profil',
          data: viewsData,
          backgroundColor: '#1E293B', // Slate 800
          hoverBackgroundColor: '#0F172A',
          borderRadius: 6,
          barPercentage: 0.65,
          categoryPercentage: 0.75,
          yAxisID: 'y',
        });
      }
      if (metricFilter === 'all' || metricFilter === 'clicks') {
        datasets.push({
          type: 'bar',
          label: 'Klik Tautan',
          data: clicksData,
          backgroundColor: '#6366F1', // Indigo 500
          hoverBackgroundColor: '#4F46E5',
          borderRadius: 6,
          barPercentage: 0.65,
          categoryPercentage: 0.75,
          yAxisID: 'y',
        });
      }
    } else {
      // Default: 'curve' (Line with Spline Area)
      if (metricFilter === 'all' || metricFilter === 'views') {
        datasets.push({
          type: 'line',
          label: 'Tayangan Profil',
          data: viewsData,
          borderColor: '#1E293B',
          backgroundColor: viewGrad,
          fill: true,
          tension: 0.36,
          pointRadius: 2.5,
          pointHoverRadius: 6,
          pointBackgroundColor: '#1E293B',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          borderWidth: 2.2,
          yAxisID: 'y',
        });
      }
      if (metricFilter === 'all' || metricFilter === 'clicks') {
        datasets.push({
          type: 'line',
          label: 'Klik Tautan',
          data: clicksData,
          borderColor: '#6366F1',
          backgroundColor: clickGrad,
          fill: true,
          tension: 0.36,
          pointRadius: 2.5,
          pointHoverRadius: 6,
          pointBackgroundColor: '#6366F1',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          borderWidth: 2.2,
          yAxisID: 'y',
        });
      }
    }

    const config = {
      type: viewMode === 'bar' ? 'bar' : 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: {
          duration: 450,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            display: false, // We render a custom modern legend in UI
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            titleFont: { size: 12, weight: 'bold' },
            bodyColor: '#E2E8F0',
            bodyFont: { size: 11 },
            padding: { top: 8, bottom: 8, left: 12, right: 12 },
            cornerRadius: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: function (context) {
                const val = context.parsed.y;
                if (context.dataset.label.includes('%') || context.dataset.label.includes('Konversi')) {
                  return ` ${context.dataset.label}: ${val.toFixed(1)}%`;
                }
                return ` ${context.dataset.label}: ${val.toLocaleString('id-ID')}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { size: 11 },
              color: '#94A3B8',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10,
            },
            border: {
              color: '#E2E8F0',
            },
          },
          y: {
            display: viewMode !== 'conversion',
            beginAtZero: true,
            grid: {
              color: 'rgba(241, 245, 249, 0.9)',
              lineWidth: 1,
            },
            ticks: {
              font: { size: 11 },
              color: '#94A3B8',
              maxTicksLimit: 5,
              callback: function (val) {
                if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
                return val;
              },
            },
            border: {
              display: false,
            },
          },
          yCtr: {
            display: viewMode === 'conversion',
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(241, 245, 249, 0.9)',
            },
            ticks: {
              font: { size: 11 },
              color: '#10B981',
              callback: (val) => `${val}%`,
            },
            border: {
              display: false,
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
  }, [timeline, viewMode, metricFilter]);

  // Aggregate stats
  const totalViews = summary?.page_views || 0;
  const totalClicks = summary?.total_clicks || 0;
  const avgCtr = summary?.ctr || 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
      {/* Header Toolbar: Notice ZERO "Chart" or "Grafik" in titles! */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Aktivitas Harian
            </h3>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full">
              Real-time Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Volume interaksi harian berdasarkan rentang kalender yang ditentukan
          </p>
        </div>

        {/* View Controls & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Filter Tabs */}
          {viewMode !== 'conversion' && (
            <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-lg text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setMetricFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  metricFilter === 'all'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter('views')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  metricFilter === 'views'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Tayangan
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter('clicks')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  metricFilter === 'clicks'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Klik
              </button>
            </div>
          )}

          {/* Type Toggle: Kurva vs Kolom vs Rasio */}
          <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-lg text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('curve')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'curve'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Kurva
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bar')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'bar'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Kolom
            </button>
            <button
              type="button"
              onClick={() => setViewMode('conversion')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'conversion'
                  ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Rasio %
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Legend and Quick Highlights */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 text-xs">
        <div className="flex items-center gap-4">
          {viewMode !== 'conversion' ? (
            <>
              {(metricFilter === 'all' || metricFilter === 'views') && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  <span className="text-slate-600 font-medium">Tayangan Profil</span>
                  <span className="font-bold text-slate-900 ml-0.5">
                    {totalViews.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              {(metricFilter === 'all' || metricFilter === 'clicks') && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span className="text-slate-600 font-medium">Total Klik</span>
                  <span className="font-bold text-indigo-700 ml-0.5">
                    {totalClicks.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Rata-rata Rasio Klik</span>
              <span className="font-bold text-emerald-700 ml-0.5">{avgCtr}%</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Arahkan kursor untuk rincian data per tanggal
        </div>
      </div>

      {/* Canvas Mount Container */}
      <div className="relative w-full h-72 sm:h-80 mt-2">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
