import React from 'react';
import Logo from '../Logo';
import {
  GridIcon,
  LayersIcon,
  CreditCardIcon,
  UsersIcon,
  BarChartIcon,
  SettingsIcon,
  LogOutIcon,
} from '../Icons';

export default function OwnerSidebar({ user, onLogout, activeTab = 'dashboard', onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
    { id: 'statistics', label: 'Statistics', icon: LayersIcon },
    { id: 'transaction', label: 'Transaction', icon: CreditCardIcon },
    { id: 'team', label: 'My Team', icon: UsersIcon },
    { id: 'reports', label: 'Sell Reports', icon: BarChartIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-60 lg:w-64 shrink-0 bg-white border-r border-slate-100 p-6 flex flex-col justify-between h-full select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-8 px-2">
          <Logo size={26} textClassName="text-[17px] font-bold text-slate-900" />
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
                onClick={() => onSelectTab?.(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#d9f99d] text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 via-rose-100 to-indigo-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xs font-bold text-slate-700">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'O'}
            </span>
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {user?.full_name || 'Nora Watson'}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.role === 'ACCOUNT_OWNER' ? 'Store Owner' : 'Sales Manager'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOutIcon className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
