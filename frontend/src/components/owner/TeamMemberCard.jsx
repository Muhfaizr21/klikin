import React from 'react';
import { ChevronRightIcon } from '../Icons';

const MEMBERS = [
  { id: 'm-1', name: 'Mahid Ahmed', role: 'Project Manager', initials: 'MA', color: 'from-amber-200 to-orange-200 text-amber-900' },
  { id: 'm-2', name: 'Daniel Karl', role: 'HR Head', initials: 'DK', color: 'from-blue-200 to-indigo-200 text-blue-900' },
  { id: 'm-3', name: 'Elena Michel', role: 'Co-ordinator', initials: 'EM', color: 'from-emerald-200 to-teal-200 text-emerald-900' },
  { id: 'm-4', name: 'Salina Mitso', role: 'Co-ordinator', initials: 'SM', color: 'from-purple-200 to-pink-200 text-purple-900' },
];

export default function TeamMemberCard({ onAddMember }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Team Member</h3>
      </div>

      {/* Member List */}
      <div className="space-y-2 mb-4">
        {MEMBERS.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-[10px] font-bold shadow-2xs shrink-0`}
              >
                {member.initials}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                  {member.name}
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight">{member.role}</p>
              </div>
            </div>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        ))}
      </div>

      {/* Add Member Button */}
      <button
        type="button"
        onClick={onAddMember || (() => alert('Undang anggota tim baru ke workspace Klikin Anda'))}
        className="w-full bg-[#dbeafe]/80 hover:bg-[#bfdbfe] text-[#1e40af] text-xs font-semibold py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
      >
        <span className="text-sm leading-none font-bold">+</span>
        <span>Add more member</span>
      </button>
    </div>
  );
}
