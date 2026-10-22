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

const API_BASE = 'http://localhost:8080/api';

const TICKET_CATEGORIES = [
  {
    id: 'technical',
    label: 'Teknis & Bug',
    badge: 'Bug / Error',
    desc: 'Kendala fitur, error sistem, atau halaman bio bermasalah',
    icon: AlertCircleIcon,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  {
    id: 'domain',
    label: 'Domain Kustom & DNS',
    badge: 'DNS / SSL',
    desc: 'Panduan delegasi CNAME, propagasi DNS, atau sertifikat SSL',
    icon: GlobeIcon,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    id: 'billing',
    label: 'Pembayaran & Langganan',
    badge: 'Billing / Pro',
    desc: 'Faktur, checkout Stripe, kendala kartu, atau status langganan',
    icon: CreditCardIcon,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'feature',
    label: 'Fitur & Integrasi',
    badge: 'Integrasi',
    desc: 'Setup Meta Pixel, TikTok, Lead Magnet, & autoresponder',
    icon: ZapIcon,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    id: 'general',
    label: 'Pertanyaan Umum',
    badge: 'Umum',
    desc: 'Konsultasi akun, panduan platform, atau bantuan operasional',
    icon: HelpCircleIcon,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
];

const TICKET_PRIORITIES = [
  {
    id: 'low',
    label: 'Rendah',
    sub: 'Pertanyaan umum',
    dot: 'bg-sky-500',
    activeClass: 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 text-sky-950 font-bold',
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
    sub: 'Kritis / Mengganggu',
    dot: 'bg-rose-500',
    pulsing: true,
    activeClass: 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 text-rose-950 font-bold',
  },
];

export default function OwnerSupport({ user, token }) {
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'faq' | 'contact' | 'feedback'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

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
    name: user?.name || 'Kopi Seduh Nusantara',
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
  const effectiveUserId = user?.id || 'usr_owner_kopi';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Menunggu Respon</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Sedang Diproses</span>;
      case 'waiting_user':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Menunggu Balasan Anda</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Selesai</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600">Ditutup</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Tinggi</span>;
      case 'medium':
        return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Sedang</span>;
      case 'low':
        return <span className="text-xs font-medium text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">Rendah</span>;
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircleIcon className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.msg}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold px-2 py-1 rounded hover:bg-black/5"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide">
              <LifeBuoyIcon className="w-3.5 h-3.5" />
              <span>Klikin Care & Help Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pusat Bantuan & Layanan Support</h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Punya pertanyaan seputar domain, pembayaran, atau fitur bio link? Tim spesialis kami siap membantu Anda 24/7.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedTicket(null);
                setShowNewTicketModal(true);
              }}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-white text-emerald-700 hover:bg-emerald-50 transition shadow-lg flex items-center gap-2"
            >
              <MessageCircleIcon className="w-4 h-4" />
              <span>Buka Tiket Baru</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-white/20 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveTab('tickets');
              setSelectedTicket(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'tickets'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <LifeBuoyIcon className="w-4 h-4" />
            <span>Tiket Bantuan</span>
            {tickets.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {tickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'faq'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <HelpCircleIcon className="w-4 h-4" />
            <span>FAQ & Panduan</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'contact'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MailIcon className="w-4 h-4" />
            <span>Formulir Kontak</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === 'feedback'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Kirim Saran Fitur</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-sm">
          <RefreshCwIcon className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 font-medium text-sm">Memuat layanan support & data tiket...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              {selectedTicket ? (
                /* Ticket Detail & Conversation Thread */
                <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                  {/* Ticket Header */}
                  <div className="p-6 bg-zinc-50/60 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 mr-2 flex items-center gap-1"
                        >
                          &larr; Kembali ke Daftar
                        </button>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                          {selectedTicket.ticket_number}
                        </span>
                        {getStatusBadge(selectedTicket.status)}
                        {getPriorityBadge(selectedTicket.priority)}
                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                          Kategori: {selectedTicket.category}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-zinc-900">{selectedTicket.subject}</h2>
                      <p className="text-xs text-zinc-400">
                        Dibuat pada {formatDate(selectedTicket.created_at)}
                      </p>
                    </div>

                    <button
                      onClick={() => fetchTicketDetails(selectedTicket.id)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200/50 transition self-start md:self-center"
                      title="Perbarui percakapan"
                    >
                      <RefreshCwIcon className={`w-4 h-4 ${ticketDetailsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Messages Timeline */}
                  <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-zinc-50/30">
                    {/* Initial User Description Card */}
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        U
                      </div>
                      <div className="flex-1 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900">
                            {user?.name || 'Anda'} (Pembuka Tiket)
                          </span>
                          <span className="text-xs text-zinc-400">
                            {formatDate(selectedTicket.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                          {selectedTicket.description}
                        </p>
                        {selectedTicket.attachment_url && (
                          <div className="pt-2">
                            <a
                              href={selectedTicket.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline bg-emerald-50 px-2.5 py-1 rounded-md"
                            >
                              <PaperclipIcon className="w-3.5 h-3.5" />
                              <span>Lihat Lampiran</span>
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
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isSupport
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {isSupport ? 'K' : 'U'}
                            </div>

                            <div
                              className={`max-w-xl rounded-2xl p-4 shadow-sm space-y-1.5 ${
                                isSupport
                                  ? 'bg-blue-50/70 border border-blue-200/80 text-zinc-900'
                                  : 'bg-white border border-zinc-200 text-zinc-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-bold flex items-center gap-1.5">
                                  {msg.sender_name}
                                  {isSupport && (
                                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                                      Official
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                  {formatDate(msg.created_at)}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap text-zinc-700">
                                {msg.message}
                              </p>
                              {msg.attachment_url && (
                                <div className="pt-2">
                                  <a
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-white/80 px-2.5 py-1 rounded-md border border-blue-100"
                                  >
                                    <PaperclipIcon className="w-3.5 h-3.5" />
                                    <span>Lampiran Berkas</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Reply Box */}
                  {selectedTicket.status !== 'closed' ? (
                    <form onSubmit={handleSendReply} className="p-4 sm:p-6 bg-white border-t border-zinc-200">
                      <label className="block text-xs font-semibold text-zinc-700 mb-2">
                        Tuliskan Pesan Balasan Anda:
                      </label>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Ketik rincian atau jawaban tambahan di sini..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800 placeholder-zinc-400"
                        required
                      />

                      <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <PaperclipIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <input
                            type="url"
                            value={replyAttachment}
                            onChange={(e) => setReplyAttachment(e.target.value)}
                            placeholder="Tautan lampiran / screenshot (opsional, misal Google Drive / Imgur)"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-700"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingReply || !replyMessage.trim()}
                          className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                        >
                          {sendingReply ? (
                            <RefreshCwIcon className="w-4 h-4 animate-spin" />
                          ) : (
                            <SendIcon className="w-4 h-4" />
                          )}
                          <span>Kirim Balasan</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 bg-zinc-100 text-center text-xs text-zinc-500 font-medium">
                      Tiket ini telah ditutup. Untuk masalah baru, silakan buka tiket baru.
                    </div>
                  )}
                </div>
              ) : (
                /* Ticket List */
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">Riwayat Tiket Dukungan Anda</h2>
                      <p className="text-xs text-zinc-500">
                        Semua komunikasi resmi dengan tim teknis dan operasional Klikin tersimpan rapi di sini.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowNewTicketModal(true)}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
                    >
                      <MessageCircleIcon className="w-4 h-4" />
                      <span>Buat Tiket Baru</span>
                    </button>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
                        <LifeBuoyIcon className="w-7 h-7" />
                      </div>
                      <h3 className="font-semibold text-zinc-800 text-sm">Belum Ada Tiket Bantuan</h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        Jika Anda mengalami kendala teknis atau memiliki pertanyaan seputar akun, jangan ragu untuk membuat tiket bantuan baru.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {tickets.map((tkt) => (
                        <div
                          key={tkt.id}
                          onClick={() => fetchTicketDetails(tkt.id)}
                          className="py-4 hover:bg-zinc-50/80 -mx-4 px-4 rounded-xl cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                                {tkt.ticket_number}
                              </span>
                              {getStatusBadge(tkt.status)}
                              {getPriorityBadge(tkt.priority)}
                              <span className="text-xs text-zinc-400">
                                Ditutup/Diperbarui: {formatDate(tkt.updated_at || tkt.created_at)}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 hover:text-emerald-600 transition">
                              {tkt.subject}
                            </h4>
                            <p className="text-xs text-zinc-500 line-clamp-1">
                              {tkt.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
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
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Pertanyaan yang Sering Diajukan (FAQ)</h2>
                  <p className="text-xs text-zinc-500">
                    Temukan jawaban cepat mengenai konfigurasi domain, pembayaran, leads, dan fitur halaman Klikin Anda.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <SearchIcon className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Cari kata kunci, misal: 'DNS', 'Stripe', 'Pixel', 'Password'..."
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800 placeholder-zinc-400"
                  />
                  {faqSearch && (
                    <button
                      onClick={() => setFaqSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 font-semibold"
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedFaqCategory === cat.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-zinc-500 text-sm font-medium">Tidak ada FAQ yang cocok dengan pencarian Anda.</p>
                    <button
                      onClick={() => {
                        setFaqSearch('');
                        setSelectedFaqCategory('all');
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      Tampilkan semua pertanyaan
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {filteredFaqs.map((faq) => {
                      const isExpanded = expandedFaqId === faq.id;
                      return (
                        <div key={faq.id} className="py-4">
                          <button
                            onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                            className="w-full text-left flex items-start justify-between gap-4 group"
                          >
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                {faq.category}
                              </span>
                              <h3 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-emerald-600 transition">
                                {faq.question}
                              </h3>
                            </div>
                            <ChevronDownIcon
                              className={`w-5 h-5 text-zinc-400 group-hover:text-zinc-600 flex-shrink-0 transition-transform ${
                                isExpanded ? 'rotate-180 text-emerald-600' : ''
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="mt-3 pl-1 pr-4 text-sm text-zinc-600 leading-relaxed animate-in fade-in duration-200">
                              <p className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 whitespace-pre-wrap">
                                {faq.answer}
                              </p>
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
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Hubungi Tim Klikin</h2>
                <p className="text-xs text-zinc-500">
                  Untuk pertanyaan kemitraan, pertanyaan umum, atau keluhan khusus yang tidak memerlukan pelacakan tiket.
                </p>
              </div>

              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Subjek Pertanyaan
                  </label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="Contoh: Pertanyaan seputar integrasi API atau kerja sama brand"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Isi Pesan
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Jelaskan secara mendalam pertanyaan Anda..."
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingContact}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {submittingContact ? (
                      <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <SendIcon className="w-4 h-4" />
                    )}
                    <span>Kirim Pesan Kontak</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: FEATURE FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Product Roadmap & Feedback</span>
                </div>
                <h2 className="text-lg font-bold text-zinc-900">Kirim Ide & Saran Fitur Baru</h2>
                <p className="text-xs text-zinc-500">
                  Klikin dibangun untuk Anda. Bantu kami menyempurnakan platform dengan membagikan ide-ide kreatif dan pengalaman Anda.
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Judul Ide / Permintaan Fitur
                    </label>
                    <input
                      type="text"
                      value={feedbackForm.title}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                      placeholder="Misal: Tambah opsi QR Code custom dengan logo"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center justify-between">
                      <span>Kategori Ide / Masukan</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Pilih jenis saran</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Fitur Baru', label: 'Fitur Baru', icon: SparklesIcon },
                        { id: 'Desain & UI/UX', label: 'Desain & UI/UX', icon: PaletteIcon },
                        { id: 'Integrasi', label: 'Integrasi API', icon: ZapIcon },
                        { id: 'Kinerja & Kecepatan', label: 'Kinerja', icon: ClockIcon },
                        { id: 'Lainnya', label: 'Lainnya', icon: HelpCircleIcon },
                      ].map((item) => {
                        const isSelected = feedbackForm.category === item.id;
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFeedbackForm({ ...feedbackForm, category: item.id })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-150 border ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
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
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Rincian Kebutuhan & Ekspektasi Anda
                  </label>
                  <textarea
                    value={feedbackForm.description}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                    placeholder="Ceritakan bagaimana fitur ini akan mempermudah alur kerja Anda..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800"
                    required
                  />
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Tingkat Kepuasan Anda Terhadap Platform Klikin Saat Ini (1-5 Bintang)
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                        className="p-1 rounded hover:scale-110 transition text-amber-400 focus:outline-none"
                      >
                        <StarIcon
                          className="w-6 h-6"
                          filled={star <= feedbackForm.rating}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-zinc-500 ml-2">
                      {feedbackForm.rating} dari 5 Bintang
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {submittingFeedback ? (
                      <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                    <span>Kirim Masukan Anda</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* MODAL: Buka Tiket Baru */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <LifeBuoyIcon className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Buka Tiket Bantuan Baru</h3>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-semibold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Subjek Permasalahan / Kendala
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Misal: Kendala Verifikasi DNS Custom Domain"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kategori Kendala - Custom Interactive Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center justify-between">
                    <span>Kategori Kendala</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Topik masalah</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-left bg-white flex items-center justify-between transition-all duration-200 shadow-sm ${
                      categoryDropdownOpen
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                    }`}
                  >
                    {(() => {
                      const sel = TICKET_CATEGORIES.find((c) => c.id === newTicket.category) || TICKET_CATEGORIES[0];
                      const IconComp = sel.icon;
                      return (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${sel.color}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-zinc-900 truncate leading-snug">{sel.label}</p>
                              <p className="text-[10px] text-zinc-400 truncate">{sel.badge}</p>
                            </div>
                          </div>
                          <ChevronDownIcon
                            className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
                              categoryDropdownOpen ? 'rotate-180 text-emerald-600' : ''
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
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-zinc-200 shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
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
                              className={`w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 transition-colors ${
                                isSelected ? 'bg-emerald-50/80 text-emerald-950 font-semibold' : 'hover:bg-zinc-50 text-zinc-700'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${cat.color}`}>
                                <CatIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-zinc-900 truncate">{cat.label}</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 truncate">{cat.desc}</p>
                              </div>
                              {isSelected && (
                                <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Prioritas Kendala - Segmented Visual Cards */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center justify-between">
                    <span>Prioritas Kendala</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Tingkat urgensi</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TICKET_PRIORITIES.map((pri) => {
                      const isSelected = newTicket.priority === pri.id;
                      return (
                        <button
                          key={pri.id}
                          type="button"
                          onClick={() => setNewTicket({ ...newTicket, priority: pri.id })}
                          className={`p-2 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between relative ${
                            isSelected
                              ? `${pri.activeClass} shadow-sm`
                              : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="relative flex h-2 w-2">
                              {pri.pulsing && isSelected && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${pri.dot}`}></span>
                            </span>
                            {isSelected && <CheckIcon className="w-3 h-3 text-emerald-600" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight">{pri.label}</p>
                            <p className="text-[9px] text-zinc-400 truncate mt-0.5">{pri.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Deskripsi Lengkap Masalah
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Jelaskan secara kronologis apa yang terjadi, browser yang digunakan, dan langkah yang sudah Anda coba..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Lampiran Berkas / Screenshot (URL)
                </label>
                <div className="flex items-center gap-2">
                  <PaperclipIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <input
                    type="url"
                    value={newTicket.attachment_url}
                    onChange={(e) => setNewTicket({ ...newTicket, attachment_url: e.target.value })}
                    placeholder="https://imgur.com/..., https://drive.google.com/..."
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs text-zinc-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2 shadow-md"
                >
                  {creatingTicket ? (
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
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
