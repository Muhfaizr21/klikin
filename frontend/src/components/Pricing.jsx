import React, { useState } from 'react';
import { CheckIcon, XIcon } from './Icons';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  const proPrice = billingCycle === 'annual' ? 'Rp24.100' : 'Rp29.000';
  const proSubtext =
    billingCycle === 'annual'
      ? 'Ditagih Rp290.000 per tahun (hemat 2 bulan biaya)'
      : 'Ditagih bulanan, dapat dibatalkan kapan saja';

  return (
    <section id="harga" className="py-20 border-t border-[var(--color-graphite)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl sm:text-4xl font-[510] text-[var(--color-paper)] tracking-tight mb-3">
            Harga transparan, tanpa biaya tersembunyi.
          </h2>
          <p className="text-[var(--color-mist)] text-base leading-relaxed">
            Mulai gratis sekarang. Upgrade ke Pro saat brand Anda membutuhkan domain profesional dan analisa konversi yang mendalam.
          </p>
        </div>

        {/* Interactive Billing Switcher */}
        <div className="inline-flex items-center p-1 bg-[var(--color-carbon)] border border-[var(--color-graphite)] rounded-lg mb-12">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-[var(--color-obsidian)] text-white shadow-sm border border-[var(--color-smoke)]'
                : 'text-[var(--color-fog)] hover:text-white'
            }`}
          >
            Tagihan Bulanan
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-[var(--color-obsidian)] text-white shadow-sm border border-[var(--color-smoke)]'
                : 'text-[var(--color-fog)] hover:text-white'
            }`}
          >
            <span>Tagihan Tahunan</span>
            <span className="text-emerald-400 text-[11px] font-mono">
              Hemat 17%
            </span>
          </button>
        </div>

        {/* 2 Honest Pricing Cards from readme.md */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Free Tier Card */}
          <div className="pro-card p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-[510] text-white">Paket Free</h3>
                <span className="text-xs font-mono text-[var(--color-fog)]">Rp0 Selamanya</span>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-[510] text-white font-mono">Rp0</span>
                  <span className="text-xs text-[var(--color-fog)]">/ bulan</span>
                </div>
                <p className="text-xs text-[var(--color-fog)] mt-2">
                  Cocok untuk kreator yang baru memulai dan ingin mengumpulkan tautan dasar.
                </p>
              </div>

              <div className="h-px w-full bg-[var(--color-graphite)] mb-6" />

              <ul className="space-y-3 mb-8">
                <li className="text-sm text-[var(--color-mist)] flex items-start gap-2.5">
                  <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tautan tanpa batas (katalog, sosmed, video)</span>
                </li>
                <li className="text-sm text-[var(--color-mist)] flex items-start gap-2.5">
                  <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Subdomain gratis <code className="font-mono text-xs text-white">klikin.id/username</code></span>
                </li>
                <li className="text-sm text-[var(--color-mist)] flex items-start gap-2.5">
                  <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>10 pilihan tema dasar</span>
                </li>
                <li className="text-sm text-[var(--color-mist)] flex items-start gap-2.5">
                  <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Analitik klik 7 hari terakhir</span>
                </li>
                <li className="text-sm text-[var(--color-ash)] flex items-start gap-2.5">
                  <XIcon className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>Watermark platform Klikin tetap ditampilkan</span>
                </li>
              </ul>
            </div>

            <a
              href="#claim"
              className="btn-ghost-dark w-full text-center py-2.5"
            >
              Mulai Gratis
            </a>
          </div>

          {/* Pro Tier Card (Featured) */}
          <div className="pro-card-featured p-8 flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-[510] text-white">Paket Pro</h3>
                <span className="text-xs font-mono text-[var(--color-acid-lime)]">
                  Pilihan Populer
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-[510] text-white font-mono">{proPrice}</span>
                  <span className="text-xs text-[var(--color-fog)]">/ bulan</span>
                </div>
                <p className="text-xs text-[var(--color-fog)] mt-2">
                  {proSubtext}
                </p>
              </div>

              <div className="h-px w-full bg-white/10 mb-6" />

              <ul className="space-y-3 mb-8">
                <li className="text-sm text-white flex items-start gap-2.5 font-normal">
                  <CheckIcon className="w-4 h-4 text-[var(--color-acid-lime)] shrink-0 mt-0.5" />
                  <span>Semua kapabilitas paket Free</span>
                </li>
                <li className="text-sm text-white flex items-start gap-2.5 font-normal">
                  <CheckIcon className="w-4 h-4 text-[var(--color-acid-lime)] shrink-0 mt-0.5" />
                  <span>Domain kustom sendiri (<code className="font-mono text-xs text-[var(--color-acid-lime)]">links.brandanda.com</code>)</span>
                </li>
                <li className="text-sm text-white flex items-start gap-2.5 font-normal">
                  <CheckIcon className="w-4 h-4 text-[var(--color-acid-lime)] shrink-0 mt-0.5" />
                  <span>Bebas watermark (hilangkan badge Klikin)</span>
                </li>
                <li className="text-sm text-white flex items-start gap-2.5 font-normal">
                  <CheckIcon className="w-4 h-4 text-[var(--color-acid-lime)] shrink-0 mt-0.5" />
                  <span>Analitik lengkap: sumber trafik, geo kota, dan tipe perangkat</span>
                </li>
                <li className="text-sm text-white flex items-start gap-2.5 font-normal">
                  <CheckIcon className="w-4 h-4 text-[var(--color-acid-lime)] shrink-0 mt-0.5" />
                  <span>Formulir pengumpulan email leads prospek</span>
                </li>
                <li className="text-sm text-white flex items-start gap-2.5 font-normal">
                  <CheckIcon className="w-4 h-4 text-[var(--color-acid-lime)] shrink-0 mt-0.5" />
                  <span>Penjadwalan link tayang otomatis</span>
                </li>
              </ul>
            </div>

            <a
              href="#claim"
              className="btn-acid w-full text-center py-2.5 shadow-[0_4px_16px_rgba(228,242,34,0.2)]"
            >
              Coba Pro 7 Hari Gratis
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
