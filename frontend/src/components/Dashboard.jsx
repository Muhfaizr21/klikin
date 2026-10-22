import React, { useState, useEffect, Suspense, lazy } from 'react';

const SuperAdminDashboard = lazy(() => import('./admin/SuperAdminDashboard'));
const OwnerDashboard = lazy(() => import('./owner/OwnerDashboard'));

/**
 * Dashboard Component - Acts as a Clean Architecture Router/Facade
 * Separates SuperAdmin domain (components/admin/) and Owner domain (components/owner/).
 * Includes global Impersonation Exit Bar when an admin is logged in as a tenant.
 */
export default function Dashboard({ user, token, onLogout, onBackToHome, initialTab }) {
  const [impersonatingAdmin, setImpersonatingAdmin] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('klikin_impersonating_admin');
      if (saved) {
        setImpersonatingAdmin(JSON.parse(saved));
      }
    } catch {
      setImpersonatingAdmin(null);
    }
  }, [user]);

  const handleExitImpersonation = () => {
    if (impersonatingAdmin) {
      localStorage.setItem('klikin_token', impersonatingAdmin.token);
      localStorage.setItem('klikin_user', JSON.stringify(impersonatingAdmin.user));
      localStorage.removeItem('klikin_impersonating_admin');
      window.location.href = '/admin/users';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Impersonation Banner */}
      {impersonatingAdmin && (
        <div className="bg-indigo-900 text-white px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">Mode Impersonasi Aktif:</span>
            <span className="text-indigo-200">
              Anda sedang mengelola akun <strong>@{user?.username}</strong> ({user?.email}) sebagai Super Administrator.
            </span>
          </div>
          <button
            type="button"
            onClick={handleExitImpersonation}
            className="px-3 py-1 rounded-lg bg-white text-indigo-950 font-bold hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer text-[11px] shrink-0"
          >
            ← Kembali ke Super Admin
          </button>
        </div>
      )}

      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[60vh]">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
              <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
              <span>Memuat ruang kerja...</span>
            </div>
          </div>
        }
      >
        {user?.role === 'SUPER_ADMIN' ? (
          <SuperAdminDashboard
            user={user}
            token={token}
            onLogout={onLogout}
            onBackToHome={onBackToHome}
            initialTab={(!initialTab || initialTab === 'dashboard' || initialTab === 'index') ? 'overview' : initialTab}
          />
        ) : (
          <OwnerDashboard
            user={user}
            token={token}
            onLogout={onLogout}
            onBackToHome={onBackToHome}
            initialTab={initialTab}
          />
        )}
      </Suspense>
    </div>
  );
}
