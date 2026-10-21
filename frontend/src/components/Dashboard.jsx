import React from 'react';
import SuperAdminDashboard from './admin/SuperAdminDashboard';
import OwnerDashboard from './owner/OwnerDashboard';

/**
 * Dashboard Component - Acts as a Clean Architecture Router/Facade
 * Separates SuperAdmin domain (components/admin/) and Owner domain (components/owner/).
 */
export default function Dashboard({ user, token, onLogout, onBackToHome }) {
  if (user?.role === 'SUPER_ADMIN') {
    return (
      <SuperAdminDashboard
        user={user}
        token={token}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
      />
    );
  }

  return (
    <OwnerDashboard
      user={user}
      token={token}
      onLogout={onLogout}
      onBackToHome={onBackToHome}
    />
  );
}
