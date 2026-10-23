import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';
import { XIcon, AlertCircleIcon, TrashIcon, DownloadIcon } from '../Icons';

const EXPENSE_CATEGORIES = [
  { id: 'database', label: 'Database Managed PostgreSQL (Supabase)' },
  { id: 'server_vps', label: 'Server & Cloud Edge Hosting (Cloudflare/AWS)' },
  { id: 'domain_dns', label: 'DNS, Domain & SSL Automation' },
  { id: 'email_smtp', label: 'Email Transaksional SMTP (Resend/Sendgrid)' },
  { id: 'payment_fee', label: 'Payment Gateway Fee (Midtrans/Xendit)' },
  { id: 'security_ssl', label: 'APM Monitoring & Keamanan (Sentry)' },
  { id: 'third_party_api', label: 'Integrasi API Pihak Ketiga' },
  { id: 'other', label: 'Operasional Lainnya' },
];

/**
 * Modal Catat / Edit Biaya Infrastruktur & Operasional
 */
export function AddEditExpenseModal({ isOpen, onClose, onSuccess, initialExpense = null, token }) {
  const isEdit = Boolean(initialExpense);

  const [category, setCategory] = useState('database');
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [monthPeriod, setMonthPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [incurredDate, setIncurredDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialExpense) {
      setCategory(initialExpense.category || 'database');
      setTitle(initialExpense.title || '');
      setVendor(initialExpense.vendor || '');
      setAmount(initialExpense.amount ? String(initialExpense.amount) : '');
      setBillingCycle(initialExpense.billing_cycle || 'monthly');
      setMonthPeriod(initialExpense.month_period || new Date().toISOString().slice(0, 7));
      setIncurredDate(
        initialExpense.incurred_date
          ? new Date(initialExpense.incurred_date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setReceiptUrl(initialExpense.receipt_url || '');
      setNotes(initialExpense.notes || '');
    } else {
      setCategory('database');
      setTitle('');
      setVendor('');
      setAmount('');
      setBillingCycle('monthly');
      setMonthPeriod(new Date().toISOString().slice(0, 7));
      setIncurredDate(new Date().toISOString().slice(0, 10));
      setReceiptUrl('');
      setNotes('');
    }
    setError(null);
  }, [initialExpense, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedAmount = parseInt(amount, 10);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Judul dan jumlah biaya harus diisi dengan benar');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        category,
        title: title.trim(),
        vendor: vendor.trim(),
        amount: parsedAmount,
        billing_cycle: billingCycle,
        month_period: monthPeriod,
        incurred_date: incurredDate,
        receipt_url: receiptUrl.trim(),
        notes: notes.trim(),
      };

      const url = isEdit
        ? `${API_BASE}/admin/finance/expenses/${initialExpense.id}`
        : `${API_BASE}/admin/finance/expenses`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan biaya');
      }

      onSuccess(isEdit ? 'Biaya operasional berhasil diperbarui.' : 'Biaya operasional berhasil dicatat.');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isEdit ? 'Perbarui Biaya Infrastruktur' : 'Catat Biaya Infrastruktur & Operasional'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Input biaya operasional platform untuk kalkulasi otomatis margin laba bersih
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Biaya *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Pengeluaran *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Compute Supabase Pro"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Penyedia *</label>
              <input
                type="text"
                required
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Contoh: Supabase Inc."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Biaya (Rp) *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="385000"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Siklus Penagihan</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="monthly">Bulanan (Monthly)</option>
                <option value="yearly">Tahunan (Yearly)</option>
                <option value="one_off">Sekali Bayar (One-off)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Periode Bulan (YYYY-MM)</label>
              <input
                type="month"
                required
                value={monthPeriod}
                onChange={(e) => setMonthPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                required
                value={incurredDate}
                onChange={(e) => setIncurredDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">URL Dokumen / Bukti Bayar</label>
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://invoice.supabase.com/receipt/..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Administratif</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Spesifikasi server, alokasi memori, atau alasan biaya tambahan..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal Konfirmasi Hapus Biaya
 */
export function DeleteExpenseModal({ isOpen, onClose, onSuccess, expense, token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !expense) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/finance/expenses/${expense.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus biaya');
      }
      onSuccess(`Biaya ${expense.title} berhasil dihapus.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <TrashIcon className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">Hapus Biaya Operasional</h3>
          <p className="text-xs text-slate-500 mt-1">
            Apakah Anda yakin ingin menghapus pencatatan biaya <strong>{expense.title}</strong> ({expense.vendor}) sebesar{' '}
            <strong className="text-slate-900">Rp {Number(expense.amount).toLocaleString('id-ID')}</strong>? Aksi ini akan langsung mempengaruhi perhitungan laba bersih.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Terbitkan Faktur Manual
 */
export function CreateManualInvoiceModal({ isOpen, onClose, onSuccess, token }) {
  const [userId, setUserId] = useState('usr_owner_kopi');
  const [planName, setPlanName] = useState('Klikin Pro (Bulanan)');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [amount, setAmount] = useState('29000');
  const [paymentChannel, setPaymentChannel] = useState('qris');
  const [billingReason] = useState('admin_manual');
  const [status, setStatus] = useState('paid');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedAmount = parseInt(amount, 10);
    if (!userId.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('User ID dan jumlah tagihan harus diisi dengan benar');
      setLoading(false);
      return;
    }

    try {
      const tax = Math.round(parsedAmount * 0.11);
      const res = await fetch(`${API_BASE}/admin/finance/invoices/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          plan_name: planName,
          billing_cycle: billingCycle,
          amount: parsedAmount,
          tax,
          payment_channel: paymentChannel,
          billing_reason: billingReason,
          status,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menerbitkan faktur manual');
      }

      onSuccess(`Faktur manual ${data.data?.invoice_number || ''} berhasil diterbitkan.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Terbitkan Faktur Manual</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Penerbitan faktur tagihan untuk upgrade manual atau penyesuaian billing tenant
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Tenant (User ID) *</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <option value="usr_owner_kopi">Kopi Seduh Nusantara (usr_owner_kopi)</option>
              <option value="usr_owner_fashion">Nayla Hijab Official (usr_owner_fashion)</option>
              <option value="usr_owner_gadget">Tech Review Nusantara (usr_owner_gadget)</option>
              <option value="usr_owner_creator">Studio Kreatif Official (usr_owner_creator)</option>
              <option value="usr_owner_fit">Coach Fani Health (usr_owner_fit)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item / Nama Paket *</label>
              <select
                value={planName}
                onChange={(e) => {
                  setPlanName(e.target.value);
                  if (e.target.value.includes('Tahunan')) {
                    setAmount('290000');
                    setBillingCycle('yearly');
                  } else {
                    setAmount('29000');
                    setBillingCycle('monthly');
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="Klikin Pro (Bulanan)">Klikin Pro (Bulanan) - Rp29.000</option>
                <option value="Klikin Pro (Tahunan)">Klikin Pro (Tahunan) - Rp290.000</option>
                <option value="Custom Domain Setup">Custom Domain Setup Fee - Rp50.000</option>
                <option value="Penyesuaian Manual">Penyesuaian Billing Khusus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subtotal (Rp) *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kanal Pembayaran</label>
              <select
                value={paymentChannel}
                onChange={(e) => setPaymentChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="qris">QRIS (GoPay/OVO/ShopeePay)</option>
                <option value="bank_transfer">Virtual Account (BCA/Mandiri/BRI)</option>
                <option value="credit_card">Kartu Kredit/Debit (Visa/Mastercard)</option>
                <option value="e_wallet">E-Wallet Direct</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pembayaran</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <option value="paid">Lunas (Selesai)</option>
                <option value="pending">Menunggu Pembayaran (Pending)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Administratif</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keterangan penagihan, alasan penyesuaian, atau nomor referensi bank..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Menerbitkan...' : 'Terbitkan Faktur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal Ekspor Laporan Keuangan
 */
export function ExportFinanceReportModal({ isOpen, onClose, token }) {
  const [period, setPeriod] = useState('30d');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/finance/export?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal mengunduh CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klikin-financial-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      alert('Gagal mengekspor laporan: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Ekspor Laporan Keuangan</h3>
          <p className="text-xs text-slate-400 mt-1">
            Unduh rekonsiliasi finansial, ringkasan P&L, serta alokasi biaya operasional dalam format CSV
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Rentang Periode</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir (Default)</option>
            <option value="90d">90 Hari Terakhir</option>
            <option value="12m">12 Bulan Terakhir</option>
            <option value="ytd">Tahun Berjalan (YTD)</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={downloading}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>{downloading ? 'Mengunduh...' : 'Unduh CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
