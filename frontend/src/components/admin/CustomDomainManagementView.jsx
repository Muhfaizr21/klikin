import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../lib/api';
import {
  GlobeIcon,
  LockIcon,
  ServerIcon,
  RefreshCwIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
} from '../Icons';
import DomainDetailDrawer from './DomainDetailDrawer';
import {
  TriggerSSLModal,
  SendDNSGuideModal,
  ReleaseDomainModal,
  UpdateDomainStatusModal,
  AdminAddDomainModal,
} from './DomainActionModals';

function formatDateID(dateStr) {
  if (!dateStr) return 'Belum dicek';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status) {
  const s = (status || 'pending').toLowerCase();
  switch (s) {
    case 'active':
      return {
        label: 'ACTIVE',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-600',
      };
    case 'verifying':
      return {
        label: 'VERIFYING',
        cls: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-600',
      };
    case 'error':
      return {
        label: 'ERROR',
        cls: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-600',
      };
    case 'expired':
      return {
        label: 'EXPIRED',
        cls: 'bg-slate-200 text-slate-800 border-slate-300',
        dot: 'bg-slate-600',
      };
    default:
      return {
        label: 'PENDING',
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-600',
      };
  }
}

function getSSLBadge(sslStatus) {
  const s = (sslStatus || 'provisioning').toLowerCase();
  switch (s) {
    case 'active':
      return {
        label: 'Active (Auto-Renew)',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'failed':
      return {
        label: 'SSL Failed',
        cls: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    case 'expired':
      return {
        label: 'SSL Expired',
        cls: 'bg-slate-200 text-slate-800 border-slate-300',
      };
    default:
      return {
        label: 'Provisioning',
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
      };
  }
}

export default function CustomDomainManagementView({ token, onRefreshParent }) {
  const [activeSubTab, setActiveSubTab] = useState('domains');

  // Directory State
  const [kpi, setKpi] = useState({
    total_domains: 0,
    active_domains: 0,
    pending_domains: 0,
    verifying_domains: 0,
    error_domains: 0,
    expired_domains: 0,
    ssl_active_count: 0,
    ssl_provisioning_count: 0,
    ssl_failed_or_expired_count: 0,
    total_dns_errors: 0,
    guides_sent_total: 0,
  });
  const [domains, setDomains] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    limit: 15,
    total_items: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sslFilter, setSslFilter] = useState('all');
  const [sortBy, setSortBy] = useState('errors_first');
  const [page, setPage] = useState(1);

  // Diagnostic Logs Tab State
  const [diagLogs, setDiagLogs] = useState([]);
  const [diagPagination, setDiagPagination] = useState({
    current_page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState(null);
  const [diagSearch, setDiagSearch] = useState('');
  const [diagEventType, setDiagEventType] = useState('all');
  const [diagSeverity, setDiagSeverity] = useState('all');
  const [diagPage, setDiagPage] = useState(1);

  // Drawer 360 State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Action Modals State
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [sslModalTarget, setSslModalTarget] = useState(null);
  const [guideModalTarget, setGuideModalTarget] = useState(null);
  const [releaseModalTarget, setReleaseModalTarget] = useState(null);
  const [statusModalTarget, setStatusModalTarget] = useState(null);
  const [addDomainModalOpen, setAddDomainModalOpen] = useState(false);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const params = new URLSearchParams({
        search: search.trim(),
        status: statusFilter,
        ssl_status: sslFilter,
        sort: sortBy,
        page: String(page),
        limit: '15',
      });
      const res = await fetch(`${API_BASE}/admin/domains?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat daftar domain kustom');
      }
      setKpi(json.data?.kpi || {});
      setDomains(json.data?.domains || []);
      setPagination(
        json.data?.pagination || {
          current_page: 1,
          limit: 15,
          total_items: 0,
          total_pages: 1,
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, sslFilter, sortBy, page]);

  const fetchDiagnosticLogs = useCallback(async () => {
    setDiagLoading(true);
    setDiagError(null);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const params = new URLSearchParams({
        search: diagSearch.trim(),
        event_type: diagEventType,
        severity: diagSeverity,
        page: String(diagPage),
        limit: '20',
      });
      const res = await fetch(`${API_BASE}/admin/domains/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat log diagnostik DNS');
      }
      setDiagLogs(json.data?.logs || []);
      setDiagPagination(
        json.data?.pagination || {
          current_page: 1,
          limit: 20,
          total_items: 0,
          total_pages: 1,
        }
      );
    } catch (err) {
      setDiagError(err.message);
    } finally {
      setDiagLoading(false);
    }
  }, [token, diagSearch, diagEventType, diagSeverity, diagPage]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  useEffect(() => {
    if (activeSubTab === 'logs') {
      fetchDiagnosticLogs();
    }
  }, [activeSubTab, fetchDiagnosticLogs]);

  const openDomainInspector = async (domainID) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerError(null);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const res = await fetch(`${API_BASE}/admin/domains/${domainID}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat detail diagnostik domain');
      }
      setSelectedDetail(json.data);
    } catch (err) {
      setDrawerError(err.message);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleReverifySingleDNS = async (domainID, forceVerify = false) => {
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const res = await fetch(`${API_BASE}/admin/domains/${domainID}/reverify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          force_verify: forceVerify,
          admin_note: forceVerify ? 'Force verification oleh Super Admin' : 'Re-verifikasi DNS manual oleh Super Admin',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memverifikasi DNS domain');
      }
      const updated = json.data;
      if (updated?.status === 'active') {
        showToast('success', `DNS domain ${updated.domain} valid dan sertifikat SSL telah aktif.`);
      } else {
        showToast('error', `DNS domain ${updated?.domain || ''} masih gagal: ${updated?.error_message || 'CNAME belum mengarah ke cname.klikin.id'}`);
      }
      await fetchDomains();
      if (drawerOpen && selectedDetail?.domain?.id === domainID) {
        await openDomainInspector(domainID);
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkReverifyAll = async () => {
    setBulkLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const res = await fetch(`${API_BASE}/admin/domains/reverify-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menjalankan pengecekan massal DNS');
      }
      const sum = json.data || {};
      showToast(
        'success',
        `Pengecekan massal selesai: ${sum.total_checked || 0} domain diperiksa (${sum.verified_active || 0} aktif, ${sum.pending_or_error || 0} butuh perbaikan DNS).`
      );
      await fetchDomains();
      if (activeSubTab === 'logs') {
        await fetchDiagnosticLogs();
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleConfirmTriggerSSL = async (domainID, payload) => {
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const res = await fetch(`${API_BASE}/admin/domains/${domainID}/ssl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menerbitkan ulang sertifikat SSL');
      }
      setSslModalTarget(null);
      showToast('success', `Sertifikat SSL (${payload.issuer}) berhasil diterbitkan untuk ${json.data?.domain}.`);
      await fetchDomains();
      if (drawerOpen && selectedDetail?.domain?.id === domainID) {
        await openDomainInspector(domainID);
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSendGuide = async (domainID, payload) => {
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const res = await fetch(`${API_BASE}/admin/domains/${domainID}/send-guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengirim panduan DNS');
      }
      setGuideModalTarget(null);
      showToast('success', `Panduan DNS untuk ${json.data?.domain} telah dikirim ke @${json.data?.owner_username}.`);
      await fetchDomains();
      if (drawerOpen && selectedDetail?.domain?.id === domainID) {
        await openDomainInspector(domainID);
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReleaseDomain = async (domainID, payload) => {
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const targetName = releaseModalTarget?.domain || '';
      const res = await fetch(`${API_BASE}/admin/domains/${domainID}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal melepas domain kustom');
      }
      setReleaseModalTarget(null);
      if (drawerOpen && selectedDetail?.domain?.id === domainID) {
        setDrawerOpen(false);
        setSelectedDetail(null);
      }
      showToast('success', `Domain ${targetName} berhasil dilepas dari halaman tenant.`);
      await fetchDomains();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmUpdateStatus = async (domainID, payload) => {
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const res = await fetch(`${API_BASE}/admin/domains/${domainID}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui status domain');
      }
      setStatusModalTarget(null);
      showToast('success', `Status domain ${json.data?.domain} diperbarui menjadi [DNS: ${payload.status}, SSL: ${payload.ssl_status}].`);
      await fetchDomains();
      if (drawerOpen && selectedDetail?.domain?.id === domainID) {
        await openDomainInspector(domainID);
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAddDomain = async (payload) => {
    setActionLoading(true);
    try {
      const authToken = token || localStorage.getItem('klikin_token');
      const res = await fetch(`${API_BASE}/admin/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghubungkan domain kustom');
      }
      setAddDomainModalOpen(false);
      showToast('success', `Domain ${json.data?.domain} berhasil dihubungkan ke halaman /${json.data?.page_slug}.`);
      await fetchDomains();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!domains.length) {
      showToast('error', 'Tidak ada data domain untuk diekspor.');
      return;
    }
    const headers = [
      'ID Domain',
      'Domain Kustom',
      'Status DNS',
      'Status SSL',
      'Otoritas SSL',
      'Slug Halaman',
      'Username Pemilik',
      'Email Pemilik',
      'CNAME Target',
      'TXT Record',
      'Kode Error Terakhir',
      'Terakhir Dicek',
    ];
    const rows = domains.map((d) => [
      d.id,
      d.domain,
      d.status,
      d.ssl_status,
      d.ssl_issuer || "Let's Encrypt R3",
      `/${d.page_slug}`,
      `@${d.owner_username}`,
      d.owner_email || '-',
      d.cname_target,
      d.txt_record_name,
      d.last_error_code || 'OK',
      d.last_checked_at || '-',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `klikin-custom-domains-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `Berhasil mengekspor ${domains.length} data domain kustom ke format CSV.`);
  };

  const totalDom = Math.max(kpi.total_domains || 0, 1);
  const activePct = Math.round(((kpi.active_domains || 0) / totalDom) * 100);
  const pendingVerifyingPct = Math.round((((kpi.pending_domains || 0) + (kpi.verifying_domains || 0)) / totalDom) * 100);
  const issuePct = Math.max(0, 100 - activePct - pendingVerifyingPct);

  return (
    <div className="space-y-6">
      {/* Top Feedback Toast */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Tutup notifikasi"
            className="px-2 py-0.5 rounded-lg text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Manajemen Domain Kustom & Infrastruktur SSL
            </h2>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold">
              EDGE ROUTER: cname.klikin.id
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Pusat kendali resolusi CNAME/TXT seluruh tenant, penerbitan sertifikat SSL Let&apos;s Encrypt, pelepasan domain pelanggar, dan pengiriman panduan DNS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddDomainModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          >
            + Hubungkan Domain ke Tenant
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          >
            Ekspor CSV
          </button>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={handleBulkReverifyAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${bulkLoading ? 'animate-spin' : ''}`} />
            <span>{bulkLoading ? 'Memverifikasi Semua DNS...' : 'Re-Verify Semua DNS'}</span>
          </button>
        </div>
      </div>

      {/* Asymmetric Infrastructure Telemetry Section (RHYTHM 2: 7-col DNS Distribution Panel + 5-col SSL & Error Telemetry) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Columns: DNS Resolution Distribution & Quick Status Filter */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Distribusi Status Resolusi DNS Tenant
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">{kpi.total_domains || 0}</span>
                <span className="text-xs text-slate-600 font-medium">
                  Domain terdaftar ({kpi.active_domains || 0} aktif melayani trafik produksi)
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activePct}% Rasio Terverifikasi
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                style={{ width: `${activePct}%` }}
                className="bg-emerald-600 transition-all duration-300"
                title={`Active: ${kpi.active_domains || 0}`}
              />
              <div
                style={{ width: `${pendingVerifyingPct}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Pending / Verifying: ${(kpi.pending_domains || 0) + (kpi.verifying_domains || 0)}`}
              />
              <div
                style={{ width: `${issuePct}%` }}
                className="bg-rose-600 transition-all duration-300"
                title={`Error / Expired: ${(kpi.error_domains || 0) + (kpi.expired_domains || 0)}`}
              />
            </div>

            {/* Interactive Status Breakdown Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[
                { key: 'active', label: 'Active', count: kpi.active_domains || 0, dot: 'bg-emerald-600' },
                { key: 'verifying', label: 'Verifying', count: kpi.verifying_domains || 0, dot: 'bg-indigo-600' },
                { key: 'pending', label: 'Pending', count: kpi.pending_domains || 0, dot: 'bg-amber-500' },
                { key: 'error', label: 'Error DNS', count: kpi.error_domains || 0, dot: 'bg-rose-600' },
                { key: 'expired', label: 'Expired', count: kpi.expired_domains || 0, dot: 'bg-slate-600' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => {
                    setActiveSubTab('domains');
                    setStatusFilter(statusFilter === st.key ? 'all' : st.key);
                    setPage(1);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 ${
                    statusFilter === st.key
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-2 h-2 rounded-full ${statusFilter === st.key ? 'bg-white' : st.dot}`} />
                    <span className="font-mono text-sm font-bold">{st.count}</span>
                  </div>
                  <span
                    className={`block text-[11px] font-semibold mt-1 ${
                      statusFilter === st.key ? 'text-slate-200' : 'text-slate-600'
                    }`}
                  >
                    {st.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: SSL Provisioning Health & Diagnostic Error Counter */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Kesehatan SSL / TLS
              </span>
              <LockIcon className="w-4 h-4 text-slate-700" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">{kpi.ssl_active_count || 0}</span>
                <span className="text-xs font-semibold text-emerald-800">Sertifikat Aktif</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {kpi.ssl_provisioning_count || 0} antrean ACME • {kpi.ssl_failed_or_expired_count || 0} gagal/expired
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('domains');
                setSslFilter(sslFilter === 'failed' ? 'all' : 'failed');
                setPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-[11px] font-bold text-slate-800 text-center focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              {sslFilter === 'failed' ? 'Tampilkan Semua SSL' : 'Filter SSL Bermasalah'}
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Log Error & Panduan
              </span>
              <ServerIcon className="w-4 h-4 text-rose-600" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-700 font-mono">{kpi.total_dns_errors || 0}</span>
                <span className="text-xs font-semibold text-slate-700">Insiden DNS/SSL</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {kpi.guides_sent_total || 0} panduan konfigurasi DNS telah dikirim ke owner
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === 'logs' ? 'domains' : 'logs')}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-white text-center focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
            >
              {activeSubTab === 'logs' ? 'Kembali ke Direktori Domain' : 'Buka Log Error DNS'}
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('domains')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 ${
              activeSubTab === 'domains'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Direktori Semua Domain Kustom ({kpi.total_domains || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('logs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 flex items-center gap-2 ${
              activeSubTab === 'logs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Log Error DNS & Riwayat Provisioning</span>
            {(kpi.total_dns_errors || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-mono text-[10px] font-bold">
                {kpi.total_dns_errors}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: CUSTOM DOMAINS DIRECTORY */}
      {activeSubTab === 'domains' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 relative">
              <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari domain, slug halaman, username, email, atau kode error..."
                aria-label="Cari domain kustom"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter status DNS"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="all">Semua Status DNS</option>
                <option value="active">Status: Active</option>
                <option value="verifying">Status: Verifying</option>
                <option value="pending">Status: Pending</option>
                <option value="error">Status: Error DNS</option>
                <option value="expired">Status: Expired</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={sslFilter}
                onChange={(e) => {
                  setSslFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter status SSL"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="all">Semua Status SSL</option>
                <option value="active">SSL: Active</option>
                <option value="provisioning">SSL: Provisioning</option>
                <option value="failed">SSL: Failed</option>
                <option value="expired">SSL: Expired</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                aria-label="Urutkan daftar domain"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="errors_first">Prioritas: Error & Expired Teratas</option>
                <option value="newest">Terbaru Diperbarui</option>
                <option value="checked_desc">Terakhir Dicek DNS</option>
                <option value="domain_asc">Nama Domain (A-Z)</option>
                <option value="oldest">Paling Lama Terdaftar</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-600 space-y-3">
              <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
              <p className="font-mono text-xs">Memuat direktori domain kustom dari database...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-8 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
                <AlertCircleIcon className="w-4 h-4 text-rose-600" />
                <span>{error}</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={fetchDomains}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Muat Ulang Data
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && domains.length === 0 && (
            <div className="py-14 px-4 text-center space-y-3">
              <GlobeIcon className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Tidak Ada Domain Kustom yang Cocok</p>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Belum ada domain kustom yang memenuhi filter pencarian Anda, atau Anda dapat menghubungkan domain baru ke halaman tenant.
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setSslFilter('all');
                    setPage(1);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Reset Filter
                </button>
                <button
                  type="button"
                  onClick={() => setAddDomainModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  + Hubungkan Domain Baru
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          {!loading && !error && domains.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-4">Domain Kustom & Target</th>
                    <th className="py-3.5 px-4">Pemilik (Tenant)</th>
                    <th className="py-3.5 px-4">Status DNS</th>
                    <th className="py-3.5 px-4">Status Sertifikat SSL</th>
                    <th className="py-3.5 px-4">Diagnostik & Pemeriksaan</th>
                    <th className="py-3.5 px-4 text-right">Tindakan Infrastruktur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {domains.map((item) => {
                    const stBadge = getStatusBadge(item.status);
                    const sslBadge = getSSLBadge(item.ssl_status);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openDomainInspector(item.id)}
                                className="font-mono font-bold text-slate-900 hover:text-indigo-700 underline decoration-slate-300 hover:decoration-indigo-700 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 rounded-xs"
                              >
                                {item.domain}
                              </button>
                              <a
                                href={`/${item.page_slug}`}
                                target="_blank"
                                rel="noreferrer"
                                title={`Buka halaman /${item.page_slug}`}
                                className="text-slate-500 hover:text-slate-900"
                              >
                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
                              <span>Target: /{item.page_slug}</span>
                              <span>•</span>
                              <span>CNAME: {item.cname_target}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-top">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">@{item.owner_username || 'tenant'}</span>
                              {item.owner_is_pro && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-slate-900 text-white font-mono text-[9px] font-bold">
                                  PRO
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600">{item.owner_email || '-'}</p>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold ${stBadge.cls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stBadge.dot}`} />
                            <span>{stBadge.label}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold ${sslBadge.cls}`}
                            >
                              {sslBadge.label}
                            </span>
                            <p className="text-[11px] text-slate-600 font-mono">
                              {item.ssl_issuer || "Let's Encrypt R3"}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-top max-w-xs">
                          {item.error_message ? (
                            <div className="space-y-1">
                              {item.last_error_code && (
                                <span className="inline-block px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-900 font-mono text-[10px] font-bold">
                                  {item.last_error_code}
                                </span>
                              )}
                              <p className="text-[11px] text-rose-800 line-clamp-2 leading-snug">
                                {item.error_message}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-0.5 text-[11px] text-slate-600">
                              <span className="font-semibold text-emerald-800 block">Record CNAME & TXT Valid</span>
                              <span className="font-mono text-[10px] block">
                                Dicek: {formatDateID(item.last_checked_at)}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 align-top text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleReverifySingleDNS(item.id, false)}
                              title="Re-Verify DNS Manual"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[11px] focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
                            >
                              Cek DNS
                            </button>

                            <button
                              type="button"
                              onClick={() => setSslModalTarget(item)}
                              title="Trigger Ulang Provisioning SSL"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[11px] focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
                            >
                              SSL
                            </button>

                            <button
                              type="button"
                              onClick={() => setGuideModalTarget(item)}
                              title="Kirim Panduan DNS ke User"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[11px] focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
                            >
                              Panduan
                            </button>

                            <button
                              type="button"
                              onClick={() => openDomainInspector(item.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
                            >
                              Detail
                            </button>

                            <button
                              type="button"
                              onClick={() => setReleaseModalTarget(item)}
                              title="Lepas Domain (Jika Abuse)"
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] focus-visible:ring-2 focus-visible:ring-rose-700 cursor-pointer"
                            >
                              Lepas
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && !error && domains.length > 0 && (
            <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <span>
                Menampilkan <strong className="text-slate-900">{domains.length}</strong> dari{' '}
                <strong className="text-slate-900">{pagination.total_items || domains.length}</strong> domain kustom
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={(pagination.current_page || 1) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-800 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <span className="font-mono font-bold text-slate-900 px-2">
                  Hal. {pagination.current_page || 1} / {pagination.total_pages || 1}
                </span>
                <button
                  type="button"
                  disabled={(pagination.current_page || 1) >= (pagination.total_pages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-800 cursor-pointer"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GLOBAL DNS ERROR & DIAGNOSTIC LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={diagSearch}
                onChange={(e) => {
                  setDiagSearch(e.target.value);
                  setDiagPage(1);
                }}
                placeholder="Cari domain, kode error (DNS_CNAME_MISMATCH), atau pesan..."
                aria-label="Cari log error DNS"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>

            <select
              value={diagEventType}
              onChange={(e) => {
                setDiagEventType(e.target.value);
                setDiagPage(1);
              }}
              aria-label="Filter tipe event diagnostik"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <option value="all">Semua Tipe Event DNS/SSL</option>
              <option value="DNS_ERROR">DNS_ERROR (Gagal Resolusi DNS)</option>
              <option value="SSL_ERROR">SSL_ERROR (Gagal Sertifikat SSL)</option>
              <option value="DNS_CHECK">DNS_CHECK (Verifikasi Berhasil)</option>
              <option value="SSL_PROVISION">SSL_PROVISION (Penerbitan SSL)</option>
              <option value="GUIDE_SENT">GUIDE_SENT (Kirim Panduan DNS)</option>
              <option value="DOMAIN_DETACHED">DOMAIN_DETACHED (Lepas Domain)</option>
              <option value="STATUS_OVERRIDE">STATUS_OVERRIDE (Ubah Manual)</option>
            </select>

            <select
              value={diagSeverity}
              onChange={(e) => {
                setDiagSeverity(e.target.value);
                setDiagPage(1);
              }}
              aria-label="Filter tingkat keparahan log"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <option value="all">Semua Tingkat Keparahan</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          {diagLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-600 space-y-3">
              <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
              <p className="font-mono text-xs">Memuat log diagnostik DNS...</p>
            </div>
          )}

          {!diagLoading && diagError && (
            <div className="p-8 text-center text-rose-800 text-xs font-bold">{diagError}</div>
          )}

          {!diagLoading && !diagError && diagLogs.length === 0 && (
            <div className="py-14 text-center text-xs text-slate-600">
              Tidak ada catatan log diagnostik DNS untuk filter yang dipilih.
            </div>
          )}

          {!diagLoading && !diagError && diagLogs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4">Domain & Halaman</th>
                    <th className="py-3.5 px-4">Event & Kode Error</th>
                    <th className="py-3.5 px-4">Rincian Diagnostik</th>
                    <th className="py-3.5 px-4">Aktor / Resolver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {diagLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap align-top">
                        {formatDateID(log.created_at)}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-mono font-bold text-slate-900 block">{log.domain_name}</span>
                        <span className="text-[11px] text-slate-600 font-mono">
                          /{log.page_slug || '-'} (@{log.owner_username || 'tenant'})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                              log.severity === 'error' || log.severity === 'critical'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : log.severity === 'warning'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            {log.event_type}
                          </span>
                          {log.error_code && (
                            <span className="font-mono text-[10px] font-bold text-slate-700">
                              [{log.error_code}]
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top max-w-md">
                        <p className="text-slate-800 leading-relaxed">{log.message}</p>
                        {log.resolved_cname && (
                          <span className="font-mono text-[10px] text-slate-600 block mt-0.5">
                            Resolved CNAME: {log.resolved_cname}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-top font-mono text-[11px] text-slate-700">
                        {log.actor_name || 'Automated DNS Resolver'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!diagLoading && !diagError && diagLogs.length > 0 && (
            <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
              <span>Total {diagPagination.total_items || diagLogs.length} catatan log</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={(diagPagination.current_page || 1) <= 1}
                  onClick={() => setDiagPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-800 cursor-pointer"
                >
                  Sebelumnya
                </button>
                <span className="font-mono font-bold text-slate-900">
                  Hal. {diagPagination.current_page || 1} / {diagPagination.total_pages || 1}
                </span>
                <button
                  type="button"
                  disabled={(diagPagination.current_page || 1) >= (diagPagination.total_pages || 1)}
                  onClick={() => setDiagPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-800 cursor-pointer"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 360 Domain Inspector Drawer */}
      <DomainDetailDrawer
        isOpen={drawerOpen}
        loading={drawerLoading}
        error={drawerError}
        detail={selectedDetail}
        actionLoading={actionLoading}
        onClose={() => setDrawerOpen(false)}
        onReverifyDNS={handleReverifySingleDNS}
        onOpenTriggerSSL={(dom) => setSslModalTarget(dom)}
        onOpenSendGuide={(dom) => setGuideModalTarget(dom)}
        onOpenReleaseDomain={(dom) => setReleaseModalTarget(dom)}
        onOpenUpdateStatus={(dom) => setStatusModalTarget(dom)}
      />

      {/* Modals */}
      <TriggerSSLModal
        isOpen={Boolean(sslModalTarget)}
        domainItem={sslModalTarget}
        loading={actionLoading}
        onClose={() => setSslModalTarget(null)}
        onConfirm={handleConfirmTriggerSSL}
      />

      <SendDNSGuideModal
        isOpen={Boolean(guideModalTarget)}
        domainItem={guideModalTarget}
        loading={actionLoading}
        onClose={() => setGuideModalTarget(null)}
        onConfirm={handleConfirmSendGuide}
      />

      <ReleaseDomainModal
        isOpen={Boolean(releaseModalTarget)}
        domainItem={releaseModalTarget}
        loading={actionLoading}
        onClose={() => setReleaseModalTarget(null)}
        onConfirm={handleConfirmReleaseDomain}
      />

      <UpdateDomainStatusModal
        isOpen={Boolean(statusModalTarget)}
        domainItem={statusModalTarget}
        loading={actionLoading}
        onClose={() => setStatusModalTarget(null)}
        onConfirm={handleConfirmUpdateStatus}
      />

      <AdminAddDomainModal
        isOpen={addDomainModalOpen}
        loading={actionLoading}
        onClose={() => setAddDomainModalOpen(false)}
        onConfirm={handleConfirmAddDomain}
      />
    </div>
  );
}
