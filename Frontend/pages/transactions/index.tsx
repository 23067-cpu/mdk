import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Plus, Search, Filter, TrendingUp, TrendingDown,
    Calendar, RefreshCw, Printer, XCircle, Download,
    FileText, ChevronDown, Eye, CheckCircle, Clock, AlertTriangle, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { transactionApi, folioApi, reportPdfApi, Transaction, Folio, downloadFile } from '../../services/api';
import TransactionModal from '../../components/TransactionModal';

// Status badges
const statusBadge: Record<string, string> = {
    PENDING: 'badge-warning',
    APPROVED: 'badge-success',
    REJECTED: 'badge-danger',
    VOID: 'badge-neutral',
};

// Payment method icons
const paymentMethodIcons: Record<string, string> = {
    CASH: '💵',
    CARD: '💳',
    TRANSFER: '🏦',
    CHECK: '📝',
    MOBILE: '📱',
    OTHER: '📋',
};

// Void Transaction Modal
interface VoidModalProps {
    isOpen: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onSuccess: () => void;
}

function VoidModal({ isOpen, transaction, onClose, onSuccess }: VoidModalProps) {
    const { t } = useTranslation('common');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction) return;

        setError('');
        setLoading(true);

        try {
            const result = await transactionApi.void(transaction.id, reason);
            if (result.success) {
                onSuccess();
                onClose();
                setReason('');
            } else {
                setError(result.message || 'Error');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !transaction) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-red-100 text-red-600">
                            <XCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('transaction.void_transaction')}
                            </h2>
                            <p className="text-sm text-gray-500">
                                Transaction #{transaction.id} - {parseFloat(transaction.amount).toFixed(2)} MRU
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">{t('transaction.void_reason')} *</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="input"
                                rows={4}
                                required
                                placeholder={t('transaction.void_reason_placeholder')}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn-danger flex-1"
                                disabled={loading || reason.length < 10}
                            >
                                {loading ? <span className="spinner" /> : t('common.confirm')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

// ── Confirm Approve/Reject Modal ──────────────────────────────────────────────
interface ConfirmActionModalProps {
    isOpen: boolean;
    type: 'approve' | 'reject';
    transaction: Transaction | null;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}

function ConfirmActionModal({ isOpen, type, transaction, onClose, onConfirm, loading }: ConfirmActionModalProps) {
    const { t } = useTranslation('common');
    if (!isOpen || !transaction) return null;

    const isApprove = type === 'approve';
    const amount = parseFloat(transaction.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' MRU';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="modal-content max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className={`p-3 rounded-2xl ${isApprove
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                            : 'bg-red-100 dark:bg-red-900/40 text-red-600'}`}>
                            {isApprove ? <CheckCircle size={28} /> : <XCircle size={28} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isApprove ? t('transaction.confirm_approve_title') : t('transaction.confirm_reject_title')}
                            </h2>
                            <p className="text-sm text-gray-500">{t('transaction.confirm_action_desc')}</p>
                        </div>
                    </div>

                    {/* Transaction Details Card */}
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 mb-6 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t('transaction.amount')}</span>
                            <span className={`font-bold text-base ${transaction.type === 'RECEIPT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {transaction.type === 'RECEIPT' ? '+' : '-'}{amount}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t('transaction.type')}</span>
                            <span className="font-medium text-gray-800 dark:text-white">{t(`transaction.type_${transaction.type}`)}</span>
                        </div>
                        {transaction.reference && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{t('transaction.reference')}</span>
                                <span className="font-medium text-gray-800 dark:text-white">{transaction.reference}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Folio</span>
                            <span className="font-medium text-gray-800 dark:text-white">{transaction.folio_code || transaction.folio}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 ${isApprove ? 'btn-success' : 'btn-danger'}`}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner" /> : (
                                isApprove ? t('common.confirm') : t('settlement.reject')
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function TransactionsPage() {

    const { t } = useTranslation('common');
    const router = useRouter();
    const { user, hasRole } = useAuth();
    const [pdfLoading, setPdfLoading] = useState(false);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [voidModal, setVoidModal] = useState<{ open: boolean; transaction: Transaction | null }>({
        open: false,
        transaction: null,
    });
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        type: 'approve' | 'reject';
        transaction: Transaction | null;
        loading: boolean;
    }>({ open: false, type: 'approve', transaction: null, loading: false });

    // Get filters & actions from query params
    const folioFilter = router.query.folio ? Number(router.query.folio) : undefined;
    const actionQuery = router.query.action as string;
    const typeQuery = router.query.type as string;

    // Handle auto-opening the create modal based on URL params
    useEffect(() => {
        if (router.isReady && actionQuery === 'new') {
            setCreateModalOpen(true);
            // Optionally clear the query param so it doesn't re-trigger on refresh
            const { action, type, folio, ...restList } = router.query;
            router.replace({ pathname: router.pathname, query: restList }, undefined, { shallow: true });
        }
    }, [router.isReady, actionQuery]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (folioFilter) params.folio = folioFilter.toString();
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const data = await transactionApi.list(params);
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [typeFilter, statusFilter, dateFrom, dateTo, folioFilter]);

    const handlePrintReceipt = async (transaction: Transaction) => {
        try {
            const blob = await transactionApi.printReceipt(transaction.id);
            downloadFile(blob, `receipt_${transaction.receipt_number || transaction.id}.pdf`);
        } catch (error) {
            console.error('Error printing receipt:', error);
        }
    };

    const handleExport = async () => {
        try {
            const params: Record<string, string> = {};
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const blob = await transactionApi.export(params);
            downloadFile(blob, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error('Error exporting:', error);
        }
    };

    const handleExportPDF = async () => {
        setPdfLoading(true);
        try {
            const params: Record<string, string> = {};
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (folioFilter) params.folio = folioFilter.toString();

            // Use the same params to generate a PDF report for these transactions
            const blob = await reportPdfApi.downloadPDF({
                date_from: params.date_from || '',
                date_to: params.date_to || ''
            });
            downloadFile(blob, `rapport_transactions_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert(t('common.error'));
        } finally {
            setPdfLoading(false);
        }
    };

    const filteredTransactions = transactions.filter((tx) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            tx.folio_code?.toLowerCase().includes(query) ||
            tx.reference?.toLowerCase().includes(query) ||
            tx.description?.toLowerCase().includes(query) ||
            tx.client_name?.toLowerCase().includes(query) ||
            tx.supplier_name?.toLowerCase().includes(query) ||
            tx.receipt_number?.toLowerCase().includes(query)
        );
    });

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(num) + ' MRU';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const canCreate = hasRole(['ADMIN', 'GERANT', 'CAISSIER']);
    const canVoid = hasRole(['ADMIN', 'GERANT', 'CAISSIER']);
    const canApproveVoid = hasRole(['ADMIN', 'GERANT']);
    const canExportCSV = hasRole(['CAISSIER']);
    const canExportPDF = hasRole(['ADMIN', 'GERANT']);

    const handleApproveVoid = async (tx: Transaction) => {
        if (!confirm(t('transaction.confirm_approve_void').replace('{{id}}', tx.id.toString()))) return;
        try {
            await transactionApi.approveVoid(tx.id);
            fetchTransactions();
        } catch (error) {
            alert(error instanceof Error ? error.message : t('common.error'));
        }
    };

    const handleRejectVoid = async (tx: Transaction) => {
        const reason = prompt(t('transaction.prompt_reject_reason'));
        if (!reason) return;
        try {
            await transactionApi.rejectVoid(tx.id, reason);
            fetchTransactions();
        } catch (error) {
            alert(error instanceof Error ? error.message : t('common.error'));
        }
    };

    const handleApproveTransaction = async (tx: Transaction) => {
        setConfirmModal({ open: true, type: 'approve', transaction: tx, loading: false });
    };

    const handleRejectTransaction = async (tx: Transaction) => {
        setConfirmModal({ open: true, type: 'reject', transaction: tx, loading: false });
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.transaction) return;
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
            if (confirmModal.type === 'approve') {
                const result = await transactionApi.approve(confirmModal.transaction.id);
                if (!result.success) alert(result.message || t('common.error'));
            } else {
                const result = await transactionApi.reject(confirmModal.transaction.id);
                if (!result.success) alert(result.message || t('common.error'));
            }
            fetchTransactions();
        } catch (error) {
            alert(error instanceof Error ? error.message : t('common.error'));
        } finally {
            setConfirmModal({ open: false, type: 'approve', transaction: null, loading: false });
        }
    };


    // Calculate totals
    const totalReceipts = filteredTransactions
        .filter((tx) => tx.type === 'RECEIPT' && tx.status === 'APPROVED')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalPayments = filteredTransactions
        .filter((tx) => tx.type === 'PAYMENT' && tx.status === 'APPROVED')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('transaction.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('transaction.description')}
                    </p>
                </div>

                <div className="flex gap-2">
                    {canExportCSV && (
                        <button onClick={handleExport} className="btn-secondary">
                            <Download size={18} />
                            {t('transaction.export')}
                        </button>
                    )}
                    {canExportPDF && (
                        <button onClick={handleExportPDF} className="btn-primary" disabled={pdfLoading}>
                            {pdfLoading ? <span className="spinner" /> : <Download size={18} />}
                            {t('reports.download_pdf')}
                        </button>
                    )}
                    {canCreate && (
                        <button onClick={() => setCreateModalOpen(true)} className="btn-primary">
                            <Plus size={18} />
                            {t('transaction.create')}
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('reports.total_in')}</p>
                        <p className="text-xl font-bold text-emerald-600">+{formatCurrency(totalReceipts)}</p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('reports.total_out')}</p>
                        <p className="text-xl font-bold text-red-600">-{formatCurrency(totalPayments)}</p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t('reports.net_balance')}</p>
                        <p className={`text-xl font-bold ${totalReceipts - totalPayments >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(totalReceipts - totalPayments)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
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
                        <option value="">{t('transaction.type')}</option>
                        <option value="RECEIPT">{t('transaction.type_RECEIPT')}</option>
                        <option value="PAYMENT">{t('transaction.type_PAYMENT')}</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="select"
                    >
                        <option value="">{t('transaction.status')}</option>
                        <option value="APPROVED">{t('transaction.status_APPROVED')}</option>
                        <option value="PENDING">{t('transaction.status_PENDING')}</option>
                        <option value="VOID">{t('transaction.status_VOID')}</option>
                    </select>

                    {/* Date From */}
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="input"
                    />

                    {/* Date To */}
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="input"
                    />
                </div>
            </div>

            {/* Transactions Table */}
            <div className="table-container">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="skeleton h-16 rounded" />
                        ))}
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-12">
                        <div className="empty-state">
                            <FileText className="empty-state-icon" />
                            <h3 className="text-lg font-medium mb-2">{t('transaction.not_found')}</h3>
                            <p className="text-gray-500 mb-4">{t('transaction.not_found_desc')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('transaction.type')}</th>
                                    <th>{t('transaction.amount')}</th>
                                    <th>{t('transaction.payment_method')}</th>
                                    <th>Folio</th>
                                    <th>{t('transaction.reference')}</th>
                                    <th>{t('transaction.created_by')}</th>
                                    <th>{t('transaction.created_at')}</th>
                                    <th>{t('transaction.status')}</th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((tx, index) => (
                                    <motion.tr
                                        key={tx.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${tx.type === 'RECEIPT'
                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                                                    : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                                    }`}>
                                                    {tx.type === 'RECEIPT' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                </div>
                                                <span className="font-medium">{t(`transaction.type_${tx.type}`)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`font-semibold ${tx.type === 'RECEIPT' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                {tx.type === 'RECEIPT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="flex items-center gap-1">
                                                {paymentMethodIcons[tx.payment_method] || '📋'}
                                                {tx.payment_method_display}
                                            </span>
                                        </td>
                                        <td>
                                            <Link href={`/folios/${tx.folio}`} className="text-blue-600 hover:underline">
                                                {tx.folio_code}
                                            </Link>
                                        </td>
                                        <td className="text-gray-600 dark:text-gray-400">
                                            {tx.reference || tx.client_name || tx.supplier_name || '-'}
                                        </td>
                                        <td>{tx.created_by_name}</td>
                                        <td className="text-sm text-gray-500">{formatDate(tx.created_at)}</td>
                                        <td>
                                            <span className={`badge ${statusBadge[tx.status] || 'badge-neutral'}`}>
                                                {t(`transaction.status_${tx.status}`)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                {tx.type === 'RECEIPT' && tx.status === 'APPROVED' && (
                                                    <button
                                                        onClick={() => handlePrintReceipt(tx)}
                                                        className="btn-icon"
                                                        title={t('transaction.print_receipt')}
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                )}
                                                {/* Approve / Reject void request (Admin/GERANT only, PENDING transactions with void request) */}
                                                {canApproveVoid && tx.status === 'PENDING' && tx.void_requested_by && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApproveVoid(tx)}
                                                            className="btn-icon text-emerald-600 hover:bg-emerald-50"
                                                            title={t('transaction.approve_void')}
                                                            id={`approve-void-btn-${tx.id}`}
                                                        >
                                                            <ThumbsUp size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectVoid(tx)}
                                                            className="btn-icon text-red-600 hover:bg-red-50"
                                                            title={t('transaction.reject_void')}
                                                            id={`reject-void-btn-${tx.id}`}
                                                        >
                                                            <ThumbsDown size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {/* Approve / Reject pending transaction (Admin/GERANT, no void) */}
                                                {tx.status === 'PENDING' && !tx.void_requested_by && canApproveVoid && (
                                                    tx.requires_admin && !hasRole(['ADMIN']) ? (
                                                        // GERANT sees this badge but NO action buttons
                                                        <span className="badge badge-warning text-xs" title={t('transaction.requires_admin_approval')}>
                                                            🔒 Admin
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveTransaction(tx)}
                                                                className="btn-icon text-emerald-600 hover:bg-emerald-50"
                                                                title={t('transaction.confirm_approve_title')}
                                                                id={`approve-tx-btn-${tx.id}`}
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectTransaction(tx)}
                                                                className="btn-icon text-red-600 hover:bg-red-50"
                                                                title={t('transaction.confirm_reject_title')}
                                                                id={`reject-tx-btn-${tx.id}`}
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )
                                                )}
                                                {/* Void button: direct for Admin/GERANT, request for others */}
                                                {canVoid && tx.status === 'APPROVED' && !tx.is_void && (
                                                    <button
                                                        onClick={() => setVoidModal({ open: true, transaction: tx })}
                                                        className="btn-icon text-red-600 hover:bg-red-50"
                                                        title={hasRole(['ADMIN', 'GERANT']) ? t('transaction.void_transaction') : t('transaction.request_void')}
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Transaction Modal */}
            <TransactionModal
                isOpen={createModalOpen}
                defaultType={(typeQuery as 'RECEIPT' | 'PAYMENT') || undefined}
                folioId={folioFilter}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchTransactions}
            />

            {/* Void Modal */}
            <VoidModal
                isOpen={voidModal.open}
                transaction={voidModal.transaction}
                onClose={() => setVoidModal({ open: false, transaction: null })}
                onSuccess={fetchTransactions}
            />

            {/* Approve / Reject Confirmation Modal */}
            <ConfirmActionModal
                isOpen={confirmModal.open}
                type={confirmModal.type}
                transaction={confirmModal.transaction}
                onClose={() => setConfirmModal({ open: false, type: 'approve', transaction: null, loading: false })}
                onConfirm={handleConfirmAction}
                loading={confirmModal.loading}
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
