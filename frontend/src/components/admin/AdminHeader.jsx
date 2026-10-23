import React, { useState, useRef, useEffect } from 'react';
import {
  SearchIcon,
  BellIcon,
  MessageCircleIcon,
  DownloadIcon,
  ChevronDownIcon,
  ClockIcon,
  CheckIcon,
  UsersIcon,
} from '../Icons';

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];
const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function getDateRangeMeta(key) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (key === 'this_month') {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const monthName = MONTH_NAMES_SHORT[month];
    const prevMonthIdx = (month - 1 + 12) % 12;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthName = MONTH_NAMES_SHORT[prevMonthIdx];

    return {
      label: `1-${lastDay} ${monthName} ${year}`,
      title: `${MONTH_NAMES_FULL[month]} ${year}`,
      compareDefault: `vs ${prevMonthName} ${prevYear}`,
      description: 'Bulan berjalan',
    };
  }

  if (key === 'last_month') {
    const prevMonthIdx = (month - 1 + 12) % 12;
    const prevYear = month === 0 ? year - 1 : year;
    const lastDay = new Date(prevYear, prevMonthIdx + 1, 0).getDate();
    const monthName = MONTH_NAMES_SHORT[prevMonthIdx];
    const prevPrevMonthIdx = (prevMonthIdx - 1 + 12) % 12;
    const prevPrevYear = prevMonthIdx === 0 ? prevYear - 1 : prevYear;
    const prevPrevMonthName = MONTH_NAMES_SHORT[prevPrevMonthIdx];

    return {
      label: `1-${lastDay} ${monthName} ${prevYear}`,
      title: `${MONTH_NAMES_FULL[prevMonthIdx]} ${prevYear}`,
      compareDefault: `vs ${prevPrevMonthName} ${prevPrevYear}`,
      description: 'Bulan lalu',
    };
  }

  if (key === '30d') {
    return {
      label: '30 Hari Terakhir',
      title: '30 Hari Terakhir',
      compareDefault: 'vs 30 Hari Sebelumnya',
      description: 'Rentang 30 hari ke belakang',
    };
  }

  if (key === '7d') {
    return {
      label: '7 Hari Terakhir',
      title: '7 Hari Terakhir',
      compareDefault: 'vs 7 Hari Sebelumnya',
      description: 'Rentang 7 hari ke belakang',
    };
  }

  if (key === 'year') {
    return {
      label: `Tahun ${year}`,
      title: `Tahun ${year}`,
      compareDefault: `vs Tahun ${year - 1}`,
      description: `Tahun kalender ${year}`,
    };
  }

  return {
    label: 'Semua Periode',
    title: 'Semua Periode',
    compareDefault: 'Tanpa Perbandingan',
    description: 'Seluruh data platform',
  };
}

export default function AdminHeader({
  title = 'Dashboard Overview',
  subtitle,
  activeSubTab = 'overview',
  onSelectSubTab,
  onExport,
  searchQuery = '',
  onSearchChange,
  onToggleMobileSidebar: _onToggleMobileSidebar,
  dateRange = 'this_month',
  onDateRangeChange,
  comparison = 'prev_period',
  onComparisonChange,
  tenantFilter = 'all',
  onTenantFilterChange,
  tenantsList = [],
  loading = false,
}) {
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [compareDropdownOpen, setCompareDropdownOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);

  const dateRef = useRef(null);
  const compareRef = useRef(null);
  const tenantRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setDateDropdownOpen(false);
      }
      if (compareRef.current && !compareRef.current.contains(event.target)) {
        setCompareDropdownOpen(false);
      }
      if (tenantRef.current && !tenantRef.current.contains(event.target)) {
        setTenantDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const subTabs = [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'revenue', label: 'Pendapatan' },
    { id: 'retention', label: 'Retensi' },
    { id: 'tenants', label: 'Tenant & Kreator' },
    { id: 'marketing', label: 'Pemasaran' },
  ];

  const dateMeta = getDateRangeMeta(dateRange);

  const dateRangeOptions = [
    { id: 'this_month', ...getDateRangeMeta('this_month') },
    { id: 'last_month', ...getDateRangeMeta('last_month') },
    { id: '30d', ...getDateRangeMeta('30d') },
    { id: '7d', ...getDateRangeMeta('7d') },
    { id: 'year', ...getDateRangeMeta('year') },
  ];

  const comparisonOptions = [
    { id: 'prev_period', label: dateMeta.compareDefault },
    { id: 'prev_year', label: 'vs Periode Sama Tahun Lalu' },
    { id: 'none', label: 'Tanpa Perbandingan' },
  ];

  const activeCompareLabel =
    comparison === 'none'
      ? 'Tanpa Perbandingan'
      : comparison === 'prev_year'
      ? 'vs Tahun Lalu'
      : dateMeta.compareDefault;

  // Selected tenant display
  let activeTenantLabel = 'Semua Tenant';
  if (tenantFilter === 'pro') {
    activeTenantLabel = 'Tenant Pro';
  } else if (tenantFilter === 'free') {
    activeTenantLabel = 'Tenant Free';
  } else if (tenantFilter !== 'all') {
    const found = tenantsList.find((t) => t.id === tenantFilter);
    if (found) {
      activeTenantLabel = found.full_name || found.username;
    }
  }

  // Dynamic subtitle when not explicitly overridden
  const computedSubtitle =
    subtitle ||
    `${dateMeta.title} • Analisis performa platform Klikin ${
      comparison !== 'none' ? `(${activeCompareLabel})` : ''
    }${tenantFilter !== 'all' ? ` • Filter: ${activeTenantLabel}` : ''}, dinamika trafik, dan kesehatan operasional`;

  return (
    <div className="space-y-5 pb-2">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {computedSubtitle}
          </p>
        </div>

        {/* Right Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Search Bar with ⌘K Badge */}
          <div className="relative flex-1 sm:w-60 md:w-64 lg:w-72">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Cari tenant, link bio, transaksi..."
              className="w-full pl-9 pr-9 sm:pr-10 py-2 sm:py-1.5 rounded-full border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
            />
            <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md font-mono shadow-2xs pointer-events-none">
              ⌘K
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
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
            </div>

            {/* Export Report Pill CTA */}
            <button
              type="button"
              onClick={onExport}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-full font-bold text-xs bg-slate-900 hover:bg-slate-800 active:scale-98 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Ekspor Laporan</span>
            </button>
          </div>
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
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative">
          {/* Animated Loading Badge */}
          {loading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/90 text-indigo-700 text-[11px] font-semibold shadow-2xs animate-in fade-in duration-150">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              <span className="hidden sm:inline">Memperbarui...</span>
            </div>
          )}

          {/* 1. Date Range Pill with Dropdown */}
          <div className="relative" ref={dateRef}>
            <button
              type="button"
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setCompareDropdownOpen(false);
                setTenantDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer ${
                dateDropdownOpen
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <ClockIcon className={`w-3.5 h-3.5 ${dateDropdownOpen ? 'text-white' : 'text-slate-400'}`} />
              <span>{dateMeta.label}</span>
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${dateDropdownOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pilih Rentang Waktu
                </div>
                <div className="mt-1 space-y-0.5">
                  {dateRangeOptions.map((opt) => {
                    const isSelected = dateRange === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onDateRangeChange?.(opt.id);
                          setDateDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'font-bold text-slate-900 bg-slate-50/80' : 'text-slate-600'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{opt.description}</div>
                        </div>
                        {isSelected && <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Comparison Pill with Dropdown */}
          <div className="relative" ref={compareRef}>
            <button
              type="button"
              onClick={() => {
                setCompareDropdownOpen(!compareDropdownOpen);
                setDateDropdownOpen(false);
                setTenantDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                compareDropdownOpen
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>{activeCompareLabel}</span>
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${compareDropdownOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
            </button>

            {compareDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bandingkan Dengan
                </div>
                <div className="mt-1 space-y-0.5">
                  {comparisonOptions.map((opt) => {
                    const isSelected = comparison === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onComparisonChange?.(opt.id);
                          setCompareDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'font-bold text-slate-900 bg-slate-50/80' : 'text-slate-600'
                        }`}
                      >
                        <span className="font-semibold">{opt.label}</span>
                        {isSelected && <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Segment / Tenant Filter Pill with Dropdown */}
          <div className="relative" ref={tenantRef}>
            <button
              type="button"
              onClick={() => {
                setTenantDropdownOpen(!tenantDropdownOpen);
                setDateDropdownOpen(false);
                setCompareDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                tenantDropdownOpen
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : tenantFilter !== 'all'
                  ? 'border-indigo-300 bg-indigo-50/70 text-indigo-700'
                  : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <UsersIcon className={`w-3.5 h-3.5 ${tenantDropdownOpen ? 'text-white' : tenantFilter !== 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="truncate max-w-[120px]">{activeTenantLabel}</span>
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${tenantDropdownOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
            </button>

            {tenantDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filter Tenant Platform
                </div>

                <div className="mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onTenantFilterChange?.('all');
                      setTenantDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                      tenantFilter === 'all' ? 'font-bold text-slate-900 bg-slate-50/80' : 'text-slate-600'
                    }`}
                  >
                    <span>Semua Tenant</span>
                    {tenantFilter === 'all' && <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTenantFilterChange?.('pro');
                      setTenantDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                      tenantFilter === 'pro' ? 'font-bold text-slate-900 bg-slate-50/80' : 'text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Hanya Tenant Pro</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/80">Pro</span>
                    </div>
                    {tenantFilter === 'pro' && <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTenantFilterChange?.('free');
                      setTenantDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                      tenantFilter === 'free' ? 'font-bold text-slate-900 bg-slate-50/80' : 'text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Hanya Tenant Free</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full border border-slate-200">Free</span>
                    </div>
                    {tenantFilter === 'free' && <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                </div>

                {tenantsList.length > 0 && (
                  <>
                    <div className="my-1.5 border-t border-slate-100" />
                    <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tenant Individu
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {tenantsList.map((t) => {
                        const isSelected = tenantFilter === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              onTenantFilterChange?.(t.id);
                              setTenantDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                              isSelected ? 'font-bold text-slate-900 bg-slate-50/80' : 'text-slate-600'
                            }`}
                          >
                            <div className="truncate mr-2">
                              <div className="truncate font-semibold text-slate-800">{t.full_name || t.username}</div>
                              <div className="text-[10px] text-slate-400 font-mono">@{t.username}</div>
                            </div>
                            {isSelected && <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
