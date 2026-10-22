import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  XIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  QrCodeIcon,
  Share2Icon,
  WhatsAppIcon,
  TwitterIcon,
  GlobeIcon,
  CodeIcon,
} from '../../Icons';

export default function ShareModal({ isOpen, onClose, pageTitle, pageSlug, publicUrl }) {
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'link' | 'embed'
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const canvasRef = useRef(null);

  const fullUrl = publicUrl || `${window.location.origin}/#p/${pageSlug || 'kopiseduh'}`;
  const shareText = `Kunjungi halaman profil resmi ${pageTitle || 'Klikin'}: ${fullUrl}`;
  const embedCode = `<iframe src="${fullUrl}" width="100%" height="720" style="border:none;border-radius:16px;max-width:480px;box-shadow:0 8px 30px rgba(0,0,0,0.12);" title="${pageTitle || 'Klikin Bio'}"></iframe>`;

  // Draw QR code onto canvas
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        fullUrl,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a', // Solid slate-900
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H', // High error correction to allow center brand emblem
        },
        (error) => {
          if (error) console.error('Failed to generate QR Code:', error);
        }
      );
    }
  }, [isOpen, fullUrl, activeTab]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!canvasRef.current) return;
    // Generate a high-resolution export canvas (1000x1000)
    const exportCanvas = document.createElement('canvas');
    QRCode.toCanvas(
      exportCanvas,
      fullUrl,
      {
        width: 1024,
        margin: 3,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      },
      (err) => {
        if (!err) {
          const link = document.createElement('a');
          link.download = `qrcode-${pageSlug || 'klikin'}.png`;
          link.href = exportCanvas.toDataURL('image/png');
          link.click();
        }
      }
    );
  };

  const handleCopyQrImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob && navigator.clipboard?.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedQr(true);
          setTimeout(() => setCopiedQr(false), 2000);
        }
      });
    } catch {
      handleDownloadQr();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
              <Share2Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bagikan Halaman Bio</h3>
              <p className="text-[11px] text-slate-500">QR Code instan & opsi share ke seluruh kanal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCodeIcon className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'link'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GlobeIcon className="w-3.5 h-3.5" />
            <span>Sosial & Tautan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'embed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CodeIcon className="w-3.5 h-3.5" />
            <span>Embed Widget</span>
          </button>
        </div>

        {/* Tab 1: QR Code Card */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            {/* QR Canvas Container with Card Chassis */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto relative group">
              <canvas
                ref={canvasRef}
                className="w-48 h-48 mx-auto rounded-xl bg-white p-2 shadow-xs border border-slate-200"
              />
              <div className="mt-2 text-center">
                <span className="text-xs font-bold text-slate-900">{pageTitle || 'Klikin Bio'}</span>
                <p className="text-[10px] text-slate-500 font-mono">{fullUrl.replace(/^https?:\/\//, '')}</p>
              </div>
            </div>

            {/* QR Download & Copy Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>Unduh PNG (HD)</span>
              </button>
              <button
                type="button"
                onClick={handleCopyQrImage}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                {copiedQr ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>Salin Gambar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Cetak QR Code ini untuk nomor meja kafe, packaging produk, atau kartu nama bisnis Anda.
            </p>
          </div>
        )}

        {/* Tab 2: Direct Share & Links */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            {/* Direct Copy Bar */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 block">
                Tautan Publik Halaman Bio Anda:
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 bg-white p-1.5 focus-within:ring-2 focus-within:ring-slate-900/15 focus-within:border-slate-900">
                <input
                  type="text"
                  readOnly
                  value={fullUrl}
                  className="flex-1 px-2.5 py-1 text-xs font-mono text-slate-900 font-medium bg-transparent focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {copiedUrl ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share to 1-Click Channels */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-900 block">
                Bagikan Langsung ke Media Sosial:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-900 text-xs font-semibold transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(pageTitle || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 text-sky-900 text-xs font-semibold transition-colors"
                >
                  <GlobeIcon className="w-4 h-4 text-sky-600" />
                  <span>Telegram</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-semibold transition-colors"
                >
                  <TwitterIcon className="w-3.5 h-3.5 text-slate-800" />
                  <span>X / Twitter</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Embed Widget Snippet */}
        {activeTab === 'embed' && (
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Kode HTML iFrame (Sematkan di Website / Blog):
              </label>
              <textarea
                readOnly
                rows={4}
                value={embedCode}
                className="w-full p-3 rounded-xl border border-slate-300 bg-slate-900 text-slate-200 font-mono text-xs focus:outline-none select-all leading-relaxed resize-none"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyEmbed}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              {copiedEmbed ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kode Embed Tersalin ke Clipboard</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>Salin Kode HTML</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500">
              Tempelkan kode ini di WordPress, Shopify, Webflow, atau HTML website Anda untuk menampilkan bio interaktif.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
