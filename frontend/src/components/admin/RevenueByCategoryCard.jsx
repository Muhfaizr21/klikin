import React from 'react';
import {
  SparklesIcon,
  CreditCardIcon,
  GlobeIcon,
  MessageCircleIcon,
  ShoppingBagIcon,
  MinusIcon,
} from '../Icons';

const ICON_MAP = {
  monthly_pro: SparklesIcon,
  yearly_pro: CreditCardIcon,
  custom_domain: GlobeIcon,
  whatsapp_leads: MessageCircleIcon,
  pixel_retail: ShoppingBagIcon,
};

export default function RevenueByCategoryCard({ categories: propCategories, summaryNote }) {
  const defaultCategories = [
    {
      id: 'monthly_pro',
      name: 'Langganan Pro Bulanan',
      sublabel: 'Paket Kreator Rp29rb/bln',
      amount: 'Rp 61,2 jt',
      change: '↑ 22%',
      positive: true,
      barWidth: '68%',
      barColor: 'bg-[#6366f1]', // Deep Indigo/Purple
      icon: SparklesIcon,
    },
    {
      id: 'yearly_pro',
      name: 'Langganan Pro Tahunan',
      sublabel: 'Diskon 2 Bulan Gratis',
      amount: 'Rp 32,4 jt',
      change: '↑ 14%',
      positive: true,
      barWidth: '45%',
      barColor: 'bg-[#818cf8]', // Medium Indigo/Purple
      icon: CreditCardIcon,
    },
    {
      id: 'custom_domain',
      name: 'Add-on Domain Kustom',
      sublabel: 'DNS & SSL Let\'s Encrypt',
      amount: 'Rp 24,9 jt',
      change: '↑ 9%',
      positive: true,
      barWidth: '35%',
      barColor: 'bg-[#a5b4fc]', // Soft Lavender
      icon: GlobeIcon,
    },
    {
      id: 'whatsapp_leads',
      name: 'WhatsApp & Leads Booster',
      sublabel: 'Email & Instant WA Order',
      amount: 'Rp 12,8 jt',
      change: '↑ 31%',
      positive: true,
      barWidth: '22%',
      barColor: 'bg-[#84cc16]', // Vibrant Lime
      icon: MessageCircleIcon,
    },
    {
      id: 'pixel_retail',
      name: 'Integrasi Pixel & Analytics',
      sublabel: 'Meta Pixel & Google Tag',
      amount: 'Rp 11,1 jt',
      change: '↓ 3%',
      positive: false,
      barWidth: '16%',
      barColor: 'bg-[#bef264]', // Pastel Lime
      icon: ShoppingBagIcon,
    },
  ];

  const categories = (propCategories && propCategories.length > 0)
    ? propCategories.map((c) => ({
        ...c,
        icon: ICON_MAP[c.id] || SparklesIcon,
        barWidth: c.barWidth || c.bar_width || '40%',
        barColor: c.barColor || c.bar_color || 'bg-[#6366f1]',
      }))
    : defaultCategories;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Pendapatan Berdasarkan Kategori</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {summaryNote || 'Langganan Pro Bulanan menyumbang 43% dari total omzet platform'}
          </p>
        </div>
        <button
          type="button"
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          title="Sembunyikan bagian"
        >
          <MinusIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category List */}
      <div className="divide-y divide-slate-50 py-1 space-y-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className="pt-3 first:pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              {/* Category Name & Icon + Mobile Amount */}
              <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0 sm:min-w-[190px]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-slate-800 block truncate">{cat.name}</span>
                  </div>
                </div>

                {/* Mobile Amount & Change Badge */}
                <div className="flex sm:hidden items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-900 font-mono">{cat.amount}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      cat.positive
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/70'
                        : 'text-rose-700 bg-rose-50 border border-rose-200/70'
                    }`}
                  >
                    {cat.change}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container: full width on mobile, inline on sm+ */}
              <div className="w-full sm:flex-1 sm:max-w-[240px] bg-slate-100/80 h-2 sm:h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cat.barColor}`}
                  style={{ width: cat.barWidth }}
                />
              </div>

              {/* Amount & Change Badge on Desktop (sm+) */}
              <div className="hidden sm:flex items-center justify-end gap-3 min-w-[110px] text-right">
                <span className="text-xs font-bold text-slate-900 font-mono">{cat.amount}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    cat.positive
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/70'
                      : 'text-rose-700 bg-rose-50 border border-rose-200/70'
                  }`}
                >
                  {cat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
