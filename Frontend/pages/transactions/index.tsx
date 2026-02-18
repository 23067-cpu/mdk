import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Plus, Search, Filter, TrendingUp, TrendingDown,
    Calendar, RefreshCw, Printer, XCircle, Download,
    FileText, ChevronDown, Eye, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { transactionApi, folioApi, Transaction, Folio, downloadFile } from '../../services/api';

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
                                minLength={10}
                                placeholder="Expliquez la raison de l'annulation (minimum 10 caractères)..."
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

// Create Transaction Modal
interface CreateTransactionModalProps {
    isOpen: boolean;
    defaultType?: 'RECEIPT' | 'PAYMENT';
    folioId?: number;
    onClose: () => void;
    onSuccess: () => void;
}

function CreateTransactionModal({ isOpen, defaultType, folioId, onClose, onSuccess }: CreateTransactionModalProps) {
    const { t } = useTranslation('common');
    const [type, setType] = useState<'RECEIPT' | 'PAYMENT'>(defaultType || 'RECEIPT');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedFolio, setSelectedFolio] = useState<number | null>(folioId || null);
    const [folios, setFolios] = useState<Folio[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            folioApi.list({ status: 'OPEN' }).then(setFolios).catch(console.error);
            if (defaultType) setType(defaultType);
            if (folioId) setSelectedFolio(folioId);
        }
    }, [isOpen, defaultType, folioId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFolio) {
            setError('Veuillez sélectionner un folio');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await transactionApi.create({
                folio: selectedFolio,
                type,
                amount: parseFloat(amount),
                payment_method: paymentMethod,
                reference: reference || undefined,
                description: description || undefined,
                client_name: type === 'RECEIPT' ? clientName || undefined : undefined,
                supplier_name: type === 'PAYMENT' ? clientName || undefined : undefined,
            });

            if (result.success) {
                onSuccess();
                onClose();
                // Reset form
                setAmount('');
                setReference('');
                setDescription('');
                setClientName('');
            } else {
                setError(result.message || 'Error');
            }
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
                        {t('transaction.create')}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Transaction Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType('RECEIPT')}
                                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${type === 'RECEIPT'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                            >
                                <TrendingUp size={20} />
                                {t('transaction.type_RECEIPT')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('PAYMENT')}
                                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${type === 'PAYMENT'
                                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                            >
                                <TrendingDown size={20} />
                                {t('transaction.type_PAYMENT')}
                            </button>
                        </div>

                        {/* Folio Selection */}
                        {!folioId && (
                            <div>
                                <label className="label">Folio *</label>
                                <select
                                    value={selectedFolio || ''}
                                    onChange={(e) => setSelectedFolio(Number(e.target.value))}
                                    className="select"
                                    required
                                >
                                    <option value="">Sélectionnez un folio</option>
                                    {folios.map((folio) => (
                                        <option key={folio.id} value={folio.id}>
                                            {folio.code} - {folio.running_balance.toFixed(2)} MRU
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="label">{t('transaction.amount')} *</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input"
                                placeholder="0.00"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="label">{t('transaction.payment_method')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['CASH', 'CARD', 'TRANSFER', 'CHECK', 'MOBILE', 'OTHER'].map((method) => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method)}
                                        className={`p-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all ${paymentMethod === method
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span>{paymentMethodIcons[method]}</span>
                                        <span className="hidden sm:inline">{t(`transaction.method_${method}`)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Client/Supplier Name */}
                        <div>
                            <label className="label">
                                {type === 'RECEIPT' ? t('transaction.client_name') : t('transaction.supplier_name')}
                            </label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="input"
                                placeholder="Nom..."
                            />
                        </div>

                        {/* Reference */}
                        <div>
                            <label className="label">{t('transaction.reference')}</label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="input"
                                placeholder="Référence optionnelle..."
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="label">{t('transaction.description')}</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input"
                                rows={2}
                                placeholder="Description optionnelle..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className={`flex-1 ${type === 'RECEIPT' ? 'btn-success' : 'btn-danger'}`}
                                disabled={loading || !amount || !selectedFolio}
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

export default function TransactionsPage() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { user, hasRole } = useAuth();

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

    // Get folio filter from query params
    const folioFilter = router.query.folio ? Number(router.query.folio) : undefined;

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
    const canExport = hasRole(['ADMIN', 'GERANT', 'CAISSIER']);

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
                        Journal de toutes les transactions
                    </p>
                </div>

                <div className="flex gap-2">
                    {canExport && (
                        <button onClick={handleExport} className="btn-secondary">
                            <Download size={18} />
                            {t('transaction.export')}
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
                            <h3 className="text-lg font-medium mb-2">Aucune transaction</h3>
                            <p className="text-gray-500 mb-4">Aucune transaction ne correspond à vos critères</p>
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
                                                {canVoid && tx.status === 'APPROVED' && !tx.is_void && (
                                                    <button
                                                        onClick={() => setVoidModal({ open: true, transaction: tx })}
                                                        className="btn-icon text-red-600 hover:bg-red-50"
                                                        title={t('transaction.void_transaction')}
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
            <CreateTransactionModal
                isOpen={createModalOpen}
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
