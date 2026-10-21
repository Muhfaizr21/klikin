import React from 'react';
import { VideoCameraIcon, ExternalLinkIcon } from '../Icons';

export default function DailyMeetingCard({ slug = 'kopiseduh' }) {
  const bioUrl = `http://localhost:5173/#${slug}`;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
      {/* Header with Camera Icon */}
      <div>
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <VideoCameraIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Daily Meeting</h3>
            <p className="text-[11px] text-slate-400 font-medium">12+ Person · 6:30 PM</p>
          </div>
        </div>

        {/* Conduct Meeting Pile */}
        <div className="flex items-center gap-2.5 my-3">
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-200 text-[10px] font-bold text-indigo-800 flex items-center justify-center">
              MA
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-200 text-[10px] font-bold text-emerald-800 flex items-center justify-center">
              DK
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-200 text-[10px] font-bold text-amber-800 flex items-center justify-center">
              EM
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">They will conduct the meeting</span>
        </div>
      </div>

      {/* Action Button */}
      <a
        href={bioUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] mt-2"
      >
        <span>Click for meeting link</span>
        <ExternalLinkIcon className="w-3 h-3 text-slate-400" />
      </a>
    </div>
  );
}
