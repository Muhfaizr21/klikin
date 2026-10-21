import React from 'react';
import Logo from './Logo';

export default function Footer({ onNavigateToAuth }) {
  return (
    <footer className="border-t border-[var(--color-graphite)] bg-[var(--color-void)] pt-16 pb-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
          {/* Brand & mission */}
          <div className="max-w-sm">
            <div className="mb-3">
              <Logo size={28} textClassName="text-lg" />
            </div>
            <p className="text-sm text-[var(--color-fog)] leading-relaxed mb-4">
              Platform Link-in-Bio terjangkau untuk influencer, toko online, dan kreator konten Indonesia. Satu URL cepat untuk semua peluang bisnis Anda.
            </p>
            <div className="text-xs font-mono text-[var(--color-ash)]">
              Uptime platform 99.9%
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex gap-12 sm:gap-16 flex-wrap text-sm">
            <div>
              <div className="font-[510] text-white mb-3 text-xs uppercase tracking-wider font-mono">
                Navigasi
              </div>
              <ul className="space-y-2 text-[var(--color-fog)]">
                <li>
                  <a href="#solusi" className="hover:text-white transition-colors">
                    Masalah & Solusi
                  </a>
                </li>
                <li>
                  <a href="#fitur" className="hover:text-white transition-colors">
                    Fitur Utama
                  </a>
                </li>
                <li>
                  <a href="#harga" className="hover:text-white transition-colors">
                    Paket & Harga
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Pertanyaan Umum
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-[510] text-white mb-3 text-xs uppercase tracking-wider font-mono">
                Akun & Bantuan
              </div>
              <ul className="space-y-2 text-[var(--color-fog)]">
                <li>
                  <a
                    href="#register"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateToAuth?.('register');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Daftar Akun Baru
                  </a>
                </li>
                <li>
                  <a
                    href="#login"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateToAuth?.('login');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Masuk ke Akun
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Bantuan WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[var(--color-graphite)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-ash)] font-mono">
          <div>
            © 2026 Klikin. Hak cipta dilindungi undang-undang.
          </div>
          <div className="flex gap-6">
            <span className="hover:text-zinc-400 cursor-pointer">Ketentuan Layanan</span>
            <span className="hover:text-zinc-400 cursor-pointer">Kebijakan Privasi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
