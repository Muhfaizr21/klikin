import React, { useState } from 'react';
import {
  SmartphoneIcon,
  MonitorIcon,
} from '../Icons';

export default function PlatformOverviewCharts() {
  const [activeHourIndex, setActiveHourIndex] = useState(19); // Jam puncak default 19:00

  // Dataset aktivitas trafik 24 jam (00:00 - 23:00)
  const hourlyTraffic = [
    { hour: '00', clicks: 1200, label: '00:00' },
    { hour: '01', clicks: 800, label: '01:00' },
    { hour: '02', clicks: 450, label: '02:00' },
    { hour: '03', clicks: 310, label: '03:00' },
    { hour: '04', clicks: 290, label: '04:00' },
    { hour: '05', clicks: 650, label: '05:00' },
    { hour: '06', clicks: 1400, label: '06:00' },
    { hour: '07', clicks: 2800, label: '07:00' },
    { hour: '08', clicks: 4600, label: '08:00' },
    { hour: '09', clicks: 6200, label: '09:00' },
    { hour: '10', clicks: 7500, label: '10:00' },
    { hour: '11', clicks: 8900, label: '11:00' },
    { hour: '12', clicks: 11200, label: '12:00 (Istirahat)' },
    { hour: '13', clicks: 9400, label: '13:00' },
    { hour: '14', clicks: 8100, label: '14:00' },
    { hour: '15', clicks: 9800, label: '15:00' },
    { hour: '16', clicks: 11600, label: '16:00' },
    { hour: '17', clicks: 13200, label: '17:00' },
    { hour: '18', clicks: 15400, label: '18:00 (Mulai Sibuk)' },
    { hour: '19', clicks: 18200, label: '19:00 (Puncak Trafik)', isPeak: true },
    { hour: '20', clicks: 17100, label: '20:00' },
    { hour: '21', clicks: 15900, label: '21:00' },
    { hour: '22', clicks: 10400, label: '22:00' },
    { hour: '23', clicks: 5200, label: '23:00' },
  ];

  const maxClick = Math.max(...hourlyTraffic.map((d) => d.clicks));

  // Kanal rujukan trafik
  const trafficChannels = [
    { name: 'Instagram Bio & Story', share: '52%', barWidth: '52%', color: 'bg-gradient-to-r from-purple-500 to-indigo-600', visitors: '74,2 rb' },
    { name: 'TikTok Showcase Link', share: '29%', barWidth: '29%', color: 'bg-slate-900', visitors: '41,4 rb' },
    { name: 'WhatsApp Direct Share', share: '13%', barWidth: '13%', color: 'bg-emerald-500', visitors: '18,6 rb' },
    { name: 'Pencarian & Referal Langsung', share: '6%', barWidth: '6%', color: 'bg-indigo-300', visitors: '8,5 rb' },
  ];

  // Wilayah asal pengunjung terbanyak
  const topCities = [
    { city: 'Jabodetabek', share: '42%' },
    { city: 'Surabaya', share: '21%' },
    { city: 'Bandung', share: '16%' },
    { city: 'Medan', share: '12%' },
    { city: 'Bali & Lainnya', share: '9%' },
  ];

  // Sektor industri tenant & kreator
  const creatorSegments = [
    { sector: 'Kuliner & F&B', count: '142 tenant', share: '34%', color: 'border-amber-200 bg-amber-50/50 text-amber-900' },
    { sector: 'Fashion & Mode', count: '118 tenant', share: '28%', color: 'border-purple-200 bg-purple-50/50 text-purple-900' },
    { sector: 'Personal Brand & Edukasi', count: '92 tenant', share: '22%', color: 'border-indigo-200 bg-indigo-50/50 text-indigo-900' },
    { sector: 'Jasa & Agensi', count: '67 tenant', share: '16%', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900' },
  ];

  // Tipe interaksi klik audiens
  const interactionTypes = [
    { type: 'Chat WhatsApp Pemesanan', percentage: 46, count: '65,4 rb klik', color: 'bg-emerald-500' },
    { type: 'Toko Online & Marketplace', percentage: 32, count: '45,5 rb klik', color: 'bg-[#6366f1]' },
    { type: 'Follow Media Sosial', percentage: 14, count: '19,9 rb klik', color: 'bg-[#818cf8]' },
    { type: 'Formulir Leads & Kontak', percentage: 8, count: '11,4 rb klik', color: 'bg-[#bef264]' },
  ];

  // Faktor pemicu konversi
  const conversionDrivers = [
    { trigger: 'Promo Terbatas / Flash Sale', impact: '42%', badge: 'Paling Efektif' },
    { trigger: 'Peluncuran Produk Baru', impact: '28%', badge: 'Trafik Tinggi' },
    { trigger: 'Katalog & Menu Rutin', impact: '19%', badge: 'Stabil' },
    { trigger: 'Kampanye Iklan Kolaborasi', impact: '11%', badge: 'Spike Singkat' },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. VISUAL TIMELINE 24 JAM & KANAL RUJUKAN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kiri: Kurva Aktivitas Trafik 24 Jam */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pola Aktivitas & Dinamika Trafik 24 Jam
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Frekuensi klik link dan kunjungan halaman bio sepanjang hari (Waktu Indonesia)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe] shadow-2xs">
                Jam Terpadat: 18:00 - 21:00 WIB
              </span>
            </div>
          </div>

          {/* Bar Chart Interaktif 24 Jam */}
          <div className="pt-6">
            <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-[160px] pb-2 border-b border-slate-100">
              {hourlyTraffic.map((d, idx) => {
                const heightPercent = Math.round((d.clicks / maxClick) * 100);
                const isSelected = activeHourIndex === idx;

                return (
                  <div
                    key={d.hour}
                    onMouseEnter={() => setActiveHourIndex(idx)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                  >
                    {/* Hover Floating Tooltip */}
                    {isSelected && (
                      <div className="absolute -top-10 z-20 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                        <span>{d.label}: {(d.clicks).toLocaleString('id-ID')} klik</span>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mb-1" />
                      </div>
                    )}

                    {/* Bar Bar */}
                    <div
                      className={`w-full rounded-t-md transition-all duration-200 ${
                        d.isPeak
                          ? 'bg-[#6366f1] group-hover:bg-[#4f46e5]'
                          : isSelected
                          ? 'bg-[#818cf8]'
                          : 'bg-[#e0e7ff] group-hover:bg-[#c7d2fe]'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                    />

                    {/* Hour Label */}
                    <span className="text-[9px] text-slate-400 font-mono mt-1.5 transition-colors group-hover:text-slate-800">
                      {idx % 3 === 0 ? d.hour : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer Keterangan */}
            <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                <span className="font-semibold text-slate-700">Puncak Interaksi:</span> Malam hari (19:00 - 21:00 WIB)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Peningkatan +124% aktivitas dibanding pagi hari
              </span>
            </div>
          </div>
        </div>

        {/* Kanan: Saluran Rujukan Utama & Sebaran Wilayah */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Saluran Rujukan Utama</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Platform asal pengunjung sebelum mengklik halaman bio
            </p>
          </div>

          <div className="space-y-3">
            {trafficChannels.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate pr-2">{c.name}</span>
                  <span className="font-bold text-slate-900 font-mono">{c.share}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: c.barWidth }} />
                </div>
              </div>
            ))}
          </div>

          {/* Sebaran Wilayah Konsentrasi */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Sebaran Wilayah Terbanyak
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topCities.map((geo) => (
                <span
                  key={geo.city}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700"
                >
                  {geo.city} <strong className="text-slate-900 font-bold ml-1">{geo.share}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROFIL SEKTOR KREATOR, PERILAKU KLIK & PEMICU KONVERSI */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Kolom 1: Sektor & Demografi Kreator */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-slate-900">Komposisi Sektor Kreator</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                419 Tenant Aktif
              </span>
            </div>
            <p className="text-xs text-slate-400">Bidang bisnis utama pengguna platform Klikin</p>
          </div>

          <div className="space-y-2">
            {creatorSegments.map((seg) => (
              <div
                key={seg.sector}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${seg.color}`}
              >
                <div>
                  <span className="font-bold">{seg.sector}</span>
                  <div className="text-[10px] opacity-80">{seg.count}</div>
                </div>
                <span className="font-mono font-bold text-sm">{seg.share}</span>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
            💡 Sektor F&B dan Kuliner mendominasi adopsi pemesanan instan via WhatsApp.
          </div>
        </div>

        {/* Kolom 2: Tipe Interaksi & Perilaku Klik */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-slate-900">Perilaku Klik Pengunjung</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Rata-rata CTR 28.4%
              </span>
            </div>
            <p className="text-xs text-slate-400">Aksi yang paling sering dipilih calon pembeli</p>
          </div>

          <div className="space-y-3">
            {interactionTypes.map((action) => (
              <div key={action.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate pr-1">{action.type}</span>
                  <span className="font-bold text-slate-900 font-mono">{action.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${action.color}`} style={{ width: `${action.percentage}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 font-mono block text-right">{action.count}</span>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-[#f0fdf4] border border-[#d9f99d] text-[11px] text-emerald-900 font-medium">
            ✓ Tombol WhatsApp langsung mencatatkan rasio interaksi tertinggi (46%).
          </div>
        </div>

        {/* Kolom 3: Pemicu Konversi & Kecepatan Akses */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-slate-900">Pemicu Konversi & Akses</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Respon Cepat
              </span>
            </div>
            <p className="text-xs text-slate-400">Faktor penentu klik dan kinerja perangkat</p>
          </div>

          {/* Pemicu */}
          <div className="space-y-2">
            {conversionDrivers.map((driver) => (
              <div
                key={driver.trigger}
                className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{driver.trigger}</span>
                  <div className="text-[10px] text-slate-400">{driver.badge}</div>
                </div>
                <span className="font-bold text-indigo-600 font-mono">{driver.impact}</span>
              </div>
            ))}
          </div>

          {/* Info Perangkat & Kecepatan */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SmartphoneIcon className="w-3.5 h-3.5 text-slate-400" />
                Perangkat Mobile
              </span>
              <strong className="text-slate-900 font-mono">94% (iOS & Android)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MonitorIcon className="w-3.5 h-3.5 text-slate-400" />
                Desktop Browser
              </span>
              <strong className="text-slate-900 font-mono">6%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
