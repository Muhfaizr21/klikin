import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProfileEditor from './ProfileEditor';
import BlocksManager from './BlocksManager';
import ThemeSelector from './ThemeSelector';
import ProCustomizer from './ProCustomizer';
import SeoSettings from './SeoSettings';
import MobilePreviewFrame from './MobilePreviewFrame';
import FullscreenPreviewModal from './FullscreenPreviewModal';
import ShareModal from './ShareModal';
import {
  LayersIcon,
  PaletteIcon,
  SettingsIcon,
  GlobeIcon,
  CheckIcon,
  EyeIcon,
  CopyIcon,
  ExternalLinkIcon,
  SparklesIcon,
  SlidersIcon,
  AlertCircleIcon,
  PencilIcon,
  Share2Icon,
  CloudCheckIcon,
  CloudSyncIcon,
} from '../../Icons';
import { API_BASE } from '../../../lib/api';

export default function BioEditor({
  user,
  token,
  workspace,
  onRefreshWorkspace,
}) {
  const [activeSubTab, setActiveSubTab] = useState('blok'); // 'blok' | 'profil' | 'tema' | 'pro' | 'seo'
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [feedback, setFeedback] = useState(null);
  const initialLoadRef = useRef(true);

  // Local draft state for BioPage settings
  const [pageDraft, setPageDraft] = useState({
    title: '',
    bio: '',
    avatar_url: '',
    is_verified: false,
    theme: 'clean-minimal',
    background_color: '#ffffff',
    button_color: '#0f172a',
    button_text_color: '#ffffff',
    font_family: 'sans',
    button_radius: 'rounded-xl',
    button_shadow: 'shadow-xs',
    custom_css: '',
    block_spacing: 'normal',
    page_shadow: 'none',
    bg_image_url: '',
    favicon_url: '',
    meta_title: '',
    meta_description: '',
    og_image: '',
    is_published: true,
    slug: 'kopiseduh',
  });

  // Local draft state for Blocks
  const [blocksDraft, setBlocksDraft] = useState([]);

  // Initialize draft when workspace loads or updates
  useEffect(() => {
    if (workspace) {
      setPageDraft({
        title: workspace.title || 'Kopi Seduh Nusantara',
        bio: workspace.bio || '',
        avatar_url: workspace.avatar_url || '',
        is_verified: workspace.is_verified || false,
        theme: workspace.theme || 'clean-minimal',
        background_color: workspace.background_color || '#ffffff',
        button_color: workspace.button_color || '#0f172a',
        button_text_color: workspace.button_text_color || '#ffffff',
        font_family: workspace.font_family || 'sans',
        button_radius: workspace.button_radius || 'rounded-xl',
        button_shadow: workspace.button_shadow || 'shadow-xs',
        custom_css: workspace.custom_css || '',
        block_spacing: workspace.block_spacing || 'normal',
        page_shadow: workspace.page_shadow || 'none',
        bg_image_url: workspace.bg_image_url || '',
        favicon_url: workspace.favicon_url || '',
        meta_title: workspace.meta_title || '',
        meta_description: workspace.meta_description || '',
        og_image: workspace.og_image || '',
        is_published: workspace.is_published !== false,
        slug: workspace.slug || user?.username || 'kopiseduh',
      });

      if (workspace.blocks && workspace.blocks.length > 0) {
        setBlocksDraft(workspace.blocks);
      }
      setTimeout(() => {
        initialLoadRef.current = false;
        setAutoSaveStatus('saved');
      }, 500);
    }
  }, [workspace, user]);

  // Handle single field change in pageDraft
  const handleChangeField = (field, value) => {
    setPageDraft((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    setAutoSaveStatus('unsaved');
  };

  // Debounced Cloud Auto-Save (1500ms delay)
  useEffect(() => {
    if (initialLoadRef.current || !hasUnsavedChanges) return;

    const timer = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const res = await fetch(`${API_BASE}/owner/page`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(pageDraft),
        });
        const data = await res.json();
        if (data.success) {
          setAutoSaveStatus('saved');
          setHasUnsavedChanges(false);
        } else {
          setAutoSaveStatus('unsaved');
        }
      } catch {
        setAutoSaveStatus('unsaved');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [pageDraft, hasUnsavedChanges, token]);

  // Apply theme preset
  const handleApplyThemePreset = (themePreset) => {
    setPageDraft((prev) => ({
      ...prev,
      theme: themePreset.id,
      background_color: themePreset.backgroundColor,
      button_color: themePreset.buttonColor,
      button_text_color: themePreset.buttonTextColor,
      font_family: themePreset.fontFamily,
      button_radius: themePreset.buttonRadius,
      button_shadow: themePreset.buttonShadow,
    }));
    setHasUnsavedChanges(true);
  };

  // Save Page Settings to Backend
  const handleSavePage = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/owner/page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pageDraft),
      });
      const data = await res.json();
      if (data.success) {
        setHasUnsavedChanges(false);
        setFeedback({ type: 'success', message: 'Pengaturan halaman bio berhasil disimpan!' });
        onRefreshWorkspace?.();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menyimpan perubahan' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Gagal terhubung ke backend: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSavePage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageDraft, token]);

  // Toggle publish / unpublish
  const handleTogglePublish = async () => {
    const nextStatus = !pageDraft.is_published;
    setPageDraft((prev) => ({ ...prev, is_published: nextStatus }));
    try {
      const res = await fetch(`${API_BASE}/owner/page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_published: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: nextStatus
            ? 'Halaman bio berhasil DIPUBLIKASIKAN (Live).'
            : 'Halaman bio sekarang dalam status DRAFT (Unpublished).',
        });
        onRefreshWorkspace?.();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // BLOCK CRUD Handlers
  const handleAddBlock = async (defaultData) => {
    try {
      const res = await fetch(`${API_BASE}/owner/blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(defaultData),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBlocksDraft((prev) => [...prev, data.data]);
        setFeedback({ type: 'success', message: 'Blok baru berhasil ditambahkan!' });
        onRefreshWorkspace?.();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menambahkan blok' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateBlock = async (blockId, updates) => {
    // Optimistic local update
    setBlocksDraft((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );

    try {
      await fetch(`${API_BASE}/owner/blocks/${blockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to update block on backend:', err);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!confirm('Hapus blok ini secara permanen dari halaman bio Anda?')) return;

    setBlocksDraft((prev) => prev.filter((b) => b.id !== blockId));
    try {
      const res = await fetch(`${API_BASE}/owner/blocks/${blockId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Blok berhasil dihapus.' });
        onRefreshWorkspace?.();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDuplicateBlock = async (blockId) => {
    try {
      const res = await fetch(`${API_BASE}/owner/blocks/${blockId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBlocksDraft((prev) => [...prev, data.data]);
        setFeedback({ type: 'success', message: 'Blok berhasil diduplikasi!' });
        onRefreshWorkspace?.();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleReorderBlocks = async (reorderedIds) => {
    // Reorder locally
    const idMap = new Map(blocksDraft.map((b) => [b.id, b]));
    const nextBlocks = reorderedIds.map((id, idx) => ({
      ...idMap.get(id),
      order: idx,
    }));
    setBlocksDraft(nextBlocks);

    try {
      await fetch(`${API_BASE}/owner/blocks/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ block_ids: reorderedIds }),
      });
    } catch (err) {
      console.error('Failed to save block reordering:', err);
    }
  };

  const publicPageUrl = `${window.location.origin}/#p/${pageDraft.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicPageUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Directly Editable Page Title, Status Indicator, and Live Public URL */}
        <div className="space-y-1.5 flex-1 max-w-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex items-center group">
              <input
                type="text"
                value={pageDraft.title || ''}
                onChange={(e) => handleChangeField('title', e.target.value)}
                placeholder="Nama Halaman Bio"
                className="text-base font-bold text-slate-900 tracking-tight bg-slate-50/80 hover:bg-slate-100 focus:bg-white pl-3 pr-8 py-1.5 rounded-xl border border-slate-200/90 hover:border-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all w-60 sm:w-72"
                title="Klik untuk langsung mengedit nama halaman bio"
              />
              <PencilIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 pointer-events-none absolute right-3" />
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  pageDraft.is_published ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-600">
                {pageDraft.is_published ? 'Live (Dipublikasikan)' : 'Draft (Nonaktif)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="truncate max-w-xs">{publicPageUrl}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              title="Salin tautan bio"
              className="text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors"
            >
              {copiedLink ? (
                <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Controls (Cloud Auto-Save Status, Share & QR, Publish Toggle, Preview Mode, Save Changes) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Cloud Auto-Save Status Pill */}
          <div className="hidden sm:flex items-center mr-1">
            {autoSaveStatus === 'saving' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 shadow-2xs">
                <CloudSyncIcon className="w-3.5 h-3.5 animate-spin text-slate-600" />
                <span>Menyimpan ke Cloud...</span>
              </div>
            )}
            {autoSaveStatus === 'saved' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/80 shadow-2xs">
                <CloudCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tersimpan di Cloud</span>
              </div>
            )}
            {autoSaveStatus === 'unsaved' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Menyimpan...</span>
              </div>
            )}
          </div>

          {/* Share & QR Code Modal Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            title="Buka QR Code dan bagikan ke media sosial"
          >
            <Share2Icon className="w-3.5 h-3.5 text-slate-700" />
            <span>Bagikan & QR</span>
          </button>

          {/* Publish / Unpublish Toggle */}
          <button
            type="button"
            onClick={handleTogglePublish}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              pageDraft.is_published
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {pageDraft.is_published ? 'Unpublish' : 'Publish Sekarang'}
          </button>

          {/* Fullscreen Preview Mode */}
          <button
            type="button"
            onClick={() => setIsFullscreenPreview(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
          >
            <EyeIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Mode Pratinjau</span>
          </button>

          {/* Save Changes Button */}
          <button
            type="button"
            disabled={saving}
            onClick={handleSavePage}
            className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs ${
              hasUnsavedChanges
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-900'
            }`}
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
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

      {/* Main Studio Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sub-navigation & Active Editor Module (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-5">
          {/* Sub Tabs Pill Navigation */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'blok', label: 'Blok Konten', icon: LayersIcon },
              { id: 'profil', label: 'Profil Bio', icon: SettingsIcon },
              { id: 'tema', label: 'Tema & Desain', icon: PaletteIcon },
              { id: 'pro', label: 'Kustomisasi Pro', icon: SlidersIcon, isPro: true },
              { id: 'seo', label: 'SEO & Meta', icon: GlobeIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.isPro && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/20'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      PRO
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Module 1: Blok Konten (Drag & Drop, Add, Reorder, Delete, Duplicate) */}
          {activeSubTab === 'blok' && (
            <BlocksManager
              blocks={blocksDraft}
              pageDraft={pageDraft}
              onChangeField={handleChangeField}
              onSwitchToProfileTab={() => setActiveSubTab('profil')}
              onAddBlock={handleAddBlock}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onReorderBlocks={handleReorderBlocks}
            />
          )}

          {/* Module 2: Profil & Avatar (Avatar Crop, Display Name, Bio Counter) */}
          {activeSubTab === 'profil' && (
            <ProfileEditor
              title={pageDraft.title}
              bio={pageDraft.bio}
              avatarUrl={pageDraft.avatar_url}
              isVerified={pageDraft.is_verified}
              onChangeField={handleChangeField}
            />
          )}

          {/* Module 3: Tema & Desain (15 Presets, Base Customizer, Fonts, Radius, Shadow) */}
          {activeSubTab === 'tema' && (
            <ThemeSelector
              currentThemeId={pageDraft.theme}
              backgroundColor={pageDraft.background_color}
              buttonColor={pageDraft.button_color}
              buttonTextColor={pageDraft.button_text_color}
              fontFamily={pageDraft.font_family}
              buttonRadius={pageDraft.button_radius}
              buttonShadow={pageDraft.button_shadow}
              isUserPro={Boolean(user?.is_pro)}
              onApplyThemePreset={handleApplyThemePreset}
              onChangeField={handleChangeField}
            />
          )}

          {/* Module 4: Kustomisasi Pro (Custom CSS, Spacing, Background image/video, Favicon) */}
          {activeSubTab === 'pro' && (
            <ProCustomizer
              customCss={pageDraft.custom_css}
              blockSpacing={pageDraft.block_spacing}
              pageShadow={pageDraft.page_shadow}
              bgImageUrl={pageDraft.bg_image_url}
              faviconUrl={pageDraft.favicon_url}
              isUserPro={Boolean(user?.is_pro)}
              onChangeField={handleChangeField}
            />
          )}

          {/* Module 5: SEO & Metadata (Meta Title, Description, OG Image, Google SERP) */}
          {activeSubTab === 'seo' && (
            <SeoSettings
              metaTitle={pageDraft.meta_title}
              metaDescription={pageDraft.meta_description}
              ogImage={pageDraft.og_image}
              slug={pageDraft.slug}
              pageTitle={pageDraft.title}
              pageBio={pageDraft.bio}
              onChangeField={handleChangeField}
            />
          )}
        </div>

        {/* Right Column: Interactive Real-Time Smartphone Frame (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center">
          <div className="sticky top-6 w-full flex flex-col items-center space-y-3">
            <div className="flex items-center justify-between w-[340px] px-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Pratinjau Real-Time
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreenPreview(true)}
                className="hover:text-slate-900 flex items-center gap-1"
              >
                <span>Perbesar</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </button>
            </div>

            {/* Smartphone Chassis Mockup */}
            <MobilePreviewFrame
              page={pageDraft}
              blocks={blocksDraft}
              onEditProfile={() => setActiveSubTab('profil')}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      <FullscreenPreviewModal
        isOpen={isFullscreenPreview}
        onClose={() => setIsFullscreenPreview(false)}
        page={pageDraft}
        blocks={blocksDraft}
      />

      {/* Omni-Share Sheet & Instant QR Code Generator Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        pageTitle={pageDraft.title}
        pageSlug={pageDraft.slug}
        publicUrl={publicPageUrl}
      />
    </div>
  );
}
