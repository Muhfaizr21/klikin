import React, { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'Apakah saya bisa memakai domain sendiri seperti links.namabrand.com?',
    a: 'Bisa. Pada paket Pro, Anda dapat menghubungkan domain atau subdomain milik Anda sendiri. Kami menyediakan instruksi pengaturan DNS CNAME yang sederhana beserta sertifikat keamanan SSL gratis otomatis.',
  },
  {
    q: 'Bagaimana cara kerja tombol WhatsApp langsung?',
    a: 'Saat menambahkan tombol WhatsApp, Anda cukup mengisi nomor telepon bisnis dan template pesan pembuka. Saat pengunjung mengetuk tombol, aplikasi WhatsApp di ponsel mereka akan langsung terbuka dengan pesan yang siap dikirim.',
  },
  {
    q: 'Apakah ada batasan jumlah link yang bisa saya pasang di paket Free?',
    a: 'Tidak ada batasan jumlah link pada paket Free. Anda bisa menambahkan tautan toko online, media sosial, katalog, atau video sebanyak yang Anda perlukan.',
  },
  {
    q: 'Apakah halaman Klikin cepat dimuat di koneksi seluler?',
    a: 'Halaman publik Klikin dioptimalkan secara ketat agar memiliki ukuran file minimal. Waktu muat halaman publik rata-rata di bawah 1 detik bahkan pada jaringan seluler 4G/3G standar.',
  },
  {
    q: 'Apakah saya bisa berhenti berlangganan Pro sewaktu-waktu?',
    a: 'Tentu. Anda dapat membatalkan langganan kapan saja melalui menu pengaturan akun tanpa denda. Fitur Pro Anda akan tetap aktif hingga akhir masa periode tagihan berjalan.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 border-t border-[var(--color-graphite)]">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-[510] text-[var(--color-paper)] tracking-tight mb-2">
            Jawaban untuk keraguan Anda.
          </h2>
          <p className="text-[var(--color-mist)] text-sm sm:text-base">
            Pertanyaan teknis dan panduan penggunaan yang paling sering ditanyakan oleh kreator baru.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="pro-card p-5 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between text-left gap-4 group"
                >
                  <span className={`text-[15px] font-[510] transition-colors ${
                    isOpen ? 'text-white' : 'text-[var(--color-mist)] group-hover:text-white'
                  }`}>
                    {item.q}
                  </span>
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border text-xs font-mono transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-45 bg-[var(--color-obsidian)] border-[var(--color-smoke)] text-white'
                        : 'border-[var(--color-graphite)] text-[var(--color-fog)] group-hover:border-zinc-700'
                    }`}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-graphite)] text-sm text-[var(--color-fog)] leading-relaxed animate-in fade-in duration-150">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
