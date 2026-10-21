import React, { useState } from 'react';
import { XIcon } from '../Icons';

export default function AddLinkModal({ isOpen, onClose, onAddLink, loading }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    onAddLink(title.trim(), url.trim());
    setTitle('');
    setUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-sm font-bold text-slate-900">Tambah Tautan Baru ke Bio</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Tautan / Produk
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Menu Kopi Terbaru / Order WhatsApp"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Tujuan
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://wa.me/628123456789 atau https://shopee.co.id/..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Tautan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
