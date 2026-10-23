import React, { useState } from 'react';
import {
  XIcon,
  SmartphoneIcon,
  MonitorIcon,
  CheckIcon,
  CopyIcon,
} from '../../Icons';
import MobilePreviewFrame from './MobilePreviewFrame';
import DesktopPreviewFrame from './DesktopPreviewFrame';

export default function FullscreenPreviewModal({
  isOpen,
  onClose,
  page,
  blocks = [],
}) {
  const [viewMode, setViewMode] = useState('mobile'); // 'mobile' | 'desktop'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/#p/${page?.slug || 'kopiseduh'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between text-white bg-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            MODE PRATINJAU
          </span>
          <span className="text-xs font-semibold text-slate-300 truncate max-w-xs hidden sm:inline">
            {page?.title || 'Halaman Bio'}
          </span>
        </div>

        {/* Viewport Toggle (Mobile vs Desktop) */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'mobile'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SmartphoneIcon className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'desktop'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MonitorIcon className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Share & Close Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <CopyIcon className="w-3.5 h-3.5 text-slate-300" />
                <span>Salin Tautan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Preview Viewport */}
      <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        {viewMode === 'mobile' ? (
          <div className="my-auto py-4">
            <MobilePreviewFrame page={page} blocks={blocks} />
          </div>
        ) : (
          <div className="w-full my-auto py-6 flex justify-center">
            <DesktopPreviewFrame page={page} blocks={blocks} />
          </div>
        )}
      </main>
    </div>
  );
}
