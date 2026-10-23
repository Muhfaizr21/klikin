import React, { useState } from 'react';
import { ShareIcon, XIcon, CheckIcon } from '../Icons';

export default function TopStoreTable({
  links = [],
  linksBreakdown = [],
  onDeleteLink,
  onOpenAddModal,
  onNavigateToEditor,
}) {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'table' | 'links'
  const [copiedBio, setCopiedBio] = useState(false);

  const handleCopyBio = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2000);
    }
  };

  // Prepare dynamic display list
  const displayItems = React.useMemo(() => {
    if (linksBreakdown && linksBreakdown.length > 0) {
      const maxClicks = Math.max(...linksBreakdown.map((l) => l.clicks || 0), 1);
      return linksBreakdown.map((item, idx) => {
        const clicks = item.clicks || 0;
        const share = item.share_rate !== undefined ? item.share_rate : (item.share || 0);
        const ctr = item.ctr !== undefined ? item.ctr : 0;

        let status = 'Stabil';
        let statusColor = 'text-slate-600 bg-slate-50 border-slate-200/60';

        if (idx === 0 && clicks > 0) {
          status = 'Optimal';
          statusColor = 'text-slate-800 bg-slate-100 border-slate-200';
        } else if (idx === 1 && clicks > 0) {
          status = 'Tren Meningkat';
          statusColor = 'text-slate-800 bg-slate-100 border-slate-200';
        } else if (share >= 15) {
          status = 'Stabil';
          statusColor = 'text-slate-600 bg-slate-50 border-slate-200/60';
        } else if (share > 5) {
          status = 'Cukup';
          statusColor = 'text-slate-500 bg-slate-50 border-slate-200/40';
        } else {
          status = 'Perlu Penyesuaian';
          statusColor = 'text-amber-900 bg-amber-50/80 border-amber-200';
        }

        const positionLabel =
          idx === 0
            ? 'Posisi 1 (Area Teratas)'
            : idx === 1
            ? 'Posisi 2 (Utama)'
            : idx === 2
            ? 'Posisi 3 (Tengah)'
            : `Posisi ${idx + 1} (Bawah)`;

        return {
          id: item.link_id || item.block_id || `link-${idx}`,
          name: item.title || 'Tautan Tanpa Judul',
          channel: item.url ? item.url.replace(/^https?:\/\//, '') : '-',
          position: positionLabel,
          clicks,
          clicksFormatted: clicks.toLocaleString('id-ID'),
          share: Number(share.toFixed(1)),
          rate: `${Number(ctr.toFixed(1))}% CTR`,
          status,
          statusColor,
          percentOfMax: Math.round((clicks / maxClicks) * 100),
        };
      });
    }

    // Fallback: If no breakdown yet but user has links in workspace
    if (links && links.length > 0) {
      return links.map((l, idx) => ({
        id: l.id || `ws-link-${idx}`,
        name: l.title || 'Tautan Bio',
        channel: l.url ? l.url.replace(/^https?:\/\//, '') : '-',
        position: `Posisi ${idx + 1}`,
        clicks: l.clicks || 0,
        clicksFormatted: (l.clicks || 0).toLocaleString('id-ID'),
        share: 0,
        rate: '0% CTR',
        status: 'Belum Ada Klik',
        statusColor: 'text-slate-500 bg-slate-50 border-slate-200/40',
        percentOfMax: 0,
      }));
    }

    return [];
  }, [linksBreakdown, links]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Performa dan Distribusi Tautan</h3>
          <p className="text-[11px] text-slate-500">Peringkat klik langsung dari database dan evaluasi penempatan tombol</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium text-slate-600 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'chart' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              Grafik Distribusi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'table' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              Tabel Status
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'links' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              Daftar Tautan ({links.length})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              + Tambah Tautan
            </button>
            <button
              type="button"
              onClick={handleCopyBio}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                copiedBio ? 'bg-emerald-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copiedBio ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <ShareIcon className="w-3.5 h-3.5" />
                  <span>Bagikan Bio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* View 1: Chart View (Horizontal Comparative Bars) */}
      {activeTab === 'chart' && (
        <div className="space-y-3 py-2">
          {displayItems.length > 0 ? (
            displayItems.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[280px] sm:max-w-md">
                    <span className="font-semibold text-slate-900 truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({item.position})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono text-xs">{item.clicksFormatted} klik</span>
                    <span className="text-[11px] text-slate-500 font-mono w-14 text-right">({item.share}%)</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Horizontal Bar - Unified Slate-900/800 scale */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(item.percentOfMax, 4)}%` }}
                    className="h-full rounded-full transition-all duration-300 bg-slate-800 hover:bg-slate-900"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada data interaksi tautan. Tambahkan tautan di Bio Editor dan mulai bagikan profil Anda.
            </div>
          )}

          {/* Actionable Guideline Note */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
              <span>
                {displayItems.length > 0 && displayItems[0].clicks > 0
                  ? `Tautan "${displayItems[0].name}" memimpin dengan rasio share ${displayItems[0].share}%. Pertahankan posisi teratas untuk konversi maksimal.`
                  : 'Tata letak tombol yang ringkas dan jelas meningkatkan rasio klik (CTR) profil bio hingga 64%.'}
              </span>
            </div>
            <button
              type="button"
              onClick={onNavigateToEditor || onOpenAddModal}
              className="text-slate-900 hover:underline font-semibold text-left sm:text-right shrink-0"
            >
              Atur Urutan Tautan
            </button>
          </div>
        </div>
      )}

      {/* View 2: Table View */}
      {activeTab === 'table' && (
        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-400">
                <th className="pb-3 font-medium">Tautan dan Saluran</th>
                <th className="pb-3 font-medium">Posisi Layar</th>
                <th className="pb-3 font-medium">Total Klik</th>
                <th className="pb-3 font-medium">Rasio Klik</th>
                <th className="pb-3 font-medium">Status Penempatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {displayItems.length > 0 ? (
                displayItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3">
                      <span className="font-semibold text-slate-900 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[220px] block">{item.channel}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-[11px] text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {item.position}
                      </span>
                    </td>
                    <td className="py-3 text-slate-800 font-bold font-mono">{item.clicksFormatted} Klik</td>
                    <td className="py-3 text-slate-600 font-semibold font-mono">{item.rate}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                    Belum ada data tautan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View 3: Live Custom Links from Backend */}
      {activeTab === 'links' && (
        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-400">
                <th className="pb-3 font-medium">Judul Tautan</th>
                <th className="pb-3 font-medium">URL Tujuan</th>
                <th className="pb-3 font-medium">Total Klik</th>
                <th className="pb-3 font-medium text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {links.length > 0 ? (
                links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">{link.title}</td>
                    <td className="py-3 text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                      {link.url}
                    </td>
                    <td className="py-3 text-slate-800 font-bold font-mono">{(link.clicks || link.click_count || 0).toLocaleString('id-ID')} Klik</td>
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
                  <td colSpan="4" className="py-6 text-center text-slate-400 text-xs">
                    Belum ada tautan bio khusus. Klik tombol "+ Tambah Tautan" untuk menambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
