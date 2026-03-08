import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import {
    Plus, Search, Receipt, Users, Building2,
    Calendar, RefreshCw, AlertTriangle, CheckCircle,
    Clock, DollarSign, Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceApi, Invoice } from '../../services/api';

// Status badges
const statusBadge: Record<string, string> = {
    DRAFT: 'badge-neutral',
    SENT: 'badge-info',
    PAID: 'badge-success',
    PARTIAL: 'badge-warning',
    OVERDUE: 'badge-danger',
    CANCELLED: 'badge-neutral',
};

// Create Invoice Modal
interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
    const { t } = useTranslation('common');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceType, setInvoiceType] = useState<'CLIENT' | 'SUPPLIER'>('CLIENT');
    const [partyName, setPartyName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await invoiceApi.create({
                invoice_number: invoiceNumber,
                invoice_type: invoiceType,
                party_name: partyName,
                total_amount: parseFloat(totalAmount),
                due_date: dueDate || undefined,
                notes: notes || undefined,
            });

            onSuccess();
            onClose();
            // Reset form
            setInvoiceNumber('');
            setPartyName('');
            setTotalAmount('');
            setDueDate('');
            setNotes('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal-content max-w-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('invoice.create')}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Invoice Number */}
                        <div>
                            <label className="label">{t('invoice.invoice_number')} *</label>
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="input"
                                placeholder="FAC-2024-001"
                                required
                            />
                        </div>

                        {/* Invoice Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setInvoiceType('CLIENT')}
                                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${invoiceType === 'CLIENT'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                            >
                                <Users size={20} />
                                {t('invoice.type_CLIENT')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setInvoiceType('SUPPLIER')}
                                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${invoiceType === 'SUPPLIER'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                            >
                                <Building2 size={20} />
                                {t('invoice.type_SUPPLIER')}
                            </button>
                        </div>

                        {/* Party Name */}
                        <div>
                            <label className="label">{t('invoice.party_name')} *</label>
                            <input
                                type="text"
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                                className="input"
                                required
                                placeholder={invoiceType === 'CLIENT' ? 'Nom du client' : 'Nom du fournisseur'}
                            />
                        </div>

                        {/* Total Amount */}
                        <div>
                            <label className="label">{t('invoice.total_amount')} *</label>
                            <input
                                type="number"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                className="input"
                                placeholder="0.00"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="label">{t('invoice.due_date')}</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="input"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="label">{t('folio.notes')}</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="input"
                                rows={2}
                                placeholder="Notes optionnelles..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn-primary flex-1"
                                disabled={loading || !invoiceNumber || !partyName || !totalAmount}
                            >
                                {loading ? <span className="spinner" /> : t('common.create')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default function InvoicesPage() {
    const { t } = useTranslation('common');
    const { user, hasRole } = useAuth();
    const router = useRouter();

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;

            const data = await invoiceApi.list(params);
            setInvoices(data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [typeFilter, statusFilter]);

    const filteredInvoices = invoices.filter((inv) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            inv.invoice_number.toLowerCase().includes(query) ||
            inv.party_name.toLowerCase().includes(query)
        );
    });

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(num) + ' MRU';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const canCreate = hasRole(['ADMIN', 'GERANT']);

    // Stats
    const totalOpen = invoices
        .filter((inv) => ['SENT', 'PARTIAL'].includes(inv.status))
        .reduce((sum, inv) => sum + parseFloat(inv.remaining_amount), 0);

    const overdueCount = invoices.filter((inv) => inv.is_overdue).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('invoice.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('invoice.subtitle')}
                    </p>
                </div>

                {canCreate && (
                    <button onClick={() => setCreateModalOpen(true)} className="btn-primary">
                        <Plus size={18} />
                        {t('invoice.create')}
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('invoice.stats_total')}</p>
                        <p className="text-xl font-bold text-blue-600">{invoices.length}</p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('invoice.stats_receivable')}</p>
                        <p className="text-xl font-bold text-amber-600">{formatCurrency(totalOpen)}</p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${overdueCount > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                        {overdueCount > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('invoice.stats_overdue')}</p>
                        <p className={`text-xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {overdueCount}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-12 rtl:pl-4 rtl:pr-12"
                            placeholder={t('common.search')}
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="select"
                    >
                        <option value="">{t('invoice.type')}</option>
                        <option value="CLIENT">{t('invoice.type_CLIENT')}</option>
                        <option value="SUPPLIER">{t('invoice.type_SUPPLIER')}</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="select"
                    >
                        <option value="">{t('invoice.status')}</option>
                        <option value="SENT">{t('invoice.status_SENT')}</option>
                        <option value="PARTIAL">{t('invoice.status_PARTIAL')}</option>
                        <option value="PAID">{t('invoice.status_PAID')}</option>
                        <option value="OVERDUE">{t('invoice.status_OVERDUE')}</option>
                    </select>

                    <button onClick={fetchInvoices} className="btn-icon" title={t('common.refresh')}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Invoices Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card p-6">
                            <div className="space-y-4">
                                <div className="skeleton h-6 w-3/4 rounded" />
                                <div className="skeleton h-4 w-1/2 rounded" />
                                <div className="skeleton h-16 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="card p-12">
                    <div className="empty-state">
                        <Receipt className="empty-state-icon" />
                        <h3 className="text-lg font-medium mb-2">{t('invoice.no_invoices')}</h3>
                        <p className="text-gray-500 mb-4">{t('invoice.no_invoices_match')}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInvoices.map((invoice, index) => (
                        <motion.div
                            key={invoice.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card-hover p-6 cursor-pointer"
                            onClick={() => router.push(`/invoices/${invoice.id}`)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`p-1 rounded ${invoice.invoice_type === 'CLIENT'
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                            : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                                            }`}>
                                            {invoice.invoice_type === 'CLIENT' ? <Users size={14} /> : <Building2 size={14} />}
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {invoice.invoice_number}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{invoice.party_name}</p>
                                </div>
                                <span className={`badge ${statusBadge[invoice.status] || 'badge-neutral'}`}>
                                    {t(`invoice.status_${invoice.status}`)}
                                </span>
                            </div>

                            {/* Amounts */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{t('invoice.total_amount')}</span>
                                    <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{t('invoice.paid_amount')}</span>
                                    <span className="font-medium text-emerald-600">{formatCurrency(invoice.paid_amount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{t('invoice.remaining_amount')}</span>
                                    <span className={`font-semibold ${parseFloat(invoice.remaining_amount) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {formatCurrency(invoice.remaining_amount)}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                                    style={{
                                        width: `${Math.min(100, (parseFloat(invoice.paid_amount) / parseFloat(invoice.total_amount)) * 100)}%`
                                    }}
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatDate(invoice.due_date)}
                                </span>
                                {invoice.is_overdue && (
                                    <span className="flex items-center gap-1 text-red-600">
                                        <AlertTriangle size={12} />
                                        En retard
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Invoice Modal */}
            <CreateInvoiceModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchInvoices}
            />
        </div>
    );
}

export async function getStaticProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}
