import React, { useState } from 'react';
import AvatarCropModal from './AvatarCropModal';
import { CropIcon, TrashIcon, VerifiedBadgeIcon } from '../../Icons';

export default function ProfileEditor({
  title,
  bio,
  avatarUrl,
  isVerified,
  onChangeField,
}) {
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const bioLength = bio ? bio.length : 0;
  const maxBioLength = 200;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Profil Halaman Bio</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Atur identitas utama yang pertama kali dilihat oleh pengunjung pada halaman bio Anda.
        </p>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-xs shrink-0 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar Bio"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-slate-500 font-mono">
              {(title || 'K').slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="space-y-2 flex-1">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Foto Profil / Avatar</h4>
            <p className="text-[11px] text-slate-500">
              Format persegi (1:1), direkomendasikan resolusi minimal 400x400 piksel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCropModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-xs"
            >
              <CropIcon className="w-3.5 h-3.5" />
              <span>{avatarUrl ? 'Ganti & Crop Foto' : 'Unggah Foto'}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={() => onChangeField('avatar_url', '')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Display Name Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900">
            Nama Tampilan / Judul Profil
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {(title || '').length}/60
          </span>
        </div>
        <input
          type="text"
          maxLength={60}
          value={title || ''}
          onChange={(e) => onChangeField('title', e.target.value)}
          placeholder="Contoh: Kopi Seduh Nusantara"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all font-medium"
        />
        <p className="text-[11px] text-slate-500">
          Nama utama yang ditampilkan dengan ukuran tebal di bawah foto profil Anda.
        </p>
      </div>

      {/* Bio Description Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900">
            Deskripsi Singkat (Bio)
          </label>
          <span
            className={`text-[11px] font-mono ${
              bioLength > maxBioLength ? 'text-rose-600 font-bold' : 'text-slate-400'
            }`}
          >
            {bioLength}/{maxBioLength}
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={maxBioLength}
          value={bio || ''}
          onChange={(e) => onChangeField('bio', e.target.value)}
          placeholder="Tuliskan deskripsi ringkas tentang Anda atau bisnis Anda..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all font-normal leading-relaxed resize-none"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Tips: Jelaskan nilai tambah atau penawaran utama dalam 1-2 kalimat ringkas.</span>
        </div>
      </div>

      {/* Verified Creator Badge Toggle */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center shrink-0">
            <VerifiedBadgeIcon className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900">Lencana Kreator Terverifikasi</h4>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">Pro</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tampilkan tanda centang biru resmi di sebelah nama profil bio Anda.
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!!isVerified}
            onChange={(e) => onChangeField('is_verified', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900" />
        </label>
      </div>

      {/* Avatar Crop Modal Instance */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        currentAvatar={avatarUrl}
        onApplyAvatar={(newUrl) => onChangeField('avatar_url', newUrl)}
      />
    </div>
  );
}
