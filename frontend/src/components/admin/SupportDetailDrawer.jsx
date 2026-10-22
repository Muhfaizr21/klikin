import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';
import {
  XIcon,
  MessageCircleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  CheckIcon,
  ExternalLinkIcon,
} from '../Icons';

/**
 * Slide-Over Drawer 360 Derajat untuk Detail Tiket & Percakapan Support (Readme 3.8)
 */
export default function SupportDetailDrawer({
  isOpen,
  onClose,
  ticketId,
  token,
  onTicketUpdated,
  onOpenDirectNotif,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Reply form states
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [sendEmailCopy, setSendEmailCopy] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState(null);

  // Canned responses state
  const [cannedList, setCannedList] = useState([]);
  const [selectedCannedId, setSelectedCannedId] = useState('');

  // Fetch ticket details
  const fetchDetail = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat detail tiket');
      }
      setData(json.data);
    } catch (err) {
      setError(err.message || 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch canned responses
  const fetchCanned = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/support/canned-responses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCannedList(json.data || []);
      }
    } catch {
      // Canned fetch optional
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchDetail();
      fetchCanned();
      setReplyMessage('');
      setReplyStatus('');
      setReplyFeedback(null);
      setSelectedCannedId('');
    }
  }, [isOpen, ticketId]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !sendingReply) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sendingReply, onClose]);

  if (!isOpen) return null;

  // Insert canned template
  const handleSelectCanned = (e) => {
    const cid = e.target.value;
    setSelectedCannedId(cid);
    if (!cid) return;
    const found = cannedList.find((c) => c.id === cid);
    if (found) {
      setReplyMessage((prev) => (prev ? `${prev}\n\n${found.content}` : found.content));
    }
  };

  // Submit reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    setReplyFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
          update_status: replyStatus || '',
          send_email_copy: sendEmailCopy,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengirimkan balasan tiket');
      }

      setReplyFeedback({ type: 'success', text: 'Balasan dan notifikasi berhasil terkirim ke pengguna' });
      setReplyMessage('');
      setSelectedCannedId('');
      fetchDetail();
      onTicketUpdated?.();
      setTimeout(() => setReplyFeedback(null), 4000);
    } catch (err) {
      setReplyFeedback({ type: 'error', text: err.message || 'Terjadi kesalahan saat membalas' });
    } finally {
      setSendingReply(false);
    }
  };

  // Quick status update
  const handleQuickStatus = async (newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReplyFeedback({ type: 'success', text: `Status tiket diubah menjadi ${newStatus}` });
        fetchDetail();
        onTicketUpdated?.();
        setTimeout(() => setReplyFeedback(null), 3000);
      }
    } catch {
      // Handled silently
    }
  };

  const ticket = data?.ticket;
  const user = data?.user;

  const getStatusBadge = (st) => {
    switch (st) {
      case 'open':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'in_progress':
        return 'bg-sky-50 text-sky-700 border-sky-200/80';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getPriorityBadge = (pr) => {
    switch (pr) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200/80';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'low':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-drawer-title"
        className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              TK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="ticket-drawer-title" className="text-base font-bold text-slate-900 tracking-tight">
                  {ticket?.ticket_number || 'Detail Tiket'}
                </h3>
                {ticket && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                )}
                {ticket && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPriorityBadge(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-md">
                {ticket?.subject || 'Memuat informasi tiket...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
            aria-label="Tutup panel"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {replyFeedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
              replyFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {replyFeedback.type === 'success' ? (
              <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{replyFeedback.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Memuat percakapan dan metadata tiket...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-3">
              <AlertCircleIcon className="w-5 h-5 shrink-0 text-rose-500" />
              <div>
                <p className="font-bold">Gagal memuat tiket</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          ) : ticket ? (
            <>
              {/* Tenant 360 Card */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0 overflow-hidden border border-slate-300">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.full_name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{user?.full_name || 'Pelapor'}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 text-slate-700">
                        @{user?.username || 'user'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          data?.userSubscriptionPlan === 'Pro'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {data?.userSubscriptionPlan || 'Free'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{user?.email || '-'}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>Status: <strong className="text-slate-600">{user?.status || 'active'}</strong></span>
                      <span>Halaman Bio: <strong className="text-slate-600">{data?.userActivePages || 0} aktif</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onOpenDirectNotif?.(user)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden"
                  >
                    Kirim Notif In-App
                  </button>
                </div>
              </div>

              {/* Quick Status Control */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-white border border-slate-200 rounded-xl text-xs">
                <span className="font-bold text-slate-700 text-xs">Status Cepat:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickStatus('in_progress')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
                      ticket.status === 'in_progress'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Sedang Diproses
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStatus('resolved')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
                      ticket.status === 'resolved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Selesaikan Tiket
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStatus('closed')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
                      ticket.status === 'closed'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tutup Tiket
                  </button>
                </div>
              </div>

              {/* Initial Ticket Subject & In-depth issue description */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Kendala / Pertanyaan Awal (Kategori: {ticket.category})
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{ticket.subject}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(ticket.created_at).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </div>
                {ticket.attachment_url && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-400 font-medium">Lampiran:</span>
                    <a
                      href={ticket.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Lihat Dokumen / Gambar</span>
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Message Thread History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Riwayat Percakapan ({ticket.messages?.length || 0} Pesan)
                  </h4>
                </div>

                <div className="space-y-3.5">
                  {ticket.messages && ticket.messages.length > 0 ? (
                    ticket.messages.map((msg) => {
                      const isSupport = msg.sender_type === 'support';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isSupport ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 px-1 text-[11px]">
                            <span
                              className={`font-bold ${
                                isSupport ? 'text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              {msg.sender_name}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                isSupport
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isSupport ? 'Super Admin' : 'Pengguna'}
                            </span>
                            <span className="text-slate-400">
                              {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap shadow-2xs ${
                              isSupport
                                ? 'bg-slate-900 text-white rounded-tr-xs'
                                : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                            }`}
                          >
                            {msg.message}
                            {msg.attachment_url && (
                              <div className="mt-2 pt-2 border-t border-white/20 text-[11px]">
                                <a
                                  href={msg.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-sky-300 hover:text-white flex items-center gap-1"
                                >
                                  <span>Buka Lampiran</span>
                                  <ExternalLinkIcon className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                      Belum ada riwayat pesan balasan.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Reply Box Footer */}
        {ticket && (
          <div className="border-t border-slate-200/80 bg-slate-50/80 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-slate-800">
                Balas Sebagai Super Admin:
              </span>

              {/* Canned response picker */}
              {cannedList.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <label htmlFor="canned-select" className="text-[11px] text-slate-500 font-medium">
                    Template:
                  </label>
                  <select
                    id="canned-select"
                    value={selectedCannedId}
                    onChange={handleSelectCanned}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden cursor-pointer"
                  >
                    <option value="">Pilih Template Balasan Cepat...</option>
                    {cannedList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shortcut ? `[${c.shortcut}] ` : ''}{c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={3}
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Ketik pesan balasan resmi untuk pengguna di sini..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden transition-all shadow-2xs resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Ubah Status:</span>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden cursor-pointer"
                    >
                      <option value="">Biarkan Saat Ini</option>
                      <option value="in_progress">Sedang Diproses</option>
                      <option value="resolved">Selesaikan Tiket</option>
                      <option value="closed">Tutup Tiket</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmailCopy}
                      onChange={(e) => setSendEmailCopy(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                    />
                    <span className="text-[11px] text-slate-600 font-medium">
                      Salinan Email Tenant
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-hidden ml-auto"
                >
                  {sendingReply && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{sendingReply ? 'Mengirim...' : 'Kirim Balasan'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
