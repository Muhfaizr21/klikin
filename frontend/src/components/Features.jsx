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
    <section id="fitur" className="py-24 border-t border-[var(--color-graphite)] bg-[var(--color-void)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-[var(--color-mist)] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-acid-lime)]" />
            <span>Fungsionalitas Inti</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-[510] text-[var(--color-paper)] tracking-tight mb-3">
            Setiap fitur dirancang untuk kemudahan dan konversi.
          </h2>
          <p className="text-[var(--color-fog)] text-base leading-relaxed">
            Tanpa menu rumit. Seluruh instrumen difokuskan agar pengunjung halaman bio Anda segera melakukan transaksi dengan percaya diri.
          </p>
        </div>

        {/* Precision Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1: WhatsApp CTA with interactive template test */}
          <div className="pro-card p-6 sm:p-7 flex flex-col justify-between group hover:border-[var(--color-smoke)] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[var(--color-mist)] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                  01 / WhatsApp Direct
                </span>
                <span className="text-xs text-[var(--color-fog)] font-mono">Format Otomatis</span>
              </div>
              <h3 className="text-xl font-[510] text-[var(--color-paper)] tracking-tight mb-2">
                Tombol WhatsApp langsung ke chat dengan template siap kirim
              </h3>
              <p className="text-sm text-[var(--color-fog)] leading-relaxed mb-5">
                Pengunjung tidak perlu mengetik dari awal. Pasang pesan pembuka dinamis sehingga staf kasir atau admin Anda langsung mengetahui produk yang diminati pembeli.
              </p>

              {/* Interactive Mini WhatsApp Sandbox */}
              <div className="p-3.5 rounded-lg bg-[var(--color-obsidian)] border border-[var(--color-graphite)] mb-4">
                <div className="text-[11px] font-mono text-[var(--color-mist)] mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Template Pesan Pembeli:</span>
                  </span>
                  <span className="text-[10px] text-[var(--color-ash)]">Uji Langsung</span>
                </div>
                <input
                  type="text"
                  value={waText}
                  onChange={(e) => setWaText(e.target.value)}
                  className="w-full bg-black/50 border border-[var(--color-graphite)] rounded px-3 py-2 text-xs text-[var(--color-paper)] focus:outline-none focus:border-[var(--color-ash)] font-mono"
                  placeholder="Ketik format pesan WhatsApp..."
                />
                <div className="mt-2.5 flex justify-end">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white text-black text-xs font-medium hover:bg-[var(--color-bone)] transition-colors shadow-sm"
                  >
                    <MessageCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Test Buka WhatsApp</span>
                    <ExternalLinkIcon className="w-3 h-3 text-zinc-500" />
                  </a>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--color-ash)] pt-3.5 border-t border-[var(--color-graphite)]">
              Meningkatkan rasio chat masuk hingga 3x lipat dibanding nomor kosong tanpa teks awal.
            </div>
          </div>

          {/* Feature 2: Analytics & Traffic Breakdown */}
          <div className="pro-card p-6 sm:p-7 flex flex-col justify-between group hover:border-[var(--color-smoke)] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[var(--color-mist)] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                  02 / Analitik Terukur
                </span>
                <span className="text-xs text-[var(--color-fog)] font-mono">Agregasi SQL Sub-50ms</span>
              </div>
              <h3 className="text-xl font-[510] text-[var(--color-paper)] tracking-tight mb-2">
                Ketahui sumber trafik dan produk yang paling diminati
              </h3>
              <p className="text-sm text-[var(--color-fog)] leading-relaxed mb-5">
                Pantau tautan yang paling sering diklik, perbandingan kanal rujukan (Instagram, TikTok, WhatsApp), dan tipe perangkat secara akurat tanpa pembengkakan memori.
              </p>

              {/* Refined Metric Breakdown (Monochrome + Single Accent) */}
              <div className="p-3.5 rounded-lg bg-[var(--color-obsidian)] border border-[var(--color-graphite)] mb-4">
                <div className="flex justify-between items-center text-xs font-mono mb-2.5 text-[var(--color-fog)]">
                  <span>Distribusi Kunjungan Mingguan</span>
                  <span className="text-[var(--color-paper)] font-medium">2.840 Sesi</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-[var(--color-mist)]">Instagram Bio & Stories</span>
                      <span className="text-[var(--color-paper)] font-semibold">62%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-acid-lime)] rounded-full w-[62%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-[var(--color-fog)]">TikTok Videos</span>
                      <span className="text-[var(--color-mist)]">26%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-white/50 rounded-full w-[26%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-[var(--color-fog)]">WhatsApp & Referral Langsung</span>
                      <span className="text-[var(--color-mist)]">12%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-white/20 rounded-full w-[12%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--color-ash)] pt-3.5 border-t border-[var(--color-graphite)]">
              Mencakup segmentasi kota pengunjung dan filter rentang waktu 7, 30, atau 90 hari.
            </div>
          </div>

          {/* Feature 3: Custom Domain with verification simulator */}
          <div className="pro-card p-6 sm:p-7 flex flex-col justify-between group hover:border-[var(--color-smoke)] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[var(--color-mist)] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                  03 / Branding Profesional
                </span>
                <span className="text-xs text-[var(--color-fog)] font-mono">Paket Pro</span>
              </div>
              <h3 className="text-xl font-[510] text-[var(--color-paper)] tracking-tight mb-2">
                Gunakan domain nama brand Anda sendiri
              </h3>
              <p className="text-sm text-[var(--color-fog)] leading-relaxed mb-5">
                Tingkatkan kredibilitas bisnis dengan domain kustom seperti links.brandkamu.com tanpa embel-embel nama platform lain di depan calon pelanggan.
              </p>

              {/* Interactive Domain Check Simulator */}
              <div className="p-3.5 rounded-lg bg-[var(--color-obsidian)] border border-[var(--color-graphite)] mb-4">
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
                    className="flex-1 bg-black/50 border border-[var(--color-graphite)] rounded px-3 py-1.5 text-xs text-[var(--color-paper)] focus:outline-none focus:border-[var(--color-ash)] font-mono"
                    placeholder="contoh: links.namatoko.com"
                  />
                  <button
                    type="button"
                    onClick={() => setDomainChecked(true)}
                    className="px-3 py-1.5 rounded bg-white/[0.08] hover:bg-white/[0.12] text-xs font-mono text-white border border-white/[0.1] transition-colors"
                  >
                    Periksa DNS
                  </button>
                </div>
                {domainChecked && (
                  <div className="mt-2.5 p-2 rounded bg-black/60 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Record CNAME Valid: SSL Aktif Otomatis</span>
                    </span>
                    <span className="text-[var(--color-ash)] text-[10px]">200 OK</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--color-ash)] pt-3.5 border-t border-[var(--color-graphite)]">
              Panduan integrasi DNS otomatis dan enkripsi sertifikat SSL tanpa biaya server tambahan.
            </div>
          </div>

          {/* Feature 4: Drag and Drop block visualizer */}
          <div className="pro-card p-6 sm:p-7 flex flex-col justify-between group hover:border-[var(--color-smoke)] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-[var(--color-mist)] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                  04 / Editor Intuitif
                </span>
                <span className="text-xs text-[var(--color-fog)] font-mono">Modular Blocks</span>
              </div>
              <h3 className="text-xl font-[510] text-[var(--color-paper)] tracking-tight mb-2">
                Editor blok visual yang rapi dan mudah digeser
              </h3>
              <p className="text-sm text-[var(--color-fog)] leading-relaxed mb-5">
                Susun tautan produk, pembatas garis, hingga formulir penangkap leads semudah menggeser kartu. Hasil perubahan langsung terlihat di pratinjau ponsel secara real-time.
              </p>

              {/* Refined Monochromatic Block Stack */}
              <div className="space-y-2 mb-4">
                <div className="p-2.5 rounded-md bg-[var(--color-obsidian)] border border-[var(--color-graphite)] flex items-center justify-between text-xs text-[var(--color-mist)]">
                  <div className="flex items-center gap-2.5">
                    <GripVerticalIcon className="text-[var(--color-ash)] w-3.5 h-3.5" />
                    <ShoppingBagIcon className="w-3.5 h-3.5 text-white" />
                    <span>Blok Tautan: Katalog Produk & Promo</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Aktif
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-[var(--color-obsidian)] border border-[var(--color-graphite)] flex items-center justify-between text-xs text-[var(--color-mist)]">
                  <div className="flex items-center gap-2.5">
                    <GripVerticalIcon className="text-[var(--color-ash)] w-3.5 h-3.5" />
                    <MessageCircleIcon className="w-3.5 h-3.5 text-white" />
                    <span>Blok WhatsApp: Tanya Stok Barang</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Aktif
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-[var(--color-obsidian)] border border-[var(--color-graphite)] flex items-center justify-between text-xs text-[var(--color-mist)]">
                  <div className="flex items-center gap-2.5">
                    <GripVerticalIcon className="text-[var(--color-ash)] w-3.5 h-3.5" />
                    <PlayCircleIcon className="w-3.5 h-3.5 text-white" />
                    <span>Blok Embed: Video Unboxing Terbaru</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Aktif
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--color-ash)] pt-3.5 border-t border-[var(--color-graphite)]">
              Dapat menonaktifkan atau mengurutkan link secara instan tanpa perlu menghapus data.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
