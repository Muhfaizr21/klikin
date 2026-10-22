import React, { useState, useEffect } from 'react';
import {
  LifeBuoyIcon,
  HelpCircleIcon,
  MessageCircleIcon,
  SendIcon,
  CheckIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  PaperclipIcon,
  StarIcon,
  SearchIcon,
  ClockIcon,
  ChevronDownIcon,
  SparklesIcon,
  MailIcon,
  ShieldCheckIcon,
  GlobeIcon,
  CreditCardIcon,
  ZapIcon,
  PaletteIcon,
} from '../Icons';
import { API_BASE } from '../../lib/api';

const TICKET_CATEGORIES = [
  {
    id: 'technical',
    label: 'Teknis & Bug',
    badge: 'Bug / Error',
    desc: 'Kendala fitur, halaman bio lambat, atau error sistem',
    icon: AlertCircleIcon,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  {
    id: 'domain',
    label: 'Domain Kustom & DNS',
    badge: 'DNS / SSL',
    desc: 'Panduan konfigurasi CNAME, propagasi DNS, atau SSL',
    icon: GlobeIcon,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    id: 'billing',
    label: 'Pembayaran & Langganan',
    badge: 'Billing / Pro',
    desc: 'Faktur, checkout Stripe, kendala kartu, atau kuota aktif',
    icon: CreditCardIcon,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'feature',
    label: 'Fitur & Integrasi',
    badge: 'Integrasi',
    desc: 'Setup Meta Pixel, TikTok Pixel, Lead Magnet, & autoresponder',
    icon: ZapIcon,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    id: 'general',
    label: 'Pertanyaan Umum',
    badge: 'Umum',
    desc: 'Konsultasi akun, panduan platform, atau bantuan operasional',
    icon: HelpCircleIcon,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
  },
];

const TICKET_PRIORITIES = [
  {
    id: 'low',
    label: 'Rendah',
    sub: 'Pertanyaan umum',
    dot: 'bg-slate-400',
    activeClass: 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 text-slate-900 font-bold',
  },
  {
    id: 'medium',
    label: 'Sedang',
    sub: 'Kendala wajar',
    dot: 'bg-amber-500',
    activeClass: 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 text-amber-950 font-bold',
  },
  {
    id: 'high',
    label: 'Tinggi',
    sub: 'Kritis / Mendesak',
    dot: 'bg-rose-500',
    pulsing: true,
    activeClass: 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 text-rose-950 font-bold',
  },
];

export default function OwnerSupport({ user, token }) {
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'faq' | 'contact' | 'feedback'
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState('all');

  // New Ticket Modal State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: '',
    attachment_url: '',
  });
  const [creatingTicket, setCreatingTicket] = useState(false);

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('all');
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: user?.name || user?.full_name || 'Kopi Seduh Nusantara',
    email: user?.email || 'kopi@nusantara.id',
    subject: '',
    message: '',
  });
  const [submittingContact, setSubmittingContact] = useState(false);

  // Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({
    title: '',
    category: 'Fitur Baru',
    description: '',
    rating: 5,
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const authToken = token || localStorage.getItem('klikin_token') || 'demo-token-owner-kopi';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTickets(), fetchFAQs()]);
    } catch (err) {
      console.error('Error fetching support data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/owner/support/tickets`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setTickets(result.data || []);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    }
  };

  const fetchFAQs = async () => {
    try {
      const res = await fetch(`${API_BASE}/owner/support/faq`);
      const result = await res.json();
      if (result.success) {
        setFaqs(result.data || []);
      }
    } catch (err) {
      console.error('Fetch FAQ error:', err);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    setTicketDetailsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/owner/support/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        setSelectedTicket(result.data);
      } else {
        showFeedback(result.error || 'Gagal memuat detail tiket', 'error');
      }
    } catch (err) {
      showFeedback('Koneksi terputus saat mengambil detail tiket', 'error');
    } finally {
      setTicketDetailsLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      showFeedback('Subjek dan deskripsi tiket wajib diisi', 'error');
      return;
    }

    setCreatingTicket(true);
    try {
      const res = await fetch(`${API_BASE}/owner/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newTicket),
      });
      const result = await res.json();
      if (result.success) {
        showFeedback('Tiket bantuan baru berhasil dibuat! Tim kami akan segera meninjau.', 'success');
        setShowNewTicketModal(false);
        setNewTicket({
          subject: '',
          category: 'technical',
          priority: 'medium',
          description: '',
          attachment_url: '',
        });
        await fetchTickets();
        if (result.data) {
          setSelectedTicket(result.data);
        }
      } else {
        showFeedback(result.error || 'Gagal membuat tiket', 'error');
      }
    } catch (err) {
      showFeedback('Koneksi bermasalah saat mengirim tiket', 'error');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const res = await fetch(`${API_BASE}/owner/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: replyMessage,
          attachment_url: replyAttachment,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showFeedback('Balasan Anda telah terkirim', 'success');
        setReplyMessage('');
        setReplyAttachment('');
        await fetchTicketDetails(selectedTicket.id);
        await fetchTickets();
      } else {
        showFeedback(result.error || 'Gagal mengirim balasan', 'error');
      }
    } catch (err) {
      showFeedback('Gagal mengirim balasan tiket', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      showFeedback('Subjek dan pesan kontak wajib diisi', 'error');
      return;
    }

    setSubmittingContact(true);
    try {
      const res = await fetch(`${API_BASE}/owner/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(contactForm),
      });
      const result = await res.json();
      if (result.success) {
        showFeedback('Pesan kontak Anda telah diterima! Kami akan membalas via email.', 'success');
        setContactForm({
          ...contactForm,
          subject: '',
          message: '',
        });
      } else {
        showFeedback(result.error || 'Gagal mengirim pesan', 'error');
      }
    } catch (err) {
      showFeedback('Gagal menghubungi tim Klikin', 'error');
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackForm.title.trim() || !feedbackForm.description.trim()) {
      showFeedback('Judul dan deskripsi ide fitur wajib diisi', 'error');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const res = await fetch(`${API_BASE}/owner/support/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(feedbackForm),
      });
      const result = await res.json();
      if (result.success) {
        showFeedback('Terima kasih atas saran fitur Anda! Masukan Anda sangat berharga bagi kami.', 'success');
        setFeedbackForm({
          title: '',
          category: 'Fitur Baru',
          description: '',
          rating: 5,
        });
      } else {
        showFeedback(result.error || 'Gagal mengirim masukan', 'error');
      }
    } catch (err) {
      showFeedback('Gagal mengirimkan feedback', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Menunggu Respon
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Sedang Diproses
          </span>
        );
      case 'waiting_user':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Menunggu Balasan Anda
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <CheckIcon className="w-3 h-3 text-emerald-600" />
            Selesai
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Ditutup
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Tinggi
          </span>
        );
      case 'medium':
        return (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Sedang
          </span>
        );
      case 'low':
        return (
          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Rendah
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // FAQ filtering
  const faqCategories = [
    { id: 'all', label: 'Semua Topik' },
    { id: 'Domain & DNS', label: 'Domain & DNS' },
    { id: 'Billing & Paket', label: 'Billing & Langganan' },
    { id: 'leads & Form', label: 'Leads & Form' },
    { id: 'Integrasi & Pixel', label: 'Integrasi & Pixel' },
    { id: 'Akun & Keamanan', label: 'Akun & Keamanan' },
  ];

  const filteredFaqs = faqs.filter((item) => {
    const matchesCategory = selectedFaqCategory === 'all' || item.category === selectedFaqCategory;
    const matchesSearch =
      !faqSearch ||
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchStatus =
      ticketFilterStatus === 'all'
        ? true
        : ticketFilterStatus === 'active'
        ? t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_user'
        : t.status === 'resolved' || t.status === 'closed';

    const matchSearch =
      !ticketSearch ||
      t.ticket_number?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.subject?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.description?.toLowerCase().includes(ticketSearch.toLowerCase());

    return matchStatus && matchSearch;
  });

  const activeTicketsCount = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_user'
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border transition-all animate-in fade-in slide-in-from-top-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{feedback.msg}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-black/5 text-slate-600"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Modern Startup Hero Header: Clean White, Slate-900 & Refined Accent */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Pusat Bantuan & Layanan Support
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Dukungan teknis responsif seputar domain kustom, analitik, integrasi pixel iklan, dan pertumbuhan halaman bio link Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://wa.me/6281234567890?text=Halo%20Tim%20Klikin%2C%20saya%20butuh%20bantuan%20seputar%20akun%20saya."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 shadow-2xs active:scale-98"
            >
              <MessageCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Official</span>
            </a>

            <button
              onClick={() => {
                setSelectedTicket(null);
                setShowNewTicketModal(true);
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <LifeBuoyIcon className="w-3.5 h-3.5" />
              <span>+ Buka Tiket Baru</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Insight Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
              <ClockIcon className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">Rata-rata Respon &lt; 15 Menit</p>
              <p className="text-[10px] text-slate-500 font-medium">Jam kerja 08.00 - 22.00 WIB</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">Dukungan Tim Teknis Resmi</p>
              <p className="text-[10px] text-slate-500 font-medium">Tiket tersimpan rapi dan terenkripsi</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
              <SparklesIcon className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">18+ Panduan & Solusi Instan</p>
              <p className="text-[10px] text-slate-500 font-medium">Jelajahi basis pengetahuan & FAQ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Control Navigation Tabs (Linear / Apple Minimalist Style) */}
      <div className="bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/70 inline-flex flex-wrap gap-1 shadow-2xs">
        <button
          onClick={() => {
            setActiveTab('tickets');
            setSelectedTicket(null);
          }}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <LifeBuoyIcon className="w-3.5 h-3.5" />
          <span>Tiket Bantuan</span>
          {tickets.length > 0 && (
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'tickets'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tickets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <HelpCircleIcon className="w-3.5 h-3.5" />
          <span>Pusat Panduan & FAQ</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'contact'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <MailIcon className="w-3.5 h-3.5" />
          <span>Formulir Kontak</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Kirim Saran Fitur</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
          <RefreshCwIcon className="w-7 h-7 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-xs">Memuat layanan support & data tiket...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              {selectedTicket ? (
                /* Ticket Detail & Conversation Thread */
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                  {/* Ticket Header Bar */}
                  <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="text-xs font-bold text-slate-700 hover:text-slate-900 mr-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>&larr; Kembali ke Daftar</span>
                        </button>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          {selectedTicket.ticket_number}
                        </span>
                        {getStatusBadge(selectedTicket.status)}
                        {getPriorityBadge(selectedTicket.priority)}
                        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                          Kategori: {selectedTicket.category}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">{selectedTicket.subject}</h2>
                      <p className="text-xs text-slate-400">
                        Dibuat pada {formatDate(selectedTicket.created_at)}
                      </p>
                    </div>

                    <button
                      onClick={() => fetchTicketDetails(selectedTicket.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors self-start md:self-center border border-slate-200/60 bg-white shadow-2xs cursor-pointer"
                      title="Perbarui percakapan"
                    >
                      <RefreshCwIcon className={`w-4 h-4 ${ticketDetailsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Messages Timeline */}
                  <div className="p-5 sm:p-6 space-y-4 max-h-[520px] overflow-y-auto bg-slate-50/30">
                    {/* Initial User Description Card */}
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {user?.name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {user?.name || user?.full_name || 'Anda'} (Pembuka Tiket)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(selectedTicket.created_at)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {selectedTicket.description}
                        </p>
                        {selectedTicket.attachment_url && (
                          <div className="pt-2">
                            <a
                              href={selectedTicket.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-slate-800 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                              <PaperclipIcon className="w-3.5 h-3.5 text-slate-500" />
                              <span>Lihat Lampiran Berkas</span>
                              <ExternalLinkIcon className="w-3 h-3 text-slate-400" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thread Messages */}
                    {selectedTicket.messages &&
                      selectedTicket.messages.map((msg) => {
                        const isSupport = msg.sender_type === 'support';
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 items-start ${
                              isSupport ? 'flex-row' : 'flex-row-reverse'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                                isSupport
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {isSupport ? 'K' : 'U'}
                            </div>

                            <div
                              className={`max-w-xl rounded-2xl p-4 shadow-2xs space-y-1.5 ${
                                isSupport
                                  ? 'bg-white border border-slate-200/90 text-slate-900'
                                  : 'bg-slate-900 text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <span className={`text-xs font-bold flex items-center gap-1.5 ${isSupport ? 'text-slate-900' : 'text-white'}`}>
                                  {msg.sender_name}
                                  {isSupport && (
                                    <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                      Klikin Support
                                    </span>
                                  )}
                                </span>
                                <span className={`text-[11px] ${isSupport ? 'text-slate-400' : 'text-slate-300'}`}>
                                  {formatDate(msg.created_at)}
                                </span>
                              </div>
                              <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${isSupport ? 'text-slate-700' : 'text-slate-100'}`}>
                                {msg.message}
                              </p>
                              {msg.attachment_url && (
                                <div className="pt-2">
                                  <a
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-medium ${
                                      isSupport
                                        ? 'text-slate-800 bg-slate-50 border-slate-200 hover:bg-slate-100'
                                        : 'text-white bg-white/10 border-white/20 hover:bg-white/20'
                                    }`}
                                  >
                                    <PaperclipIcon className="w-3.5 h-3.5" />
                                    <span>Lampiran Berkas</span>
                                    <ExternalLinkIcon className="w-3 h-3 opacity-70" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Reply Form */}
                  {selectedTicket.status !== 'closed' ? (
                    <form onSubmit={handleSendReply} className="p-4 sm:p-6 bg-white border-t border-slate-200">
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Tuliskan Pesan Balasan Anda:
                      </label>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Ketik rincian atau jawaban tambahan di sini..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all resize-none"
                        required
                      />

                      <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <PaperclipIcon className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="url"
                            value={replyAttachment}
                            onChange={(e) => setReplyAttachment(e.target.value)}
                            placeholder="Tautan lampiran / screenshot (Google Drive, Imgur, Dropbox)"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-700 placeholder-slate-400"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingReply || !replyMessage.trim()}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                        >
                          {sendingReply ? (
                            <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <SendIcon className="w-3.5 h-3.5" />
                          )}
                          <span>Kirim Balasan</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
                      Tiket ini telah selesai dan ditutup. Untuk pertanyaan baru, silakan buka tiket baru.
                    </div>
                  )}
                </div>
              ) : (
                /* Ticket List Card */
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">Riwayat Tiket Dukungan Anda</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Semua komunikasi resmi dengan tim teknis dan spesialis Klikin tersimpan aman di sini.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowNewTicketModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto active:scale-98 cursor-pointer"
                    >
                      <MessageCircleIcon className="w-3.5 h-3.5" />
                      <span>Buat Tiket Baru</span>
                    </button>
                  </div>

                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        placeholder="Cari nomor tiket atau topik kendala..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs text-slate-800 placeholder-slate-400"
                      />
                      {ticketSearch && (
                        <button
                          onClick={() => setTicketSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-semibold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60 shrink-0">
                      {[
                        { id: 'all', label: 'Semua Status' },
                        { id: 'active', label: 'Aktif' },
                        { id: 'closed', label: 'Selesai' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setTicketFilterStatus(item.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            ticketFilterStatus === item.id
                              ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center border border-slate-200/60 shadow-2xs">
                        <LifeBuoyIcon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">Tidak Ada Tiket Ditemukan</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {ticketSearch
                          ? 'Tidak ada tiket yang cocok dengan kata kunci pencarian Anda.'
                          : 'Jika Anda mengalami kendala teknis atau memiliki pertanyaan, klik tombol "Buat Tiket Baru" di atas.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredTickets.map((tkt) => (
                        <div
                          key={tkt.id}
                          onClick={() => fetchTicketDetails(tkt.id)}
                          className="py-4 px-3 -mx-3 rounded-xl hover:bg-slate-50/80 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {tkt.ticket_number}
                              </span>
                              {getStatusBadge(tkt.status)}
                              {getPriorityBadge(tkt.priority)}
                              <span className="text-[11px] text-slate-400">
                                Diperbarui: {formatDate(tkt.updated_at || tkt.created_at)}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                              {tkt.subject}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {tkt.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-950 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Buka Percakapan &rarr;
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              {/* FAQ Search & Category Filters */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Pertanyaan yang Sering Diajukan (FAQ)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Solusi instan dan petunjuk teknis mengenai domain, pembayaran, leads, pixel tracking, dan kustomisasi Klikin.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Cari pertanyaan, misal: 'CNAME', 'Stripe', 'Meta Pixel', 'Password'..."
                    className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800 placeholder-slate-400"
                  />
                  {faqSearch && (
                    <button
                      onClick={() => setFaqSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {faqCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedFaqCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedFaqCategory === cat.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-slate-500 text-xs font-medium">Tidak ada FAQ yang cocok dengan pencarian Anda.</p>
                    <button
                      onClick={() => {
                        setFaqSearch('');
                        setSelectedFaqCategory('all');
                      }}
                      className="text-xs font-bold text-slate-900 hover:underline"
                    >
                      Tampilkan semua pertanyaan
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredFaqs.map((faq) => {
                      const isExpanded = expandedFaqId === faq.id;
                      return (
                        <div key={faq.id} className="py-4">
                          <button
                            onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                            className="w-full text-left flex items-start justify-between gap-4 group cursor-pointer"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                {faq.category}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                                {faq.question}
                              </h3>
                            </div>
                            <ChevronDownIcon
                              className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-slate-900' : ''
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="mt-3 pl-1 pr-4 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in duration-150">
                              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
                                {faq.answer}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT FORM */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Form */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Hubungi Tim Resmi Klikin</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gunakan formulir ini untuk pertanyaan kemitraan, pertanyaan umum, atau konsultasi bisnis yang tidak memerlukan tiket pelacakan teknis.
                  </p>
                </div>

                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Alamat Email
                      </label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Subjek Pertanyaan
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Contoh: Kerja sama komunitas kreator atau pertanyaan integrasi khusus"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Isi Pesan
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Jelaskan kebutuhan atau pertanyaan Anda secara rinci..."
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800 resize-none"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingContact}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
                    >
                      {submittingContact ? (
                        <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <SendIcon className="w-3.5 h-3.5" />
                      )}
                      <span>Kirim Pesan Kontak</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Fast Channel Info */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Saluran Langsung</h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <MailIcon className="w-3.5 h-3.5 text-slate-700" />
                        <span>Email Resmi</span>
                      </div>
                      <p className="text-slate-500 font-mono text-[11px]">support@klikin.id</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <MessageCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Care</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">Senin – Minggu (08.00 – 22.00 WIB)</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Keamanan Data</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">Privasi data akun dilindungi protokol kepatuhan UU PDP.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEATURE FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 max-w-3xl">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700 mb-2">
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Roadmap Produk & Masukan</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Kirim Ide & Saran Fitur Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klikin dibangun bersama Anda. Setiap saran fitur akan dipertimbangkan langsung oleh tim produk dalam sprint mingguan kami.
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Judul Ide / Permintaan Fitur
                    </label>
                    <input
                      type="text"
                      value={feedbackForm.title}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                      placeholder="Misal: QR Code custom dengan logo pribadi"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Kategori Saran
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Fitur Baru', label: 'Fitur Baru', icon: SparklesIcon },
                        { id: 'Desain & UI/UX', label: 'Desain & UI', icon: PaletteIcon },
                        { id: 'Integrasi', label: 'Integrasi API', icon: ZapIcon },
                        { id: 'Kinerja & Kecepatan', label: 'Kinerja', icon: ClockIcon },
                      ].map((item) => {
                        const isSelected = feedbackForm.category === item.id;
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFeedbackForm({ ...feedbackForm, category: item.id })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Rincian Kebutuhan & Ekspektasi Anda
                  </label>
                  <textarea
                    value={feedbackForm.description}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                    placeholder="Ceritakan bagaimana fitur ini akan mempermudah alur kerja bisnis Anda..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800 resize-none"
                    required
                  />
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Tingkat Kepuasan Anda Terhadap Platform Klikin
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                        className="p-1 rounded-md hover:scale-110 transition-transform text-amber-400 focus:outline-none cursor-pointer"
                      >
                        <StarIcon
                          className="w-5 h-5"
                          filled={star <= feedbackForm.rating}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {feedbackForm.rating} dari 5 Bintang
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
                  >
                    {submittingFeedback ? (
                      <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <SparklesIcon className="w-3.5 h-3.5" />
                    )}
                    <span>Kirim Saran Anda</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* MODAL: Buka Tiket Baru */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80 flex items-center justify-center font-bold shadow-2xs">
                  <LifeBuoyIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Buka Tiket Bantuan Baru</h3>
                  <p className="text-[11px] text-slate-400">Tim teknis Klikin akan merespon segera</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Subjek Permasalahan / Kendala
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Misal: Verifikasi DNS Custom Domain Tidak Selesai"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kategori Kendala - Custom Interactive Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                    <span>Kategori Kendala</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className={`w-full px-3 py-2 rounded-xl border text-left bg-white flex items-center justify-between transition-all shadow-2xs cursor-pointer ${
                      categoryDropdownOpen
                        ? 'border-slate-900 ring-2 ring-slate-900/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {(() => {
                      const sel = TICKET_CATEGORIES.find((c) => c.id === newTicket.category) || TICKET_CATEGORIES[0];
                      const IconComp = sel.icon;
                      return (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${sel.color}`}>
                              <IconComp className="w-3 h-3" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 truncate leading-snug">{sel.label}</p>
                            </div>
                          </div>
                          <ChevronDownIcon
                            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              categoryDropdownOpen ? 'rotate-180 text-slate-900' : ''
                            }`}
                          />
                        </>
                      );
                    })()}
                  </button>

                  {/* Popover Custom Dropdown */}
                  {categoryDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setCategoryDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 max-h-56 overflow-y-auto animate-in fade-in duration-100">
                        {TICKET_CATEGORIES.map((cat) => {
                          const isSelected = newTicket.category === cat.id;
                          const CatIcon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setNewTicket({ ...newTicket, category: cat.id });
                                setCategoryDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                                isSelected ? 'bg-slate-100 text-slate-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 ${cat.color}`}>
                                <CatIcon className="w-3 h-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">{cat.label}</p>
                                <p className="text-[10px] text-slate-400 truncate">{cat.desc}</p>
                              </div>
                              {isSelected && (
                                <CheckIcon className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Prioritas Kendala */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Prioritas Kendala
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TICKET_PRIORITIES.map((pri) => {
                      const isSelected = newTicket.priority === pri.id;
                      return (
                        <button
                          key={pri.id}
                          type="button"
                          onClick={() => setNewTicket({ ...newTicket, priority: pri.id })}
                          className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? `${pri.activeClass} shadow-2xs`
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="relative flex h-2 w-2">
                              {pri.pulsing && isSelected && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${pri.dot}`}></span>
                            </span>
                            {isSelected && <CheckIcon className="w-3 h-3 text-slate-900" />}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold leading-tight">{pri.label}</p>
                            <p className="text-[9px] text-slate-400 truncate mt-0.5">{pri.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Deskripsi Lengkap Masalah
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Jelaskan secara kronologis apa yang terjadi, browser yang digunakan, dan langkah yang sudah dicoba..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-xs sm:text-sm text-slate-800 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Lampiran Berkas / Screenshot (URL)
                </label>
                <div className="flex items-center gap-2">
                  <PaperclipIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    value={newTicket.attachment_url}
                    onChange={(e) => setNewTicket({ ...newTicket, attachment_url: e.target.value })}
                    placeholder="https://imgur.com/..., https://drive.google.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  {creatingTicket ? (
                    <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <SendIcon className="w-3.5 h-3.5" />
                  )}
                  <span>Kirim Tiket Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
