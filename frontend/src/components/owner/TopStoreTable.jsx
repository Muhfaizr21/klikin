import React, { useState } from 'react';
import { ShareIcon, XIcon, ExternalLinkIcon } from '../Icons';

const DEFAULT_STORES = [
  { id: 'st-1', name: 'Solaris Sparkle', location: 'Miami, Florida', sell: '102 Quantity', amount: '12.50K' },
  { id: 'st-2', name: 'Crimson Dusk', location: 'Denver, Colorado', sell: '214 Quantity', amount: '07.85K' },
  { id: 'st-3', name: 'Indigo Zephyr', location: 'Orlando, Florida', sell: '143 Quantity', amount: '16.40K' },
  { id: 'st-4', name: 'Roseate Crest', location: 'Las Vegas, Nevada', sell: '185 Quantity', amount: '23.64K' },
];

export default function TopStoreTable({ links = [], onDeleteLink, onOpenAddModal }) {
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'links'

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Top Store</h3>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('stores')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                activeTab === 'stores' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              Stores
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                activeTab === 'links' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              Bio Links ({links.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'links' && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
            >
              + Tambah Tautan
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.origin);
                alert('Tautan toko berhasil disalin ke clipboard!');
              }
            }}
            className="bg-[#d9f99d] hover:bg-[#bef264] text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs transition-all active:scale-[0.97] flex items-center gap-1"
          >
            <ShareIcon className="w-3 h-3" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-400">
              <th className="pb-3 font-medium">Store Name</th>
              <th className="pb-3 font-medium">Location</th>
              <th className="pb-3 font-medium">Sell</th>
              <th className="pb-3 font-medium text-right">Amount</th>
              {activeTab === 'links' && <th className="pb-3 font-medium text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {activeTab === 'stores' ? (
              DEFAULT_STORES.map((store) => (
                <tr key={store.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-semibold text-slate-900">{store.name}</td>
                  <td className="py-3 text-slate-400">{store.location}</td>
                  <td className="py-3 text-slate-600 font-medium">{store.sell}</td>
                  <td className="py-3 font-bold text-slate-900 text-right">{store.amount}</td>
                </tr>
              ))
            ) : links.length > 0 ? (
              links.map((link) => (
                <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{link.title}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3 text-slate-400 font-mono text-[11px] truncate max-w-[150px]">
                    {link.url}
                  </td>
                  <td className="py-3 text-slate-600 font-medium">{link.clicks || 0} Klik</td>
                  <td className="py-3 font-bold text-emerald-600 text-right">
                    Rp {((link.clicks || 1) * 15).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteLink?.(link.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Tautan"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-400 text-xs">
                  Belum ada tautan bio. Klik "+ Tambah Tautan" untuk menambahkan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
