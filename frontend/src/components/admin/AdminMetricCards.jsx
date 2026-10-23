import React from 'react';
import {
  LockIcon,
  CreditCardIcon,
  MessageCircleIcon,
  UserCheckIcon,
  BarChartIcon,
} from '../Icons';

export default function AdminMetricCards({ stats }) {
  const mrrAmount =
    stats?.mrr !== undefined && stats?.mrr !== null
      ? `Rp ${Number(stats.mrr).toLocaleString('id-ID')}`
      : 'Rp 0';

  const mrrGrowth = stats?.mrr_growth || '↑ 18.4%';
  const isMrrDown = mrrGrowth.startsWith('↓');

  const aovAmount =
    stats?.aov !== undefined && stats?.aov !== null
      ? `Rp ${Number(stats.aov).toLocaleString('id-ID')}`
      : 'Rp 245.000';

  const aovGrowth = stats?.aov_growth || '↑ Rp 26 rb';
  const isAovDown = aovGrowth.startsWith('↓');

  const proRenewalRate = stats?.pro_renewal_rate || '68%';
  const proRenewalGrowth = stats?.pro_renewal_growth || '↑ 4 poin';

  const userCount =
    stats?.total_users !== undefined && stats?.total_users !== null
      ? `${stats.total_users} akun`
      : '0 akun';

  const newUsersGrowth = stats?.new_users_growth || '↑ 9 akun';
  const isNewUsersDown = newUsersGrowth.startsWith('↓');

  const retention90Days = stats?.retention_90_days || '74%';
  const retentionGrowth = stats?.retention_growth || '↑ 2 poin';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Total Pendapatan */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold text-slate-500">Total Pendapatan (MRR)</span>
          <LockIcon className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {mrrAmount}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
              isMrrDown
                ? 'text-rose-700 bg-rose-50 border border-rose-200/80'
                : 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
            }`}
          >
            {mrrGrowth}
          </span>
        </div>
      </div>

      {/* 2. Rata-rata Transaksi */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold text-slate-500">Rata-rata Transaksi (AOV)</span>
          <CreditCardIcon className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {aovAmount}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
              isAovDown
                ? 'text-rose-700 bg-rose-50 border border-rose-200/80'
                : 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
            }`}
          >
            {aovGrowth}
          </span>
        </div>
      </div>

      {/* 3. Tingkat Pembaruan Pro (Lavender Card) */}
      <div className="bg-[#ede9fe] border border-[#ddd6fe] rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-[#6b21a8] mb-2">
          <span className="text-[11px] font-bold text-[#5b21b6]">Tingkat Pembaruan Pro</span>
          <MessageCircleIcon className="w-3.5 h-3.5 text-[#7c3aed]" />
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-black text-[#5b21b6] tracking-tight">
            {proRenewalRate}
          </span>
          <span className="text-[10px] font-bold text-[#5b21b6] bg-white/80 border border-[#c4b5fd] px-1.5 py-0.5 rounded-full shrink-0">
            {proRenewalGrowth}
          </span>
        </div>
      </div>

      {/* 4. Tenant & Kreator Baru */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold text-slate-500">Tenant & Kreator Baru</span>
          <UserCheckIcon className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {userCount}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
              isNewUsersDown
                ? 'text-rose-700 bg-rose-50 border border-rose-200/80'
                : 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
            }`}
          >
            {newUsersGrowth}
          </span>
        </div>
      </div>

      {/* 5. Retensi 90 Hari (Pastel Lime Card) */}
      <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-emerald-800 mb-2">
          <span className="text-[11px] font-bold text-emerald-900">Retensi 90 Hari</span>
          <BarChartIcon className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
            {retention90Days}
          </span>
          <span className="text-[10px] font-bold text-emerald-800 bg-white/90 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
            {retentionGrowth}
          </span>
        </div>
      </div>
    </div>
  );
}
