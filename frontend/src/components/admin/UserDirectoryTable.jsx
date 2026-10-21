import React from 'react';

export default function UserDirectoryTable({ users = [] }) {
  return (
    <div className="bg-[var(--color-carbon)] border border-[var(--color-graphite)] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Direktori Pengguna Platform
          </h2>
          <p className="text-xs text-[var(--color-fog)] mt-0.5">
            Daftar seluruh akun Super Admin dan Owner Toko yang terdaftar
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
          Total: {users.length} Akun
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--color-graphite)] text-[var(--color-fog)] font-mono">
              <th className="pb-3 font-medium">User & Nama Lengkap</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Status Langganan</th>
              <th className="pb-3 font-medium text-right">Workspace Slug</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-graphite)]/50 text-[var(--color-paper)]">
            {users.map((u) => {
              const isAdmin = u.role === 'SUPER_ADMIN';
              return (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5">
                    <div className="font-medium text-white">{u.full_name || u.username}</div>
                    <div className="text-[11px] text-[var(--color-fog)] font-mono">@{u.username}</div>
                  </td>
                  <td className="py-3.5 font-mono text-[var(--color-mist)]">{u.email}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        isAdmin
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {u.is_pro ? 'Klikin Pro (Active)' : 'Free Tier'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-mono text-[var(--color-acid-lime)]">
                    {u.bio_page?.slug ? `/${u.bio_page.slug}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
