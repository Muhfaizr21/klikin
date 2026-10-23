import React, { useState } from 'react';
import { CheckIcon, XIcon, CropIcon, SparklesIcon } from '../../Icons';
import { fileToWebP, cropToSquareWebP } from '../../../utils/imageUtils';

const AVATAR_PRESETS = [
  {
    id: 'kopi',
    name: 'Artisan Coffee',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'minimalist',
    name: 'Studio Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'executive',
    name: 'Executive Dark',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'creator',
    name: 'Creative Camera',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'coffee-cup',
    name: 'Pour Over',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80',
  },
];

export default function AvatarCropModal({ isOpen, onClose, onApplyAvatar, currentAvatar }) {
  const [selectedImage, setSelectedImage] = useState(currentAvatar || AVATAR_PRESETS[0].url);
  const [zoom, setZoom] = useState(1);
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState('crop'); // 'crop' | 'presets' | 'url'
  const [processing, setProcessing] = useState(false);
  const [conversionInfo, setConversionInfo] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      // Automatically convert any uploaded image (PNG, JPG, HEIC, etc.) to WebP format
      const converted = await fileToWebP(file, { maxWidth: 800, maxHeight: 800, quality: 0.90 });
      setSelectedImage(converted.dataUrl);
      setConversionInfo({
        originalKb: Math.round(converted.originalSize / 1024),
        webpKb: Math.round(converted.webpSize / 1024),
      });
      setActiveTab('crop');
    } catch (err) {
      alert('Gagal memproses gambar: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleApply = async () => {
    setProcessing(true);
    try {
      if (activeTab === 'url' && customUrl.trim()) {
        // Even for URL, attempt to square-crop and format to WebP
        try {
          const cropped = await cropToSquareWebP(customUrl.trim(), { zoom, outputSize: 400, quality: 0.90 });
          onApplyAvatar(cropped.dataUrl);
        } catch {
          onApplyAvatar(customUrl.trim());
        }
      } else {
        const cropped = await cropToSquareWebP(selectedImage, { zoom, outputSize: 400, quality: 0.90 });
        onApplyAvatar(cropped.dataUrl);
      }
      onClose();
    } catch  {
      // Fallback
      onApplyAvatar(selectedImage);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upload & Crop Avatar</h3>
              <p className="text-xs text-slate-500">Sesuaikan foto profil bio dengan format rasio 1:1</p>
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

        {/* Sub-tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'crop'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Crop & Pratinjau
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'presets'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pilihan Preset
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'url'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Input URL Gambar
          </button>
        </div>

        {/* Content by Tab */}
        {activeTab === 'crop' && (
          <div className="space-y-4">
            {/* Circular Crop Frame with Crosshairs */}
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-slate-900 shadow-inner bg-slate-950 flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Avatar Crop Preview"
                  className="w-full h-full object-cover transition-transform duration-100 select-none pointer-events-none"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : (
                <div className="text-slate-500 text-xs">Pilih Gambar</div>
              )}
              {/* Circular Overlay Guideline */}
              <div className="absolute inset-0 pointer-events-none border border-white/30 rounded-full" />
            </div>

            {/* Zoom Slider */}
            <div className="space-y-1.5 px-4">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Perbesar / Perkecil (Zoom)</span>
                <span className="font-mono">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Upload File Input with WebP conversion info */}
            <div className="text-center pt-2 space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                <span>{processing ? 'Memproses WebP...' : 'Pilih Foto dari Komputer'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={processing}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Startup-grade WebP indicator */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80">
                  <SparklesIcon className="w-3 h-3" />
                  Konversi Otomatis: WebP
                </span>
                {conversionInfo && (
                  <span className="font-mono text-slate-500">
                    ({conversionInfo.originalKb}KB → {conversionInfo.webpKb}KB)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Pilih dari galeri foto profil kurasi Klikin (Otomatis WebP):</p>
            <div className="grid grid-cols-5 gap-3">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedImage === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedImage(preset.url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group ${
                      isSelected
                        ? 'border-slate-900 ring-2 ring-slate-900/20 scale-105'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white">
                        <CheckIcon className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'url' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              URL Gambar Langsung (HTTPS):
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                if (e.target.value) setSelectedImage(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 font-mono font-medium"
            />
            {customUrl && (
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border border-slate-200 mt-2">
                <img
                  src={customUrl}
                  alt="Custom URL Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=Error';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">
            Format Akhir: <span className="font-bold text-slate-800">.WEBP (Kompresi 90%)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={processing}
              className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Terapkan Avatar (WebP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
