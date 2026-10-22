import React, { useState } from 'react';
import { SearchIcon, ExternalLinkIcon, UserCheckIcon, ShieldCheckIcon } from '../Icons';

export default function UserDirectoryTable({ users = [], onRefresh }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name && u.full_name.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (u.bio_page?.slug && u.bio_page.slug.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'ADMIN' && u.role === 'SUPER_ADMIN') ||
      (roleFilter === 'OWNER' && u.role !== 'SUPER_ADMIN') ||
      (roleFilter === 'PRO' && u.is_pro);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Direktori Pengguna & Tenant</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Daftar seluruh akun Super Admin dan Pengelola Toko yang terdaftar di platform
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'OWNER', 'PRO', 'ADMIN'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setRoleFilter(filter)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === filter
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
              }`}
            >
              {filter === 'ALL' ? 'Semua Akun' : filter === 'OWNER' ? 'Owner Toko' : filter === 'PRO' ? 'Klikin Pro' : 'Super Admin'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Cari berdasarkan nama, username, email, atau link toko..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-medium">
              <th className="py-3 px-4 font-semibold">User & Nama Lengkap</th>
              <th className="py-3 px-4 font-semibold">Email</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-4 font-semibold">Status Paket</th>
              <th className="py-3 px-4 font-semibold text-right">Tautan Toko</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-medium">
                  Tidak ada data pengguna yang sesuai pencarian.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isAdmin = u.role === 'SUPER_ADMIN';
                const initial = (u.full_name?.charAt(0) || u.username?.charAt(0) || 'U').toUpperCase();

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            isAdmin
                              ? 'bg-[#ede9fe] text-[#5b21b6]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {initial}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {u.full_name || u.username}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAdmin
                            ? 'bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe]'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/70'
                        }`}
                      >
                        {isAdmin && <ShieldCheckIcon className="w-3 h-3 text-[#5b21b6]" />}
                        {u.role}
                      </span>
                    </td>

                    {/* Status Paket */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.is_pro
                            ? 'bg-[#f0fdf4] text-emerald-800 border border-[#bbf7d0]'
                            : 'bg-slate-50 text-slate-500 border border-slate-200/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.is_pro ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {u.is_pro ? 'Klikin Pro (Active)' : 'Free Tier'}
                      </span>
                    </td>

                    {/* Link Toko */}
                    <td className="py-3.5 px-4 text-right">
                      {u.bio_page?.slug ? (
                        <a
                          href={`/${u.bio_page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <span>/{u.bio_page.slug}</span>
                          <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
        <span>Menampilkan {filteredUsers.length} dari {users.length} total akun</span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
          >
            Muat Ulang Data
          </button>
        )}
      </div>
    </div>
  );
}
