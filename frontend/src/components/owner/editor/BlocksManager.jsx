import React, { useState } from 'react';
import {
  GripVerticalIcon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
  MoveUpIcon,
  MoveDownIcon,
  LinkIcon,
  TypeIcon,
  LayersIcon,
  PlayCircleIcon,
  InstagramIcon,
  XIcon,
  PencilIcon,
  ShoppingBagIcon,
  MessageCircleIcon,
  MusicIcon,
  SparklesIcon,
  ImageIcon,
  UploadIcon,
} from '../../Icons';
import SocialsBuilder from './SocialsBuilder';
import { fileToWebP } from '../../../utils/imageUtils';

const BLOCK_DEFINITIONS = [
  {
    type: 'link',
    title: 'Tautan (Link)',
    description: 'Tombol tautan dengan judul, deskripsi, dan ikon kustom',
    icon: LinkIcon,
    defaultData: {
      type: 'link',
      title: 'Tautan Baru',
      url: 'https://',
      subtitle: '',
      icon: 'Link',
    },
  },
  {
    type: 'header',
    title: 'Judul Bagian (Header)',
    description: 'Pemisah bagian untuk mengelompokkan blok konten',
    icon: TypeIcon,
    defaultData: {
      type: 'header',
      title: 'Kategori Produk',
      content: '',
      url: '',
    },
  },
  {
    type: 'divider',
    title: 'Garis Pembatas (Divider)',
    description: 'Garis pembatas visual antar blok (solid, dashed, atau dots)',
    icon: LayersIcon,
    defaultData: {
      type: 'divider',
      title: '',
      content: 'solid', // solid, dashed, dots
      url: '',
    },
  },
  {
    type: 'text',
    title: 'Blok Teks / Catatan',
    description: 'Paragraf penjelasan, catatan pengiriman, atau pengumuman',
    icon: TypeIcon,
    defaultData: {
      type: 'text',
      title: 'Pengumuman Penting',
      content: 'Tuliskan informasi penting atau pengumuman toko di sini.',
      url: '',
    },
  },
  {
    type: 'socials',
    title: 'Ikon Media Sosial',
    description: 'Deretan ikon sosial media profil Anda (IG, TikTok, WA, dll)',
    icon: InstagramIcon,
    defaultData: {
      type: 'socials',
      title: 'Media Sosial Kami',
      settings: JSON.stringify([
        { platform: 'instagram', url: 'https://instagram.com/' },
        { platform: 'whatsapp', url: 'https://wa.me/' },
        { platform: 'tiktok', url: 'https://tiktok.com/@' },
      ]),
    },
  },
  {
    type: 'embed',
    title: 'Media Embed',
    description: 'Sematkan video YouTube, Spotify playlist, atau TikTok',
    icon: PlayCircleIcon,
    defaultData: {
      type: 'embed',
      title: 'Video Unggulan',
      url: 'https://www.youtube.com/watch?v=1uN_Nl2QY4g',
      content: 'youtube',
    },
  },
];

export default function BlocksManager({
  blocks = [],
  pageDraft,
  onChangeField,
  onSwitchToProfileTab,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onReorderBlocks,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedBlockId, setExpandedBlockId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Move block up or down by 1 step
  const handleMove = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);

    const reorderedIds = newBlocks.map((b) => b.id);
    onReorderBlocks(reorderedIds);
  };

  // HTML5 Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, _index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    const reorderedIds = newBlocks.map((b) => b.id);
    onReorderBlocks(reorderedIds);
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'link':
        return { label: 'Link', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'header':
        return { label: 'Header', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'divider':
        return { label: 'Divider', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'text':
        return { label: 'Teks', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'socials':
        return { label: 'Sosmed', bg: 'bg-pink-50 text-pink-700 border-pink-200' };
      case 'embed':
        return { label: 'Embed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: type, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Blok Konten Bio</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Susun tautan, judul kategori, teks pengumuman, sosmed, dan media embed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>Tambah Blok Baru</span>
        </button>
      </div>

      {/* Quick Profile Summary Card */}
      {pageDraft && (
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Identitas Profil Utama
            </span>
            {onSwitchToProfileTab && (
              <button
                type="button"
                onClick={onSwitchToProfileTab}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:underline"
              >
                Atur Foto & Bio Lengkap →
              </button>
            )}
          </div>

          <div className="flex items-start gap-3">
            <div
              onClick={onSwitchToProfileTab}
              className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-xs shrink-0 cursor-pointer group"
              title="Klik untuk ganti foto profil"
            >
              {pageDraft.avatar_url ? (
                <img
                  src={pageDraft.avatar_url}
                  alt={pageDraft.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 font-mono text-sm">
                  {(pageDraft.title || 'K').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-semibold">
                Ubah
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nama Tampilan Halaman Bio (Display Name)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={pageDraft.title || ''}
                    onChange={(e) => onChangeField('title', e.target.value)}
                    placeholder="Contoh: Kopi Seduh Nusantara"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                  <PencilIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Deskripsi Bio Singkat
                </label>
                <input
                  type="text"
                  value={pageDraft.bio || ''}
                  onChange={(e) => onChangeField('bio', e.target.value)}
                  placeholder="Deskripsi singkat profil bio..."
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block List */}
      {blocks.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <LayersIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">Belum ada blok konten</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            Mulai tambahkan tautan atau blok pertama untuk mengisi halaman bio Anda.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100"
          >
            + Buat Blok Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => {
            const badge = getTypeBadge(block.type);
            const isExpanded = expandedBlockId === block.id;

            return (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`border rounded-xl transition-all duration-200 bg-white ${
                  draggedIndex === index
                    ? 'opacity-40 border-dashed border-slate-400'
                    : isExpanded
                    ? 'border-slate-400 ring-2 ring-slate-900/10 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Block Header Row */}
                <div className="flex items-center justify-between p-3.5 select-none gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-1 -ml-1 rounded"
                      title="Tahan & geser untuk mengubah urutan"
                    >
                      <GripVerticalIcon className="w-4 h-4" />
                    </div>

                    {/* Type Badge */}
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>

                    {/* Block Summary Title */}
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {block.title || (block.type === 'divider' ? `Garis Pembatas (${block.content || 'solid'})` : 'Tanpa Judul')}
                    </span>

                    {!block.is_active && (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Nonaktif
                      </span>
                    )}
                  </div>

                  {/* Quick Action Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      title="Pindahkan naik"
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100"
                    >
                      <MoveUpIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === blocks.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      title="Pindahkan turun"
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100"
                    >
                      <MoveDownIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => onDuplicateBlock(block.id)}
                      title="Duplikat blok ini"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteBlock(block.id)}
                      title="Hapus blok"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Expand/Collapse Editor */}
                    <button
                      type="button"
                      onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                      className="ml-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {isExpanded ? 'Tutup' : 'Edit'}
                    </button>
                  </div>
                </div>

                {/* Expanded Inline Editor */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/60 rounded-b-xl space-y-4">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Tampilkan Blok Ini</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={block.is_active}
                          onChange={(e) =>
                            onUpdateBlock(block.id, { is_active: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900" />
                      </label>
                    </div>

                    {/* Dynamic Fields Based on Block Type */}
                    {block.type === 'link' && (
                      <div className="space-y-3.5">
                        {/* 1. Button Title */}
                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Judul Tombol
                          </label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, { title: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                            placeholder="Contoh: Pesan Kopi via WhatsApp"
                          />
                        </div>

                        {/* 2. Destination URL with Quick Prefixes */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-900">
                            Tautan URL Tujuan
                          </label>
                          <input
                            type="url"
                            value={block.url || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, { url: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                            placeholder="https://wa.me/6281234567890"
                          />
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold">Awalan Cepat:</span>
                            {[
                              { label: 'WhatsApp', val: 'https://wa.me/62' },
                              { label: 'Shopee', val: 'https://shopee.co.id/' },
                              { label: 'Tokopedia', val: 'https://tokopedia.com/' },
                              { label: 'Website', val: 'https://' },
                            ].map((p) => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => {
                                  if (!block.url || block.url === 'https://') {
                                    onUpdateBlock(block.id, { url: p.val });
                                  }
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              >
                                + {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Subtitle / Note */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Deskripsi Tambahan / Subtitle (Opsional)
                          </label>
                          <input
                            type="text"
                            value={block.subtitle || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, { subtitle: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                            placeholder="Contoh: Diskon 20% khusus pelanggan bio"
                          />
                        </div>

                        {/* 4. Link Thumbnail Image (Auto WebP) */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-xs font-bold text-slate-900">
                            Thumbnail Gambar Tombol (Otomatis WebP)
                          </label>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                            {block.image_url ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group">
                                <img
                                  src={block.image_url}
                                  alt="Thumbnail"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => onUpdateBlock(block.id, { image_url: '' })}
                                  className="absolute inset-0 bg-slate-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                                >
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <ImageIcon className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 space-y-1">
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                                <UploadIcon className="w-3.5 h-3.5 text-slate-600" />
                                <span>Pilih Gambar (Konversi WebP)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const res = await fileToWebP(file, { maxWidth: 300, maxHeight: 300, quality: 0.88 });
                                        onUpdateBlock(block.id, { image_url: res.dataUrl });
                                      } catch (err) {
                                        alert('Gagal memproses gambar thumbnail: ' + err.message);
                                      }
                                    }
                                  }}
                                />
                              </label>
                              <p className="text-[10px] text-slate-500">
                                Gambar thumbnail kecil (rasio 1:1) di sisi kiri tombol link.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 5. Spotlight Micro-Animation Selector */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-900">
                              Sorotan & Animasi Tombol (Spotlight)
                            </label>
                            <span className="text-[10px] text-slate-500 font-medium">Tarik perhatian pengunjung</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'none', label: 'Biasa (Normal)' },
                              { id: 'pulse', label: 'Pulse Glow' },
                              { id: 'wiggle', label: 'Goyang Wiggle' },
                              { id: 'bounce', label: 'Bounce Melompat' },
                            ].map((anim) => (
                              <button
                                key={anim.id}
                                type="button"
                                onClick={() => onUpdateBlock(block.id, { spotlight: anim.id })}
                                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                                  (block.spotlight || 'none') === anim.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {anim.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 6. Visual Icon Selector */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-xs font-bold text-slate-900">
                            Pilih Ikon Tombol
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {[
                              { id: 'Link', label: 'Tautan', icon: LinkIcon },
                              { id: 'Shop', label: 'Toko', icon: ShoppingBagIcon },
                              { id: 'Chat', label: 'Chat', icon: MessageCircleIcon },
                              { id: 'Video', label: 'Video', icon: PlayCircleIcon },
                              { id: 'Music', label: 'Musik', icon: MusicIcon },
                              { id: 'Promo', label: 'Promo', icon: SparklesIcon },
                            ].map((ic) => {
                              const Icon = ic.icon;
                              const isSelected = (block.icon || 'Link') === ic.id;
                              return (
                                <button
                                  key={ic.id}
                                  type="button"
                                  onClick={() => onUpdateBlock(block.id, { icon: ic.id })}
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                    isSelected
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
                                  }`}
                                >
                                  <Icon className="w-4 h-4 mb-1" />
                                  <span className="text-[10px] leading-tight">{ic.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'header' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Teks Judul Kategori
                          </label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, { title: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                            placeholder="Contoh: Menu Makanan Unggulan"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Posisi Teks Judul
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'center', label: 'Rata Tengah' },
                              { id: 'left', label: 'Rata Kiri' },
                            ].map((align) => (
                              <button
                                key={align.id}
                                type="button"
                                onClick={() => onUpdateBlock(block.id, { content: align.id })}
                                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                                  (block.content || 'center') === align.id
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {align.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'divider' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-900">
                          Gaya Garis Pembatas
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'solid', label: 'Garis Lurus', lineClass: 'border-t-2 border-current' },
                            { id: 'dashed', label: 'Putus-putus', lineClass: 'border-t-2 border-dashed border-current' },
                            { id: 'dots', label: 'Titik-titik', lineClass: 'border-t-2 border-dotted border-current' },
                            { id: 'space', label: 'Spasi Kosong', lineClass: 'h-2 border-b border-transparent' },
                          ].map((style) => (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => onUpdateBlock(block.id, { content: style.id })}
                              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                                (block.content || 'solid') === style.id
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="w-full h-3 flex items-center justify-center px-2">
                                <div className={`w-full ${style.lineClass}`} />
                              </div>
                              <span className="text-[10px] font-bold">{style.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === 'text' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Judul Catatan (Opsional)
                          </label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, { title: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                            placeholder="Pengumuman Jam Operasional"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Isi Paragraf Teks
                          </label>
                          <textarea
                            rows={3}
                            value={block.content || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, { content: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none resize-none leading-relaxed"
                            placeholder="Tuliskan isi catatan lengkap di sini..."
                          />
                        </div>
                      </div>
                    )}

                    {/* 5. SOSMED BLOCK - 100% GUI Driven, ZERO raw JSON */}
                    {block.type === 'socials' && (
                      <SocialsBuilder
                        settings={block.settings}
                        onChangeSettings={(val) =>
                          onUpdateBlock(block.id, { settings: val })
                        }
                      />
                    )}

                    {/* 6. EMBED BLOCK */}
                    {block.type === 'embed' && (
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-900 mb-1">
                            Judul Video / Media
                          </label>
                          <input
                            type="text"
                            value={block.title || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, { title: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                            placeholder="Video Tutorial Terbaru"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-900">
                            URL Video / Media Embed
                          </label>
                          <input
                            type="url"
                            value={block.url || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, { url: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold">Format Didukung:</span>
                            {['YouTube', 'Spotify', 'TikTok'].map((platform) => (
                              <span
                                key={platform}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setExpandedBlockId(null)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Selesai Mengedit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Block Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pilih Jenis Blok</h3>
                <p className="text-xs text-slate-500">Pilih komponen yang ingin ditambahkan ke bio</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {BLOCK_DEFINITIONS.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    type="button"
                    onClick={() => {
                      onAddBlock(def.defaultData);
                      setIsAddModalOpen(false);
                    }}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50/70 text-left transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center text-slate-700 transition-colors shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{def.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {def.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
