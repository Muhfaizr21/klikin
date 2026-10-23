import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';
import StatCard from './StatCard';
import UpgradeProCard from './UpgradeProCard';
import RegularSellChart from './RegularSellChart';
import HourlyPeakChart from './HourlyPeakChart';
import TrafficSourceDonutChart from './TrafficSourceDonutChart';
import DailyMeetingCard from './DailyMeetingCard';
import TopStoreTable from './TopStoreTable';
import AudienceDeviceChart from './AudienceDeviceChart';
import AddLinkModal from './AddLinkModal';
import { AlertCircleIcon, CheckIcon } from '../Icons';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../lib/api';

const BioEditor = lazy(() => import('./editor/BioEditor'));
const OwnerAnalytics = lazy(() => import('./OwnerAnalytics'));
const OwnerCustomDomain = lazy(() => import('./OwnerCustomDomain'));
const OwnerEmailLeads = lazy(() => import('./OwnerEmailLeads'));
const OwnerBilling = lazy(() => import('./OwnerBilling'));
const OwnerPageSettings = lazy(() => import('./OwnerPageSettings'));
const OwnerAccountSettings = lazy(() => import('./OwnerAccountSettings'));
const OwnerNotifications = lazy(() => import('./OwnerNotifications'));
const OwnerSupport = lazy(() => import('./OwnerSupport'));

function OwnerViewLoader() {
  return (
    <div className="py-20 flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
        <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
        <span>Memuat modul...</span>
      </div>
    </div>
  );
}

const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // browser auto-play policy may block before initial user gesture
  }
};

export default function OwnerDashboard({ user, token, onLogout, initialTab = 'dashboard' }) {
  const [workspace, setWorkspace] = useState(null);
  const [_loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingLink, setSubmittingLink] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [leadsCount, setLeadsCount] = useState(0);

  const parseTabFromLocation = useCallback(() => {
    // 1. Pathname check: /owner/:tab
    const path = window.location.pathname.toLowerCase();
    const ownerMatch = path.match(/^\/owner(?:\/([a-z0-9_-]+))?/);
    if (ownerMatch && ownerMatch[1]) {
      const seg = ownerMatch[1];
      if (seg === 'editor-bio' || seg === 'editor' || seg === 'links') return 'links';
      if (['analytics', 'domain', 'leads', 'billing', 'settings', 'page-settings', 'notifications', 'support'].includes(seg)) {
        return seg;
      }
      if (seg === 'dashboard') return 'dashboard';
    }

    // 2. Hash check (backwards compatibility): #settings, #links, etc.
    const cleanHash = window.location.hash.toLowerCase().replace(/^#/, '');
    if (cleanHash === 'editor-bio' || cleanHash === 'editor' || cleanHash === 'links') return 'links';
    if (['analytics', 'domain', 'leads', 'billing', 'settings', 'page-settings', 'notifications', 'support'].includes(cleanHash)) {
      return cleanHash;
    }

    if (initialTab && initialTab !== 'dashboard') return initialTab;
    return 'dashboard';
  }, [initialTab]);

  const [activeTab, setActiveTab] = useState(parseTabFromLocation);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync route changes (browser back/forward button, external navigation)
  useEffect(() => {
    const handleLocationChange = () => {
      const tab = parseTabFromLocation();
      setActiveTab(tab);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Normalize URL on mount to clean /owner/:tab
    const currentTab = parseTabFromLocation();
    const canonicalPath = `/owner/${currentTab}`;
    if (window.location.pathname !== canonicalPath || window.location.hash) {
      window.history.replaceState(null, '', canonicalPath);
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [parseTabFromLocation]);

  // Update tab when initialTab prop changes from parent router
  useEffect(() => {
    if (initialTab) {
      setActiveTab((prev) => {
        if (initialTab !== prev) {
          const canonicalPath = `/owner/${initialTab}`;
          if (window.location.pathname !== canonicalPath) {
            window.history.replaceState(null, '', canonicalPath);
          }
          return initialTab;
        }
        return prev;
      });
    }
  }, [initialTab]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    const targetPath = `/owner/${tabId}`;
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const authToken = token || localStorage.getItem('klikin_token') || '';
  const effectiveUserId = user?.id || '';

  const fetchOwnerWorkspace = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/owner/workspace`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWorkspace(data.data);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal memuat ruang kerja' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Gagal terhubung ke backend: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/owner/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.status === 401) {
        if (onLogout) onLogout();
        return;
      }
      const data = await res.json();
      if (data.success && typeof data.data?.unread_count === 'number') {
        setUnreadCount(data.data.unread_count);
      }
    } catch {
      // silently fallback
    }
  }, [authToken, onLogout]);

  const fetchDashboardAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/owner/analytics?preset=7d`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.status === 401) {
        if (onLogout) onLogout();
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setAnalyticsData(data.data);
      }
    } catch (err) {
      console.warn('Gagal memuat analitik dashboard:', err);
    }
  }, [authToken, onLogout]);

  const fetchDashboardLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/owner/leads`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.status === 401) {
        if (onLogout) onLogout();
        return;
      }
      const data = await res.json();
      if (data.success && data.data?.total_leads !== undefined) {
        setLeadsCount(data.data.total_leads);
      }
    } catch {
      // fallback
    }
  }, [authToken, onLogout]);

  useEffect(() => {
    fetchOwnerWorkspace();
    fetchUnreadNotifications();
    fetchDashboardAnalytics();
    fetchDashboardLeads();

    // 1. Supabase Realtime Subscriptions (WebSocket live updates on notifications, analytics_events, leads, links)
    let notifsChannel;
    let eventsChannel;
    try {
      notifsChannel = supabase
        .channel(`realtime-notifs-${effectiveUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${effectiveUserId}`,
          },
          (payload) => {
            fetchUnreadNotifications();
            if (payload.eventType === 'INSERT') {
              playNotificationChime();
            }
          }
        )
        .subscribe();

      eventsChannel = supabase
        .channel(`realtime-events-${effectiveUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analytics_events',
          },
          () => {
            fetchDashboardAnalytics();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
          },
          () => {
            fetchDashboardLeads();
            fetchDashboardAnalytics();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'links',
          },
          () => {
            fetchOwnerWorkspace();
            fetchDashboardAnalytics();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Supabase Realtime not available:', err);
    }

    // 2. CustomEvent listeners from local actions (Mark read, delete, add link)
    const handleLocalNotifUpdate = () => {
      fetchUnreadNotifications();
    };
    const handleLocalAnalyticsUpdate = () => {
      fetchDashboardAnalytics();
      fetchDashboardLeads();
    };

    window.addEventListener('klikin:notifications-updated', handleLocalNotifUpdate);
    window.addEventListener('klikin:analytics-updated', handleLocalAnalyticsUpdate);
    window.addEventListener('klikin:workspace-updated', fetchOwnerWorkspace);

    // 3. Resilient Polling Heartbeat (every 12 seconds for live metrics)
    const heartbeat = setInterval(() => {
      fetchUnreadNotifications();
      fetchDashboardAnalytics();
    }, 12000);

    return () => {
      if (notifsChannel) {
        supabase.removeChannel(notifsChannel);
      }
      if (eventsChannel) {
        supabase.removeChannel(eventsChannel);
      }
      window.removeEventListener('klikin:notifications-updated', handleLocalNotifUpdate);
      window.removeEventListener('klikin:analytics-updated', handleLocalAnalyticsUpdate);
      window.removeEventListener('klikin:workspace-updated', fetchOwnerWorkspace);
      clearInterval(heartbeat);
    };
  }, [effectiveUserId, fetchOwnerWorkspace, fetchUnreadNotifications, fetchDashboardAnalytics, fetchDashboardLeads]);

  const handleAddLink = async (title, url) => {
    setSubmittingLink(true);
    try {
      const res = await fetch(`${API_BASE}/owner/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          url,
          icon: 'ShoppingBag',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        fetchOwnerWorkspace();
        setFeedback({ type: 'success', message: 'Tautan baru berhasil ditambahkan ke profil Anda!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menambahkan tautan' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmittingLink(false);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm('Hapus tautan ini dari halaman bio Anda?')) return;
    try {
      const res = await fetch(`${API_BASE}/owner/links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchOwnerWorkspace();
        setFeedback({ type: 'success', message: 'Tautan berhasil dihapus.' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menghapus tautan' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleExportAnalytics = async () => {
    try {
      const authToken = token || localStorage.getItem('klikin_token') || '';
      const res = await fetch(`${API_BASE}/owner/analytics/export?preset=7d`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!res.ok) throw new Error('Gagal mengekspor data');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klikin_dashboard_analytics_7d.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Gagal mengekspor data analitik: ' + err.message);
    }
  };

  // Live metric computations for Dashboard view
  const summary = analyticsData?.summary || {};
  const pageViews = summary.page_views || 0;
  const totalClicks = summary.total_clicks || 0;
  const totalInteractions = pageViews + totalClicks;
  const ctrVal = summary.ctr !== undefined ? summary.ctr : (pageViews > 0 ? (totalClicks / pageViews) * 100 : 0);

  const formattedTotalInteractions =
    totalInteractions >= 1000
      ? `${(totalInteractions / 1000).toFixed(1)}K`
      : totalInteractions.toLocaleString('id-ID');

  const formattedClicks =
    totalClicks >= 1000
      ? `${(totalClicks / 1000).toFixed(1)}K`
      : totalClicks.toLocaleString('id-ID');

  const topLink = analyticsData?.links_breakdown?.[0];
  const topLinkTitle = topLink?.title || (workspace?.links?.[0]?.title) || 'Belum Ada Tautan';
  const topLinkShare = topLink?.share_rate !== undefined ? Number(Number(topLink.share_rate).toFixed(1)) : Number(Number(topLink?.share || 0).toFixed(1));
  const topLinkClicks = topLink?.clicks || 0;
  const topLinkSubtext = topLinkClicks > 0
    ? `Menyumbang ${topLinkShare}% dari total ${formattedClicks} klik`
    : 'Menunggu klik interaksi pengunjung';

  let peakTimeLabel = '19:00 - 21:00';
  let peakSubtext = '+38% klik lebih banyak di malam hari';

  if (analyticsData?.hourly && analyticsData.hourly.length > 0) {
    const buckets = [
      { label: '00:00 - 06:00', start: 0, end: 6, count: 0, name: 'dini hari' },
      { label: '06:00 - 11:00', start: 6, end: 11, count: 0, name: 'pagi hari' },
      { label: '11:00 - 15:00', start: 11, end: 15, count: 0, name: 'siang hari' },
      { label: '15:00 - 18:00', start: 15, end: 18, count: 0, name: 'sore hari' },
      { label: '18:00 - 21:00', start: 18, end: 21, count: 0, name: 'malam hari' },
      { label: '21:00 - 24:00', start: 21, end: 24, count: 0, name: 'larut malam' },
    ];
    analyticsData.hourly.forEach((pt) => {
      const h = pt.hour;
      const sum = (pt.views || 0) + (pt.clicks || 0);
      const b = buckets.find((item) => h >= item.start && h < item.end);
      if (b) b.count += sum;
    });
    const sortedBuckets = [...buckets].sort((a, b) => b.count - a.count);
    const bestBucket = sortedBuckets[0];
    if (bestBucket && bestBucket.count > 0) {
      peakTimeLabel = bestBucket.label;
      const totalAllBuckets = buckets.reduce((acc, b) => acc + b.count, 0) || 1;
      const pct = Math.round((bestBucket.count / totalAllBuckets) * 100);
      peakSubtext = `${pct}% interaksi terpusat di ${bestBucket.name}`;
    } else {
      peakTimeLabel = 'Menunggu Trafik';
      peakSubtext = 'Akan terdeteksi otomatis setelah pengunjung aktif';
    }
  }

  const isPro = user?.is_pro || user?.plan === 'pro' || workspace?.is_pro || false;

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex font-sans selection:bg-[#bef264] selection:text-black">
      {/* Left Column: Full-Height Sidebar (Slide-over on mobile, docked on desktop) */}
      <OwnerSidebar
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        unreadCount={unreadCount}
      />

      {/* Right Column: Full-Height Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8 flex flex-col">
        <div className="w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6 pb-12">
          {/* Top Bar Header with Hamburger Toggle */}
          <OwnerHeader
            user={user}
            activeTab={activeTab}
            onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            onSelectTab={handleSelectTab}
            unreadCount={unreadCount}
          />

          {/* Feedback Alert if available */}
          {feedback && (
            <div
              className={`mb-5 p-3 rounded-xl text-xs flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Dynamic Content Based on Active Sidebar Tab */}
          <Suspense fallback={<OwnerViewLoader />}>
          {activeTab === 'editor' || activeTab === 'links' ? (
            <BioEditor
              user={user}
              token={token}
              workspace={workspace}
              onRefreshWorkspace={fetchOwnerWorkspace}
            />
          ) : activeTab === 'analytics' ? (
            <OwnerAnalytics
              user={user}
              token={token}
            />
          ) : activeTab === 'domain' ? (
            <OwnerCustomDomain
              user={user}
              token={token}
            />
          ) : activeTab === 'leads' ? (
            <OwnerEmailLeads
              user={user}
              token={token}
            />
          ) : activeTab === 'billing' ? (
            <OwnerBilling
              user={user}
              token={token}
              onRefreshUser={fetchOwnerWorkspace}
            />
          ) : activeTab === 'page-settings' ? (
            <OwnerPageSettings
              user={user}
              token={token}
            />
          ) : activeTab === 'settings' ? (
            <OwnerAccountSettings
              user={user}
              token={token}
              onRefreshUser={fetchOwnerWorkspace}
            />
          ) : activeTab === 'notifications' ? (
            <OwnerNotifications
              user={user}
              token={token}
            />
          ) : activeTab === 'support' ? (
            <OwnerSupport
              user={user}
              token={token}
            />
          ) : (
            /* Dashboard View: 5 Analytical Charts completely hooked to live data */
            <div className="space-y-6">
              {/* Top Row: Metric Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Interaksi Bio"
                  value={formattedTotalInteractions}
                  subtext={`${formattedClicks} Klik Tautan, Rasio Klik (CTR) ${ctrVal.toFixed(1)}%`}
                  theme="purple"
                />
                <StatCard
                  title="Tautan Terpopuler"
                  value={topLinkTitle}
                  subtext={topLinkSubtext}
                  theme="blue"
                />
                <StatCard
                  title="Waktu Puncak Trafik"
                  value={peakTimeLabel}
                  subtext={peakSubtext}
                  theme="mint"
                />
                <UpgradeProCard
                  isPro={isPro}
                  onUpgrade={() => handleSelectTab('billing')}
                />
              </div>

              {/* Section 1: Interaction Trends & Hourly Activity (Charts 1 & 2) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Chart 1: Kunjungan Profil vs Klik Tautan (7 cols) */}
                <div className="lg:col-span-7">
                  <RegularSellChart
                    timeline={analyticsData?.timeline || []}
                    onExport={handleExportAnalytics}
                  />
                </div>

                {/* Chart 2: Sebaran Jam Kunjungan 24 Jam (5 cols) */}
                <div className="lg:col-span-5">
                  <HourlyPeakChart
                    hourly={analyticsData?.hourly || []}
                  />
                </div>
              </div>

              {/* Section 2: Referral Composition & Bio Status (Chart 3 & Live Status) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Chart 3: Komposisi Kanal Rujukan Donut Chart (7 cols) */}
                <div className="lg:col-span-7">
                  <TrafficSourceDonutChart
                    sources={analyticsData?.traffic_sources || []}
                  />
                </div>

                {/* Live Bio Status (5 cols) */}
                <div className="lg:col-span-5">
                  <DailyMeetingCard
                    slug={workspace?.slug || user?.username || 'kopiseduh'}
                    customDomain={workspace?.custom_domain?.domain}
                    visitorsCount={analyticsData?.summary?.unique_visitors || 0}
                    realtimeActive={analyticsData?.summary?.realtime_active || 0}
                    onNavigateToEditor={() => handleSelectTab('editor')}
                  />
                </div>
              </div>

              {/* Section 3: Link Performance & Audience Funnel (Charts 4 & 5) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Chart 4: Performa dan Distribusi Tautan (7 cols) */}
                <div className="lg:col-span-7">
                  <TopStoreTable
                    links={workspace?.links || []}
                    linksBreakdown={analyticsData?.links_breakdown || []}
                    onDeleteLink={handleDeleteLink}
                    onOpenAddModal={() => setIsAddModalOpen(true)}
                    onNavigateToEditor={() => handleSelectTab('editor')}
                  />
                </div>

                {/* Chart 5: Karakteristik Perangkat & Corong Konversi (5 cols) */}
                <div className="lg:col-span-5">
                  <AudienceDeviceChart
                    devices={analyticsData?.devices || []}
                    summary={analyticsData?.summary || {}}
                    leadsCount={leadsCount}
                    onAddLeadForm={() => handleSelectTab('leads')}
                  />
                </div>
              </div>
            </div>
          )}
          </Suspense>
        </div>
      </main>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLink={handleAddLink}
        loading={submittingLink}
      />
    </div>
  );
}
