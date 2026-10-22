import React, { useState, useEffect } from 'react';
import Logo from './Logo';

export default function Navbar({ user, onNavigateToAuth, onNavigateToDashboard }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[var(--color-void)]/90 backdrop-blur-md border-b border-[var(--color-graphite)] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <a href="/" className="inline-flex items-center">
          <Logo size={28} textClassName="text-[17px]" />
        </a>

        {/* Right: Navigation Links + Action Buttons grouped on the RIGHT */}
        <div className="hidden md:flex items-center gap-7">
          <nav className="flex items-center gap-6 text-[13px] font-[400] text-[var(--color-mist)]">
            <a
              href="#solusi"
              className="hover:text-[var(--color-paper)] transition-colors duration-150"
            >
              Solusi
            </a>
            <a
              href="#fitur"
              className="hover:text-[var(--color-paper)] transition-colors duration-150"
            >
              Fitur
            </a>
            <a
              href="#harga"
              className="hover:text-[var(--color-paper)] transition-colors duration-150"
            >
              Harga
            </a>
            <a
              href="#faq"
              className="hover:text-[var(--color-paper)] transition-colors duration-150"
            >
              FAQ
            </a>
          </nav>

          <div className="h-4 w-[1px] bg-[var(--color-graphite)]" />

          <div className="flex items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="btn-pill-white text-xs py-1.5 px-4 shadow-[0_2px_8px_rgba(255,255,255,0.15)] flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dashboard ({user.role === 'SUPER_ADMIN' ? 'Admin' : 'Owner'})</span>
              </button>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateToAuth?.('login');
                  }}
                  className="btn-ghost-dark text-xs py-1.5 px-3"
                >
                  Login
                </a>
                <a
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateToAuth?.('register');
                  }}
                  className="btn-pill-white text-xs py-1.5 px-4 shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
                >
                  Coba Gratis
                </a>
              </>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Buka menu navigasi"
          className="md:hidden flex flex-col justify-center items-center gap-1.5 w-9 h-9 rounded-md bg-[var(--color-carbon)] border border-[var(--color-graphite)] text-[var(--color-mist)]"
        >
          <span
            className={`w-4 h-0.5 bg-current transition-transform duration-200 ${
              mobileMenuOpen ? 'rotate-45 translate-y-1' : ''
            }`}
          />
          <span
            className={`w-4 h-0.5 bg-current transition-opacity duration-200 ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-4 h-0.5 bg-current transition-transform duration-200 ${
              mobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--color-carbon)] border-b border-[var(--color-graphite)] px-6 py-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-3 text-sm text-[var(--color-mist)]">
            <a
              href="#solusi"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              Solusi
            </a>
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              Fitur
            </a>
            <a
              href="#harga"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              Harga
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white py-1"
            >
              FAQ
            </a>
          </nav>
          <div className="pt-3 border-t border-[var(--color-graphite)] flex flex-col gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToDashboard?.();
                }}
                className="btn-pill-white text-center py-2 text-xs flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dashboard ({user.role === 'SUPER_ADMIN' ? 'Admin' : 'Owner'})</span>
              </button>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    onNavigateToAuth?.('login');
                  }}
                  className="btn-ghost-dark text-center py-2"
                >
                  Login
                </a>
                <a
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    onNavigateToAuth?.('register');
                  }}
                  className="btn-acid text-center py-2"
                >
                  Coba Gratis
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
