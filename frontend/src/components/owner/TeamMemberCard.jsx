import React from 'react';
import { ChevronRightIcon, SparklesIcon } from '../Icons';

const LEADS = [
  { id: 'ld-1', name: 'Faiz Ramadhan', detail: 'Tanya Paket Reseller Kopi', email: 'faiz@kopinusantara.id', time: '10m lalu', initials: 'FR', color: 'from-amber-200 to-orange-200 text-amber-900' },
  { id: 'ld-2', name: 'Rina Sasmita', detail: 'Klaim Voucher Diskon 20%', email: 'rina.s@gmail.com', time: '45m lalu', initials: 'RS', color: 'from-blue-200 to-indigo-200 text-blue-900' },
  { id: 'ld-3', name: 'Dimas Prasetyo', detail: 'Request Menu Event Kantor', email: 'dimas@agency.co', time: '2j lalu', initials: 'DP', color: 'from-emerald-200 to-teal-200 text-emerald-900' },
  { id: 'ld-4', name: 'Siti Rahayu', detail: 'Tertarik Kopi Cold Brew', email: 'siti.r@umkm.id', time: '3j lalu', initials: 'SR', color: 'from-purple-200 to-pink-200 text-purple-900' },
];

export default function TeamMemberCard({ onAddLeadForm }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Karakteristik Audiens & Leads</h3>
          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            48 Leads Baru
          </span>
        </div>
        <p className="text-[11px] text-slate-400">92% Pengguna HP · Dominasi Jakarta & Surabaya</p>
      </div>

      {/* Mini Audience Stats Badges */}
      <div className="grid grid-cols-2 gap-2 my-2.5">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
          <span className="text-[10px] text-slate-400 block">Perangkat Utama</span>
          <span className="text-xs font-bold text-slate-800">92% Smartphone</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
          <span className="text-[10px] text-slate-400 block">Kota Teratas</span>
          <span className="text-xs font-bold text-slate-800">Jakarta & Surabaya</span>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-1.5 mb-3">
        {LEADS.map((lead) => (
          <div
            key={lead.id}
            onClick={() => alert(`Detail kontak: ${lead.name} (${lead.email})\nKebutuhan: ${lead.detail}`)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${lead.color} flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0`}
              >
                {lead.initials}
              </div>
              <div className="truncate max-w-[170px]">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight truncate">
                  {lead.name}
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight truncate">{lead.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[9px] text-slate-400 font-mono">{lead.time}</span>
              <ChevronRightIcon className="w-3 h-3 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {/* Action Button: Leads Capture Form */}
      <button
        type="button"
        onClick={onAddLeadForm || (() => alert('Membuka konfigurasi formulir kontak & email capture (Klikin Pro)...'))}
        className="w-full bg-[#dbeafe]/80 hover:bg-[#bfdbfe] text-[#1e40af] text-xs font-semibold py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
      >
        <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
        <span>+ Pasang Form Tangkap Leads (PRO)</span>
      </button>
    </div>
  );
}
