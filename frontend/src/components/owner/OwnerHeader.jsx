import React from 'react';
import { MessageCircleIcon, BellIcon } from '../Icons';

const TAB_CONFIG = {
  dashboard: {
    title: 'Dashboard',
    subtitle: null,
  },
  links: {
    title: 'Tautan & Blok Bio',
    subtitle: 'Kustomisasi profil bio, tautan promosi, pemisah, media sosial, dan tema desain',
  },
  analytics: {
    title: 'Analitik & Performa',
    subtitle: 'Pantau trafik pengunjung, rasio klik tautan, dan perilaku audiens',
  },
  domain: {
    title: 'Domain Kustom',
    subtitle: 'Hubungkan domain atau subdomain pribadi ke halaman bio Anda (Fitur Pro)',
  },
  leads: {
    title: 'Email Leads & Kontak',
    subtitle: 'Kumpulkan kontak prospek dan integrasi daftar email pengunjung (Fitur Pro)',
  },
  billing: {
    title: 'Langganan & Billing',
    subtitle: 'Kelola paket langganan Klikin, kuota aktif, dan riwayat faktur',
  },
  'page-settings': {
    title: 'Pengaturan Halaman',
    subtitle: 'Ubah username/slug, visibilitas, kata sandi, SEO, dan kode tracking',
  },
  notifications: {
    title: 'Notifikasi Akun',
    subtitle: 'Notifikasi in-app, email transaksional, dan preferensi pemberitahuan',
  },
  support: {
    title: 'Pusat Bantuan & Support',
    subtitle: 'Tiket bantuan 24/7, FAQ terpadu, formulir kontak, dan saran fitur',
  },
  settings: {
    title: 'Pengaturan Akun',
    subtitle: 'Kelola profil pengguna, keamanan kata sandi, dan preferensi akun',
  },
};

const FORMATTED_TODAY = new Date().toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default function OwnerHeader({
  user,
  activeTab = 'dashboard',
  onToggleMobileSidebar,
  onSelectTab,
  unreadCount = 2,
}) {
  const tabInfo = TAB_CONFIG[activeTab] || TAB_CONFIG.dashboard;
  const subtitle = tabInfo.subtitle || FORMATTED_TODAY;

  return (
    <header className="flex items-center justify-between pb-5 sm:pb-6 border-b border-slate-100 mb-6">
      {/* Page Title & Mobile Hamburger Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="md:hidden w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 transition-colors shadow-2xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {tabInfo.title}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Quick Action Buttons & Profile Badge */}
      <div className="flex items-center gap-3">
        {/* Support / Message Button */}
        <button
          type="button"
          onClick={() => onSelectTab?.('support')}
          aria-label="Pusat Bantuan & Tiket"
          title="Pusat Bantuan & Tiket Support"
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors shadow-2xs ${
            activeTab === 'support'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-600'
          }`}
        >
          <MessageCircleIcon className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => onSelectTab?.('notifications')}
          aria-label="Notifikasi Akun"
          title="Notifikasi Akun & Riwayat Email"
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors shadow-2xs relative ${
            activeTab === 'notifications'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200/60 text-slate-600'
          }`}
        >
          <BellIcon className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 border-2 border-white text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white border border-slate-700 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <span className="text-[11px] font-bold tracking-wider">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'K'}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {user?.full_name || user?.name || (user?.username ? `@${user.username}` : 'Pemilik Akun')}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              {user?.is_pro ? 'Klikin Pro' : 'Paket Free'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
