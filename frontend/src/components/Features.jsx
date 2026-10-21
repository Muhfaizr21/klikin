import React, { useState } from 'react';
import {
  MessageCircleIcon,
  ExternalLinkIcon,
  ShoppingBagIcon,
  PlayCircleIcon,
  CheckIcon,
  GripVerticalIcon,
} from './Icons';

export default function Features() {
  const [waText, setWaText] = useState('Halo kak, saya mau order paket promo...');
  const [domainInput, setDomainInput] = useState('links.tokosaya.com');
  const [domainChecked, setDomainChecked] = useState(false);

  return (
    <section id="fitur" className="py-20 border-t border-[var(--color-graphite)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl sm:text-4xl font-[510] text-[var(--color-paper)] tracking-tight mb-3">
            Setiap fitur dirancang untuk kemudahan dan konversi.
          </h2>
          <p className="text-[var(--color-mist)] text-base leading-relaxed">
            Tidak ada fitur membingungkan. Semua alat difokuskan agar pengunjung bio Anda segera melakukan transaksi.
          </p>
        </div>

        {/* Dynamic Interactive Feature Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1: WhatsApp CTA with interactive template test */}
          <div className="pro-card p-6 sm:p-7 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  01 / WhatsApp Direct
                </span>
                <span className="text-xs text-[var(--color-fog)] font-mono">Format Otomatis</span>
              </div>
              <h3 className="text-xl font-[510] text-white tracking-tight mb-2">
                Tombol WhatsApp langsung ke chat dengan pesan terisi
              </h3>
              <p className="text-sm text-[var(--color-mist)] leading-relaxed mb-5">
                Pengunjung tidak perlu mengetik dari nol. Tentukan template teks pembuka sehingga staf atau kasir Anda langsung tahu produk apa yang diinginkan calon pembeli.
              </p>

              {/* Interactive Mini WhatsApp Sandbox */}
              <div className="p-3.5 rounded-lg bg-[#07130a] border border-emerald-900/50 mb-4">
                <div className="text-[11px] font-mono text-emerald-400 mb-1.5 flex items-center justify-between">
                  <span>Simulasi Pesan Pembuka:</span>
                  <span className="text-[10px] text-zinc-500">Live Preview</span>
                </div>
                <input
                  type="text"
                  value={waText}
                  onChange={(e) => setWaText(e.target.value)}
                  className="w-full bg-black/40 border border-emerald-800/40 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="Ketik template pesan WhatsApp..."
                />
                <div className="mt-2.5 flex justify-end">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500 text-black text-xs font-medium hover:bg-emerald-400 transition-colors"
                  >
                    <MessageCircleIcon className="w-3.5 h-3.5" />
                    <span>Test Buka WhatsApp</span>
                    <ExternalLinkIcon className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--color-fog)] pt-3 border-t border-[var(--color-graphite)]">
              Meningkatkan rasio chat masuk hingga 3x lipat dibanding nomor kosong.
            </div>
          </div>

          {/* Feature 2: Analytics & Traffic Breakdown */}
          <div className="pro-card p-6 sm:p-7 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[var(--color-acid-lime)] bg-[var(--color-acid-lime)]/10 px-2 py-0.5 rounded border border-[var(--color-acid-lime)]/20">
                  02 / Analitik Terukur
                </span>
                <span className="text-xs text-[var(--color-fog)] font-mono">Real-time Data</span>
              </div>
              <h3 className="text-xl font-[510] text-white tracking-tight mb-2">
                Ketahui sumber trafik dan produk yang paling diminati
              </h3>
              <p className="text-sm text-[var(--color-mist)] leading-relaxed mb-5">
                Pantau tautan mana yang paling sering diklik, dari platform mana pengunjung datang (Instagram, TikTok, WhatsApp), dan tipe perangkat mereka.
              </p>

              {/* Interactive Mini Analytics Visualizer */}
              <div className="p-3.5 rounded-lg bg-[var(--color-carbon)] border border-[var(--color-graphite)] mb-4">
                <div className="flex justify-between items-center text-xs font-mono mb-2 text-[var(--color-fog)]">
                  <span>Distribusi Trafik Minggu Ini</span>
                  <span className="text-white font-[510]">2.840 Kunjungan</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-[var(--color-mist)]">Instagram Stories & Bio</span>
                      <span className="font-mono text-white">62%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-[62%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-[var(--color-mist)]">TikTok Videos</span>
                      <span className="font-mono text-white">26%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full w-[26%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-[var(--color-mist)]">Direct & Chat WhatsApp</span>
                      <span className="font-mono text-white">12%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[12%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--color-fog)] pt-3 border-t border-[var(--color-graphite)]">
              Termasuk data lokasi kota dan filter periode 7, 30, atau 90 hari.
            </div>
          </div>

          {/* Feature 3: Custom Domain with verification simulator */}
          <div className="pro-card p-6 sm:p-7 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  03 / Branding Profesional
                </span>
                <span className="text-xs text-[var(--color-fog)] font-mono">Paket Pro</span>
              </div>
              <h3 className="text-xl font-[510] text-white tracking-tight mb-2">
                Gunakan domain nama brand Anda sendiri
              </h3>
              <p className="text-sm text-[var(--color-mist)] leading-relaxed mb-5">
                Tingkatkan kepercayaan pelanggan dengan alamat profesional seperti links.brandkamu.com tanpa embel-embel nama platform lain.
              </p>

              {/* Interactive Domain Check Simulator */}
              <div className="p-3.5 rounded-lg bg-[var(--color-carbon)] border border-[var(--color-graphite)] mb-4">
                <div className="text-[11px] font-mono text-[var(--color-fog)] mb-1.5">
                  Simulasi Hubungkan Domain:
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => {
                      setDomainInput(e.target.value);
                      setDomainChecked(false);
                    }}
                    className="flex-1 bg-black/40 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                    placeholder="contoh: links.namatoko.com"
                  />
                  <button
                    type="button"
                    onClick={() => setDomainChecked(true)}
                    className="btn-ghost-dark text-xs py-1 px-3"
                  >
                    Cek Status
                  </button>
                </div>
                {domainChecked && (
                  <div className="mt-2.5 p-2 rounded bg-black/50 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>CNAME Valid: SSL Aktif Otomatis</span>
                    </span>
                    <span className="text-zinc-400 text-[10px]">200 OK</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--color-fog)] pt-3 border-t border-[var(--color-graphite)]">
              Panduan DNS otomatis dan proteksi SSL terenkripsi tanpa biaya tambahan.
            </div>
          </div>

          {/* Feature 4: Drag and Drop block visualizer */}
          <div className="pro-card p-6 sm:p-7 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  04 / Editor Intuitif
                </span>
                <span className="text-xs text-[var(--color-fog)] font-mono">Modular Blocks</span>
              </div>
              <h3 className="text-xl font-[510] text-white tracking-tight mb-2">
                Editor blok visual yang rapi dan mudah digeser
              </h3>
              <p className="text-sm text-[var(--color-mist)] leading-relaxed mb-5">
                Susun tautan, judul seksi, pembatas garis, hingga formulir newsletter semudah menggeser kartu. Tampilan langsung terlihat di pratinjau ponsel secara real-time.
              </p>

              {/* Visual Block Stack with clean vector icons */}
              <div className="space-y-2 mb-4">
                <div className="p-2.5 rounded bg-[var(--color-carbon)] border border-white/10 flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <GripVerticalIcon className="text-[var(--color-fog)]" />
                    <ShoppingBagIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Blok Tautan: Katalog Shopee Diskon</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px]">Aktif</span>
                </div>
                <div className="p-2.5 rounded bg-[var(--color-carbon)] border border-white/10 flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <GripVerticalIcon className="text-[var(--color-fog)]" />
                    <MessageCircleIcon className="w-3.5 h-3.5 text-[var(--color-acid-lime)]" />
                    <span>Blok WhatsApp: Tanya Stok Barang</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px]">Aktif</span>
                </div>
                <div className="p-2.5 rounded bg-[var(--color-carbon)] border border-white/10 flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <GripVerticalIcon className="text-[var(--color-fog)]" />
                    <PlayCircleIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Blok Embed: Video Unboxing Terbaru</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px]">Aktif</span>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--color-fog)] pt-3 border-t border-[var(--color-graphite)]">
              Dapat mengaktifkan atau menonaktifkan link tanpa perlu menghapusnya.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
