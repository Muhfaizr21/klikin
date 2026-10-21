import React from 'react';
import { CheckIcon, XIcon } from './Icons';

const COMPARISON_ITEMS = [
  {
    problemTitle: 'Bio Medsos Terbatas 1 Tautan',
    problem: 'Instagram dan TikTok membatasi bio hanya 1 link, membuat kreator bingung memilih antara link Shopee, WhatsApp, atau portofolio.',
    solutionTitle: 'Satu Gerbang Multi-Kanal',
    solution: 'Klikin merangkum semua link bisnis Anda dalam satu URL elegan. Pengunjung bebas memilih channel transaksi yang mereka sukai.',
  },
  {
    problemTitle: 'Langganan Luar Negeri Mahal',
    problem: 'Platform seperti Linktree mematok tagihan dolar bulanan ($5 - $9) yang memberatkan anggaran UMKM dan kreator pemula lokal.',
    solutionTitle: 'Biaya Lokal Ramah Dompet',
    solution: 'Paket Pro Klikin hanya Rp29.000 per bulan. Metode pembayaran lokal mudah menggunakan QRIS, e-wallet, atau transfer bank.',
  },
  {
    problemTitle: 'Tampilan Kaku & Seragam',
    problem: 'Halaman bio kompetitor terlihat monoton, bertumpuk teks biasa tanpa kepribadian brand yang kuat.',
    solutionTitle: 'Kustomisasi Brand Profesional',
    solution: 'Editor visual dengan tema dinamis, palet warna fleksibel, dan dukungan domain bisnis sendiri (links.brandkamu.com).',
  },
  {
    problemTitle: 'Buta Data Sumber Trafik',
    problem: 'Tidak mengetahui link mana yang paling banyak menghasilkan penjualan dan jam berapa pengunjung paling aktif.',
    solutionTitle: 'Analitik Klik Akurat',
    solution: 'Pantau grafik klik harian, perbandingan platform asal (IG vs TikTok), hingga tipe perangkat secara transparan.',
  },
];

export default function ProblemSolution() {
  return (
    <section
      id="solusi"
      className="py-20 border-t border-[var(--color-graphite)] relative"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-[510] text-[var(--color-paper)] tracking-tight mb-3">
            Mengapa kreator beralih ke Klikin?
          </h2>
          <p className="text-[var(--color-mist)] text-base leading-relaxed">
            Menghapus friksi antara konten Anda di media sosial dengan closing penjualan di WhatsApp atau marketplace.
          </p>
        </div>

        {/* 4 Professional Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {COMPARISON_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="pro-card p-6 flex flex-col justify-between group hover:border-zinc-700"
            >
              {/* Problem Statement */}
              <div className="mb-6">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-coral-red)] mb-2">
                  <XIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{item.problemTitle}</span>
                </div>
                <p className="text-sm text-[var(--color-fog)] leading-relaxed">
                  {item.problem}
                </p>
              </div>

              {/* Solution Statement */}
              <div className="pt-4 border-t border-[var(--color-graphite)] group-hover:border-zinc-700/60 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-2">
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item.solutionTitle}</span>
                </div>
                <p className="text-sm text-white leading-relaxed font-normal">
                  {item.solution}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
