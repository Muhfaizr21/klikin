import React from 'react';
import {
  SearchIcon,
  BellIcon,
  MessageCircleIcon,
  DownloadIcon,
  ChevronDownIcon,
  ClockIcon,
} from '../Icons';

export default function AdminHeader({
  title = 'Laporan Platform',
  subtitle = 'September 2026 • Analisis performa platform Klikin dibandingkan Agustus',
  activeSubTab = 'overview',
  onSelectSubTab,
  onExport,
  searchQuery = '',
  onSearchChange,
}) {
  const subTabs = [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'revenue', label: 'Pendapatan' },
    { id: 'retention', label: 'Retensi' },
    { id: 'tenants', label: 'Tenant & Kreator' },
    { id: 'marketing', label: 'Pemasaran' },
  ];

  return (
    <div className="space-y-5 pb-2">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search Bar with ⌘K Badge */}
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Cari tenant, link bio, transaksi..."
              className="w-full pl-9 pr-10 py-1.5 rounded-full border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md font-mono shadow-2xs pointer-events-none">
              ⌘K
            </span>
          </div>

          {/* Chat / Message Button */}
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Percakapan Dukungan & Pesan"
          >
            <MessageCircleIcon className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs relative cursor-pointer"
            title="Notifikasi Sistem"
          >
            <BellIcon className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 border-2 border-white" />
          </button>

          {/* Export Report Pill CTA */}
          <button
            type="button"
            onClick={onExport}
            className="px-4 py-2 rounded-full font-bold text-xs bg-slate-900 hover:bg-slate-800 active:scale-98 text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Ekspor Laporan</span>
          </button>
        </div>
      </div>

      {/* Subheader Filter Row: Segmented Pills & Date Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Left Category Tabs (Ringkasan, Pendapatan, Retensi, etc.) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectSubTab?.(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Date & Segment Dropdown Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Date Range Pill */}
          <button
            type="button"
            className="px-3 py-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>1-30 Sep 2026</span>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Comparison Pill */}
          <button
            type="button"
            className="px-3 py-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <span>vs Ags 2026</span>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Segment Filter Pill */}
          <button
            type="button"
            className="px-3 py-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <span>Semua Tenant</span>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
