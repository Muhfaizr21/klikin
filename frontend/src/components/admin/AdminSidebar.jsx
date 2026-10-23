import React from 'react';
import Logo from '../Logo';
import {
  GridIcon,
  BarChartIcon,
  UsersIcon,
  CreditCardIcon,
  ShieldAlertIcon,
  GlobeIcon,
  TrendingUpIcon,
  MessageCircleIcon,
  LockIcon,
  SettingsIcon,
  LogOutIcon,
  SparklesIcon,
} from '../Icons';

export default function AdminSidebar({
  user,
  activeTab = 'reports',
  onSelectTab,
  onLogout,
  userCount = 0,
  mobileOpen = false,
  onCloseMobile,
}) {
  // 10 Modul Super Admin diurutkan dari yang paling penting (operasional harian) ke yang paling jarang disentuh
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: GridIcon },
    { id: 'reports', label: 'Analitik Platform', icon: BarChartIcon },
    { id: 'users', label: 'Manajemen User', icon: UsersIcon, badge: userCount || '19' },
    { id: 'subscriptions', label: 'Manajemen Langganan', icon: CreditCardIcon },
    { id: 'moderation', label: 'Moderasi Konten', icon: ShieldAlertIcon, badge: '2 Flag', badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'domains', label: 'Domain Kustom', icon: GlobeIcon, badge: '4' },
    { id: 'finance', label: 'Keuangan & MRR', icon: TrendingUpIcon },
    { id: 'support', label: 'Support & Komunikasi', icon: MessageCircleIcon, badge: 'Baru', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'security', label: 'Audit & Keamanan', icon: LockIcon },
    { id: 'settings', label: 'Pengaturan Platform', icon: SettingsIcon },
  ];

  // Helper untuk mencocokkan tab aktif termasuk alias
  const isTabActive = (itemId) => {
    if (activeTab === itemId) return true;
    if (itemId === 'overview' && (activeTab === 'overview' || activeTab === 'dashboard' || !activeTab)) return true;
    if (itemId === 'reports' && activeTab === 'analytics') return true;
    if (itemId === 'users' && activeTab === 'directory') return true;
    if (itemId === 'subscriptions' && activeTab === 'billing') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar: Slide-over Drawer on Mobile (< lg), Sticky Sidebar on Desktop (lg+) */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-72 bg-white flex flex-col justify-between select-none shrink-0 border-r border-slate-200/80 p-5 sm:p-6 h-screen overflow-y-auto scrollbar-none shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          {/* Brand Logo & Mobile Close Button */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Logo size={28} textClassName="text-[18px] font-bold tracking-tight text-slate-900" />
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono tracking-wider">
                Admin
              </span>
            </div>

            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup Menu"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Daftar Menu Tunggal (Tanpa Header Kategori) Urut Prioritas */}
          <nav className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isTabActive(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab?.(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-[#ede9fe] text-[#5b21b6] font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#5b21b6]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.badgeColor
                          ? item.badgeColor
                          : active
                          ? 'bg-[#5b21b6] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Flow Assist Callout Card */}
          <div className="bg-[#f0fdf4] border border-[#d9f99d] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
              <SparklesIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Flow Assist</span>
            </div>
            <p className="text-[11px] text-emerald-900/80 leading-relaxed font-medium">
              2 laporan moderasi baru memerlukan tinjauan segera.
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectTab?.('moderation');
                onCloseMobile?.();
              }}
              className="w-full bg-white hover:bg-emerald-50/60 active:scale-[0.98] text-slate-900 border border-emerald-200/80 text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-2xs transition-all text-center cursor-pointer"
            >
              Review Konten
            </button>
          </div>
        </div>

        {/* Admin Profile Footer */}
        <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                {user?.full_name || 'Super Administrator'}
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate">Founder & Lead Admin</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Keluar dari sesi Super Admin"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
