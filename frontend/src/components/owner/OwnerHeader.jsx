import React from 'react';
import { MessageCircleIcon, BellIcon } from '../Icons';

export default function OwnerHeader({ user }) {
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
      {/* Page Title & Date */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{formattedDate}</p>
      </div>

      {/* Quick Action Buttons & Profile Badge */}
      <div className="flex items-center gap-3">
        {/* Message Button */}
        <button
          type="button"
          aria-label="Messages"
          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
        >
          <MessageCircleIcon className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 transition-colors shadow-2xs relative"
        >
          <BellIcon className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border border-white" />
        </button>

        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 via-rose-200 to-indigo-200 border border-slate-200 flex items-center justify-center shadow-2xs overflow-hidden shrink-0">
            <span className="text-[11px] font-bold text-slate-800">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-slate-800 leading-tight">
              {user?.full_name || 'Nora Watson'}
            </h4>
            <p className="text-[10px] text-slate-400 leading-tight">
              {user?.role === 'ACCOUNT_OWNER' ? 'Store Owner' : 'Sales Manager'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
