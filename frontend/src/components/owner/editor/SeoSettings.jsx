import React from 'react';
import { ImageIcon, UploadIcon } from '../../Icons';
import { fileToWebP } from '../../../utils/imageUtils';

export default function SeoSettings({
  metaTitle,
  metaDescription,
  ogImage,
  slug,
  pageTitle,
  pageBio,
  onChangeField,
}) {
  const displayTitle = metaTitle || pageTitle || 'Nama Halaman Bio';
  const displayDesc = metaDescription || pageBio || 'Kumpulan tautan resmi dan media profil oleh Klikin.';
  const displayUrl = `klikin.id/p/${slug || 'username'}`;

  const titleLength = (metaTitle || '').length;
  const descLength = (metaDescription || '').length;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-8">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pengaturan SEO & Pratinjau Sosial</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Optimalkan cara halaman bio Anda ditemukan di Google Search dan dibagikan di WhatsApp serta media sosial.
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-5">
        {/* Meta Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900">
              Judul Halaman (Meta Title)
            </label>
            <span
              className={`text-[11px] font-mono ${
                titleLength > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'
              }`}
            >
              {titleLength}/60 karakter (Rekomendasi 50-60)
            </span>
          </div>
          <input
            type="text"
            maxLength={70}
            value={metaTitle || ''}
            onChange={(e) => onChangeField('meta_title', e.target.value)}
            placeholder={pageTitle || 'Kopi Seduh Nusantara - Roastery Biji Kopi Lokal'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 focus:outline-none"
          />
        </div>

        {/* Meta Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900">
              Deskripsi Mesin Pencari (Meta Description)
            </label>
            <span
              className={`text-[11px] font-mono ${
                descLength > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'
              }`}
            >
              {descLength}/160 karakter (Rekomendasi 120-160)
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={180}
            value={metaDescription || ''}
            onChange={(e) => onChangeField('meta_description', e.target.value)}
            placeholder={pageBio || 'Pesan biji kopi lokal single origin dan perlengkapan seduh manual resmi.'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* OG Image */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Gambar Cuplikan Sosial (OG Image - Otomatis WebP)</span>
            </label>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              Format WebP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={ogImage || ''}
              onChange={(e) => onChangeField('og_image', e.target.value)}
              placeholder="https://domain-anda.com/og-preview.webp"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 bg-white focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 focus:outline-none"
            />
            <label className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-2xs">
              <UploadIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Upload WebP</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const res = await fileToWebP(file, { maxWidth: 1200, maxHeight: 630, quality: 0.90 });
                      onChangeField('og_image', res.dataUrl);
                    } catch (err) {
                      alert('Gagal memproses gambar OG: ' + err.message);
                    }
                  }
                }}
              />
            </label>
          </div>
          <p className="text-[11px] text-slate-500">
            Gambar thumbnail yang muncul saat tautan dibagikan ke WhatsApp, Twitter/X, Telegram, atau Facebook.
          </p>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Google SERP Simulator */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Simulasi Hasil Pencarian Google (SERP Preview)
        </h4>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold">
              K
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-800 leading-tight">Klikin Bio</span>
              <span className="text-[11px] text-slate-500 font-mono leading-tight">
                https://{displayUrl}
              </span>
            </div>
          </div>
          <h5 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer pt-1">
            {displayTitle}
          </h5>
          <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
            {displayDesc}
          </p>
        </div>
      </div>

      {/* Social Share Preview Card */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Pratinjau Kartu Berbagi Sosial (Social Card)
        </h4>
        <div className="max-w-md border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-slate-50">
          {ogImage ? (
            <div className="w-full h-40 bg-slate-200 overflow-hidden">
              <img
                src={ogImage}
                alt="OG Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-full h-32 bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
              <span className="text-lg font-bold tracking-tight">{displayTitle}</span>
              <span className="text-xs text-slate-400 mt-1">{displayUrl}</span>
            </div>
          )}
          <div className="p-3 bg-white space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              {displayUrl}
            </span>
            <h6 className="text-xs font-bold text-slate-900 truncate">{displayTitle}</h6>
            <p className="text-[11px] text-slate-500 line-clamp-2">{displayDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
