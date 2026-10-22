import React from 'react';
import {
  XIcon,
  CheckIcon,
  SparklesIcon,
  BarChartIcon,
  DownloadIcon,
  GlobeIcon,
  LockIcon,
} from '../Icons';
import { navigateTo } from '../../utils/navigation';

export default function AnalyticsPaywallModal({
  isOpen,
  onClose,
  onSimulateUpgrade,
  featureName = 'Fitur Analitik Lanjutan',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col space-y-5 animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Klikin Pro Feature</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Buka Wawasan {featureName}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Paket Free mencakup tampilan data 7 hari dasar. Dapatkan akses ke seluruh fitur analisis startup profesional untuk memaksimalkan konversi penjualan bio Anda.
          </p>
        </div>

        {/* Value Proposition List */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
          {[
            'Rentang kalender bebas (30 hari, 90 hari, hingga custom date)',
            'Rincian sumber trafik spesifik (Instagram, TikTok, WhatsApp, Direct)',
            'Demografi geografis pengunjung (Kota & Negara detail)',
            'Karakteristik perangkat & in-app browser detection',
            'Ekspor laporan lengkap CSV untuk spreadsheet',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckIcon className="w-2.5 h-2.5" />
              </div>
              <span className="leading-tight font-medium">{item}</span>
            </div>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block">Langganan Klikin Pro</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-slate-900">Rp 49.000</span>
              <span className="text-xs text-slate-500 font-medium">/bulan</span>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full">
            Hemat 20% Tahunan
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              navigateTo('/owner/billing');
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <SparklesIcon className="w-4 h-4 text-amber-400" />
            <span>Tingkatkan ke Klikin Pro di Halaman Billing</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Lain Kali
          </button>
        </div>
      </div>
    </div>
  );
}
