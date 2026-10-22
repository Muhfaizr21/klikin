import React from 'react';
import Logo from '../Logo';
import {
  GridIcon,
  LinkIcon,
  BarChartIcon,
  GlobeIcon,
  MailIcon,
  CreditCardIcon,
  SettingsIcon,
  LogOutIcon,
  SlidersIcon,
  BellIcon,
  LifeBuoyIcon,
} from '../Icons';

/**
 * OwnerSidebar - Aligned with Klikin Product Architecture (readme.md Section 4: Account Owner)
 * Core Modules:
 * - 4.1 Onboarding & Pengaturan Akun
 * - 4.2 Editor Halaman Bio
 * - 4.3 Manajemen Link & 4.4 Blok Khusus
 * - 4.5 Analitik Halaman Sendiri
 * - 4.6 Domain Kustom (Pro)
 * - 4.7 Langganan & Billing
 * - 4.8 Email Capture (Pro)
 * - 4.9 Pengaturan Halaman
 * - 4.10 Notifikasi User
 * - 4.11 Support (Sisi User)
 */
export default function OwnerSidebar({
  user,
  onLogout,
  activeTab = 'dashboard',
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
  unreadCount = 2,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
    { id: 'links', label: 'Tautan & Blok', icon: LinkIcon },
    { id: 'analytics', label: 'Analitik Klik', icon: BarChartIcon },
    { id: 'domain', label: 'Domain Kustom', icon: GlobeIcon, isPro: true },
    { id: 'leads', label: 'Email Leads', icon: MailIcon, isPro: true },
    { id: 'billing', label: 'Langganan & Billing', icon: CreditCardIcon },
    { id: 'page-settings', label: 'Pengaturan Halaman', icon: SlidersIcon },
    { id: 'notifications', label: 'Notifikasi Akun', icon: BellIcon, badgeCount: unreadCount },
    { id: 'support', label: 'Pusat Bantuan', icon: LifeBuoyIcon },
    { id: 'settings', label: 'Pengaturan Akun', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar: Slide-over Drawer on Mobile, Fixed Docked Sidebar on Desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-60 lg:w-64 bg-white border-r border-slate-100 p-5 lg:p-6 flex flex-col justify-between h-full select-none shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header & Navigation List */}
        <div className="overflow-y-auto pr-1 -mr-1">
          {/* Brand Logo & Close Button for Mobile */}
          <div className="flex items-center justify-between mb-7 px-2">
            <Logo size={26} textClassName="text-[17px] font-bold text-slate-900" />
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="md:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation List */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab?.(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                  }`}
                >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badgeCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-slate-900' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
                {item.isPro && (
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/20'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="pt-5 border-t border-slate-100 mt-4">
        <div className="flex items-center gap-3 px-1 mb-2.5">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
            <span className="text-xs font-bold tracking-wider">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'K'}
            </span>
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {user?.full_name || user?.name || (user?.username ? `@${user.username}` : 'Kopi Seduh')}
            </h4>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {user?.username ? `@${user.username}` : (user?.is_pro ? 'Klikin Pro' : 'Paket Free')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOutIcon className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
    </>
  );
}
