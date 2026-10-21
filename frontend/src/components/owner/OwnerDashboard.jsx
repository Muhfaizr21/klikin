import React, { useState, useEffect } from 'react';
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';
import StatCard from './StatCard';
import UpgradeProCard from './UpgradeProCard';
import RegularSellChart from './RegularSellChart';
import MoreAnalysisCard from './MoreAnalysisCard';
import DailyMeetingCard from './DailyMeetingCard';
import TopStoreTable from './TopStoreTable';
import TeamMemberCard from './TeamMemberCard';
import AddLinkModal from './AddLinkModal';
import { AlertCircleIcon, CheckIcon } from '../Icons';

const API_BASE = 'http://localhost:8080/api';

export default function OwnerDashboard({ user, token, onLogout }) {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingLink, setSubmittingLink] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchOwnerWorkspace();
  }, [user]);

  const fetchOwnerWorkspace = async () => {
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
  };

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex font-sans selection:bg-[#bef264] selection:text-black">
      {/* Left Column: Full-Height Edge-to-Edge Sidebar */}
      <OwnerSidebar
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Right Column: Full-Height Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-[#f8fafc] p-6 lg:p-8 flex flex-col">
        <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
          {/* Top Bar Header */}
          <OwnerHeader user={user} />

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

          {/* Grid Layout Matching Reference Image */}
          <div className="space-y-6">
            {/* Row 1: Top Stat Cards (3 Pastel cards + 1 Upgrade Pro card) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Earning"
                value="242.65K"
                subtext="From the running month"
                theme="purple"
              />
              <StatCard
                title="Average Earning"
                value="17.347K"
                subtext="Daily Earning of this month"
                theme="blue"
              />
              <StatCard
                title="Conversation Rate"
                value="74.86%"
                subtext="+6.04% greater than last month"
                theme="mint"
              />
              <UpgradeProCard />
            </div>

            {/* Row 2: Middle Section (Regular Sell Chart, More Analysis, Daily Meeting) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Regular Sell (Chart) spans 5 cols */}
              <div className="lg:col-span-5">
                <RegularSellChart />
              </div>

              {/* More Analysis spans 4 cols */}
              <div className="lg:col-span-4">
                <MoreAnalysisCard />
              </div>

              {/* Daily Meeting spans 3 cols */}
              <div className="lg:col-span-3">
                <DailyMeetingCard
                  slug={workspace?.page?.slug || user?.username || 'kopiseduh'}
                />
              </div>
            </div>

            {/* Row 3: Bottom Section (Top Store Table & Team Member) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Top Store (Table) spans 8 cols */}
              <div className="lg:col-span-8">
                <TopStoreTable
                  links={workspace?.links || []}
                  onDeleteLink={handleDeleteLink}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                />
              </div>

              {/* Team Member Card spans 4 cols */}
              <div className="lg:col-span-4">
                <TeamMemberCard />
              </div>
            </div>
          </div>
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
