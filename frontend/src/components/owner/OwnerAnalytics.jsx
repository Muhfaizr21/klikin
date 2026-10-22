import React, { useState, useEffect, useMemo } from 'react';
import AnalyticsPaywallModal from './AnalyticsPaywallModal';
import TimelineActivityChart from './analytics/TimelineActivityChart';
import HourlyDistributionChart from './analytics/HourlyDistributionChart';
import AcquisitionChannelsChart from './analytics/AcquisitionChannelsChart';
import PlatformDevicesChart from './analytics/PlatformDevicesChart';
import {
  CalendarIcon,
  DownloadIcon,
  GlobeIcon,
  LockIcon,
  TrendingUpIcon,
  UsersIcon,
  MousePointerIcon,
  SparklesIcon,
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  SearchIcon,
  FilterIcon,
} from '../Icons';

const API_BASE = 'http://localhost:8080/api';

export default function OwnerAnalytics({ user, token }) {
  // Preset: '7d' | '30d' | '90d' | 'custom'
  const [preset, setPreset] = useState('7d');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [isCustomCalendarOpen, setIsCustomCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  // Pro status from authenticated user & live analytics response
  const isPro = Boolean(user?.is_pro || analyticsData?.is_pro);
  const [paywallModalOpen, setPaywallModalOpen] = useState(false);
  const [paywallFeatureName, setPaywallFeatureName] = useState('Fitur Klikin Pro');

  // Search query for link performance table
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  // Geo view tab: 'city' | 'country'
  const [geoTab, setGeoTab] = useState('city');

  // Fetch analytics data when parameters change
  useEffect(() => {
    fetchAnalytics();
  }, [preset, startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'dummy';
      let url = `${API_BASE}/owner/analytics?preset=${preset}`;
      if (preset === 'custom' && startDate && endDate) {
        url = `${API_BASE}/owner/analytics?start_date=${startDate}&end_date=${endDate}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat analitik. Silakan coba lagi.');
      }

      const result = await res.json();
      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error || 'Format data analitik tidak valid');
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (newPreset) => {
    if (!isPro && newPreset !== '7d') {
      handleTriggerProGating(
        newPreset === 'custom'
          ? 'Pemilihan Kalender Tanggal Khusus'
          : `Rentang Waktu ${newPreset.toUpperCase()} (Fitur Pro)`
      );
      return;
    }

    setPreset(newPreset);
    setIsCustomCalendarOpen(false);

    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let startD = new Date();

    if (newPreset === '7d') {
      startD.setDate(now.getDate() - 6);
    } else if (newPreset === '30d') {
      startD.setDate(now.getDate() - 29);
    } else if (newPreset === '90d') {
      startD.setDate(now.getDate() - 89);
    }

    setStartDate(startD.toISOString().split('T')[0]);
    setEndDate(end);
  };

  const handleExportCSV = async () => {
    if (!isPro) {
      handleTriggerProGating('Ekspor Laporan CSV');
      return;
    }

    try {
      const authToken = token || localStorage.getItem('klikin_token') || 'dummy';
      const exportUrl = `${API_BASE}/owner/analytics/export?start_date=${startDate}&end_date=${endDate}`;

      const res = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal mengunduh CSV');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `klikin_analytics_${startDate}_sd_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Ekspor CSV gagal: ' + err.message);
    }
  };

  const handleTriggerProGating = (featureName) => {
    setPaywallFeatureName(featureName);
    setPaywallModalOpen(true);
  };

  // Safe Geo List computation to prevent runtime crashes
  const geoList = useMemo(() => {
    if (!analyticsData) return [];
    const list = geoTab === 'city' ? analyticsData.geo_cities : analyticsData.geo_countries;
    return Array.isArray(list) ? list : [];
  }, [geoTab, analyticsData]);

  // Filtered links based on search
  const filteredLinks = useMemo(() => {
    const list = analyticsData?.links_breakdown || [];
    if (!linkSearchQuery.trim()) return list;
    const q = linkSearchQuery.toLowerCase();
    return list.filter(
      (l) =>
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.url && l.url.toLowerCase().includes(q))
    );
  }, [analyticsData?.links_breakdown, linkSearchQuery]);

  // Sparklines for KPI Cards
  const timeline = analyticsData?.timeline || [];
  const sparklineViews = useMemo(() => timeline.map((t) => t.views || 0), [timeline]);
  const sparklineClicks = useMemo(() => timeline.map((t) => t.clicks || 0), [timeline]);
  const sparklineCTR = useMemo(() => timeline.map((t) => t.ctr || 0), [timeline]);

  const renderSparkline = (points, strokeColor = 'stroke-slate-900') => {
    if (!points || points.length === 0) return null;
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const width = 64;
    const height = 24;
    const step = width / (points.length - 1 || 1);

    const pathData = points
      .map((val, idx) => {
        const x = (idx * step).toFixed(1);
        const y = (height - ((val - min) / range) * (height - 6) - 3).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0 opacity-80">
        <path
          d={pathData}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={strokeColor}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar & Parameter Capsule */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Analisis Perilaku Pengunjung
              </h2>
              {/* Realtime Active Pulse */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>
                  {analyticsData?.summary?.realtime_active || 45} Pengunjung Aktif
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Metrik interaksi audiens, rasio konversi klik, dan saluran akuisisi real-time
            </p>
          </div>

          {/* Action Tools: Status Badge & Export CSV */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isPro ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Klikin Pro Aktif</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleTriggerProGating('Semua Fitur Analisis Pro')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-white" />
                <span>Upgrade ke Pro</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isPro
                  ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
              {!isPro && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                  PRO
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Date Range Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Rentang:
            </span>
            {[
              { id: '7d', label: '7 Hari Terakhir' },
              { id: '30d', label: '30 Hari Terakhir' },
              { id: '90d', label: '90 Hari Terakhir' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  preset === p.id && !isCustomCalendarOpen
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                {p.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setPreset('custom');
                setIsCustomCalendarOpen(!isCustomCalendarOpen);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                preset === 'custom' || isCustomCalendarOpen
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kustom Kalender</span>
            </button>
          </div>

          {/* Active Period Label */}
          <div className="text-xs text-slate-500 font-medium">
            Periode:{' '}
            <strong className="text-slate-800 font-mono font-semibold">
              {startDate} s/d {endDate}
            </strong>
          </div>
        </div>

        {/* Custom Calendar Dropdown Panel */}
        {isCustomCalendarOpen && (
          <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Dari:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Sampai:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPreset('custom');
                setIsCustomCalendarOpen(false);
                fetchAnalytics();
              }}
              className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-xs"
            >
              Terapkan
            </button>
          </div>
        )}
      </div>

      {/* 2. 5W1H Highlights: 4 Top KPI Cards (WHO & WHY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Page Views */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tayangan Profil
            </span>
            {renderSparkline(sparklineViews, 'stroke-slate-900')}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {analyticsData?.summary?.page_views?.toLocaleString('id-ID') || 0}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <TrendingUpIcon className="w-3 h-3 text-emerald-600" />
              <span>+18.4%</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Total jumlah tayangan profil bio oleh pengunjung
          </p>
        </div>

        {/* Metric 2: Total Clicks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Interaksi
            </span>
            {renderSparkline(sparklineClicks, 'stroke-indigo-600')}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {analyticsData?.summary?.total_clicks?.toLocaleString('id-ID') || 0}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
              <MousePointerIcon className="w-3 h-3 text-indigo-600" />
              <span>+24.1%</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Agregat seluruh klik tombol tautan & sosmed
          </p>
        </div>

        {/* Metric 3: CTR (Rasio Klik per Tampilan) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rasio Konversi (CTR)
            </span>
            {renderSparkline(sparklineCTR, 'stroke-emerald-600')}
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {analyticsData?.summary?.ctr || 0}
              </span>
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              Sangat Baik
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Rata-rata konversi klik dari total pengunjung
          </p>
        </div>

        {/* Metric 4: Unique Visitors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pengunjung Unik
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <UsersIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {analyticsData?.summary?.unique_visitors?.toLocaleString('id-ID') || 0}
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              IP Unik
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Jumlah individu berbeda yang membuka halaman Anda
          </p>
        </div>
      </div>

      {/* 3. Primary Activity Timeline (WHEN) powered by Chart.js */}
      <TimelineActivityChart
        timeline={analyticsData?.timeline || []}
        summary={analyticsData?.summary || {}}
      />

      {/* 4. Mid Grid: WHEN (24 Jam) + WHERE (Akuisisi) + HOW (Perangkat) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* WHEN: 24h Peak Pattern */}
        <div className="h-full">
          <HourlyDistributionChart hourly={analyticsData?.hourly || []} />
        </div>

        {/* WHERE: Traffic Acquisition Channels */}
        <div className="h-full">
          <AcquisitionChannelsChart
            sources={analyticsData?.traffic_sources || []}
            isPro={isPro}
            onOpenPaywall={handleTriggerProGating}
          />
        </div>

        {/* HOW: Devices & In-App Browsers */}
        <div className="h-full">
          <PlatformDevicesChart
            devices={analyticsData?.devices || []}
            browsers={analyticsData?.browsers || []}
            isPro={isPro}
            onOpenPaywall={handleTriggerProGating}
          />
        </div>
      </div>

      {/* 5. Bottom Grid: WHAT (Performa Tautan) & WHERE (Sebaran Wilayah) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WHAT: Statistik Performa Per Link (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Performa Tautan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian interaksi dan tingkat konversi untuk masing-masing tautan bio
              </p>
            </div>

            {/* Search Table */}
            <div className="relative w-full sm:w-56">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={linkSearchQuery}
                onChange={(e) => setLinkSearchQuery(e.target.value)}
                placeholder="Cari tautan..."
                className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tautan</th>
                  <th className="py-3 px-4">URL Target</th>
                  <th className="py-3 px-4 text-right">Klik</th>
                  <th className="py-3 px-4">Pangsa</th>
                  <th className="py-3 px-4 text-right">Rasio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      Belum ada data klik pada tautan dalam periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 truncate max-w-[140px]">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] truncate max-w-[140px]">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-slate-900 hover:underline inline-flex items-center gap-1"
                          >
                            <span className="truncate max-w-[120px]">{item.url}</span>
                            <ExternalLinkIcon className="w-3 h-3 shrink-0 opacity-60" />
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono">
                        {item.clicks.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(item.share_rate || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-600 w-8 text-right">
                            {item.share_rate || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          {item.ctr || 0}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* WHERE: Sebaran Wilayah (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Sebaran Wilayah
                  </h3>
                  {!isPro && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konsentrasi lokasi asal pengunjung bio Anda
                </p>
              </div>

              {/* City vs Country Tab */}
              <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-lg text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setGeoTab('city')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    geoTab === 'city'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Kota
                </button>
                <button
                  type="button"
                  onClick={() => setGeoTab('country')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    geoTab === 'country'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Negara
                </button>
              </div>
            </div>

            {/* List with Progress Bars */}
            <div className="space-y-3 mt-4">
              {geoList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada data wilayah pengunjung.
                </div>
              ) : (
                geoList.slice(0, 6).map((item, idx) => (
                  <div key={item.name || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 text-slate-400 font-mono text-[10px]">
                          {idx + 1}.
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 text-[11px] font-mono">
                          {item.count?.toLocaleString('id-ID')} sesi
                        </span>
                        <span className="font-bold text-slate-900 w-10 text-right">
                          {item.percentage?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-900 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(item.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Free Paywall Blur */}
          {!isPro && (
            <div className="absolute inset-0 backdrop-blur-xs bg-white/70 rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center mb-2 shadow-sm">
                <LockIcon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Demografi Wilayah Pro</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                Ketahui kota dan negara asal calon pembeli untuk optimasi biaya iklan.
              </p>
              <button
                type="button"
                onClick={() => handleTriggerProGating('Analisis Geografis & Wilayah (Pro)')}
                className="mt-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                Aktifkan Klikin Pro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Paywall Upgrade Modal */}
      <AnalyticsPaywallModal
        isOpen={paywallModalOpen}
        onClose={() => setPaywallModalOpen(false)}
        featureName={paywallFeatureName}
      />
    </div>
  );
}
