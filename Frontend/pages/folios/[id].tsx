import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, FolderOpen, DollarSign, Calendar, User,
    FileText, TrendingUp, TrendingDown, Clock, CheckCircle,
    XCircle, Printer, AlertTriangle, Plus, Send, ThumbsUp, ThumbsDown,
    Lock, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { folioApi, transactionApi, userApi, Folio, Transaction, User as UserType, downloadFile } from '../../services/api';
import BilletageModal from '../../components/BilletageModal';
import TransactionModal from '../../components/TransactionModal';

// Closure Modal (Approve/Reject only)
interface ClosureModalProps {
    isOpen: boolean;
    folio: Folio;
    onClose: () => void;
    onSuccess: () => void;
    action: 'approve' | 'reject';
}

function ClosureModal({ isOpen, folio, onClose, onSuccess, action }: ClosureModalProps) {
    const { t } = useTranslation('common');
    const [actualBalance, setActualBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (action === 'approve' && folio.actual_physical_balance) {
            setActualBalance(folio.actual_physical_balance.toString());
        }
    }, [action, folio]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (action === 'approve') {
                result = await folioApi.approveClosure(folio.id, {
                    notes,
                    actual_physical_balance: actualBalance ? parseFloat(actualBalance) : undefined,
                });
            } else {
                result = await folioApi.rejectClosure(folio.id, reason);
            }

            if (result.success) {
                onSuccess();
                onClose();
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
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        {action === 'approve' && t('folio.approve_closure')}
                        {action === 'reject' && t('folio.reject_closure')}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {action === 'approve' && (
                            <>
                                <div>
                                    <label className="label">{t('folio.actual_balance')}</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            value={actualBalance}
                                            onChange={(e) => setActualBalance(e.target.value)}
                                            className="input pl-12"
                                            placeholder={folio.running_balance.toString()}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Solde calculé (Théorique): {folio.running_balance.toFixed(2)} MRU</span>
                                        {folio.actual_physical_balance && (
                                            <span className="text-blue-600 font-medium">Billetage soumis: {folio.actual_physical_balance} MRU</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="label">{t('folio.notes')}</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="input"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        {action === 'reject' && (
                            <div>
                                <label className="label">Raison du rejet *</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="input"
                                    rows={3}
                                    required
                                    placeholder="Expliquez la raison du rejet..."
                                />
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className={`flex-1 ${action === 'reject' ? 'btn-danger' : 'btn-success'}`}
                                disabled={loading || (action === 'reject' && !reason)}
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
                className="modal-content max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-red-100 text-red-600">
                            <XCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('transaction.void_transaction', 'Annuler la transaction')}
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
                            <label className="label">{t('transaction.void_reason', 'Raison de l\'annulation')} *</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="input"
                                rows={4}
                                required
                                placeholder="Expliquez la raison de l'annulation..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel', 'Annuler')}
                            </button>
                            <button
                                type="submit"
                                className="btn-danger flex-1"
                                disabled={loading || !reason.trim()}
                            >
                                {loading ? <span className="spinner" /> : t('common.confirm', 'Confirmer')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default function FolioDetailPage() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { id } = router.query;
    const { user, hasRole } = useAuth();

    const [folio, setFolio] = useState<Folio | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [closureModal, setClosureModal] = useState<{ open: boolean; action: 'approve' | 'reject' }>({
        open: false,
        action: 'approve',
    });
    const [isBilletageModalOpen, setIsBilletageModalOpen] = useState(false);
    const [isDirectCloseModalOpen, setIsDirectCloseModalOpen] = useState(false);
    const [directCloseNotes, setDirectCloseNotes] = useState('');
    const [directCloseLoading, setDirectCloseLoading] = useState(false);
    const [isAssignUsersModalOpen, setIsAssignUsersModalOpen] = useState(false);
    const [caissierUsers, setCaissierUsers] = useState<UserType[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [voidModal, setVoidModal] = useState<{ open: boolean; transaction: Transaction | null }>({
        open: false,
        transaction: null,
    });

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [folioData, transactionData] = await Promise.all([
                folioApi.get(Number(id)),
                transactionApi.list({ folio: Number(id) }),
            ]);
            setFolio(folioData);
            setTransactions(transactionData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handlePrintSummary = async () => {
        if (!folio) return;
        try {
            const blob = await folioApi.printSummary(folio.id);
            downloadFile(blob, `folio_${folio.code}.pdf`);
        } catch (error) {
            console.error('Error printing summary:', error);
        }
    };

    const handleProposeClosure = async (total: number, counts: { denomination: number; quantity: number }[]) => {
        if (!folio) return;
        try {
            const result = await folioApi.proposeClosure(folio.id, {
                notes: 'Clôture par Billetage',
                actual_physical_balance: total,
                cash_counts: counts
            });

            if (result.success) {
                fetchData();
            } else {
                alert(result.message || 'Erreur lors de la proposition de clôture');
            }
        } catch (error) {
            console.error('Error proposing closure:', error);
            alert('Erreur lors de la proposition de clôture');
        }
    };



    const handleEditTransaction = async (transactionId: number, data: any) => {
        try {
            const result = await transactionApi.update(transactionId, data);
            if (result.success) {
                fetchData();
                setIsTransactionModalOpen(false);
            } else {
                alert(result.message || 'Erreur lors de la modification de la transaction');
            }
        } catch (error) {
            console.error('Error editing transaction:', error);
            alert('Une erreur est survenue lors de la modification.');
        }
    };

    const handleDirectClose = async () => {
        if (!folio) return;
        setDirectCloseLoading(true);
        try {
            const result = await folioApi.directClose(folio.id, { notes: directCloseNotes || undefined });
            if (result.success) {
                setIsDirectCloseModalOpen(false);
                setDirectCloseNotes('');
                fetchData();
            } else {
                alert(result.message || 'Erreur lors de la clôture');
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Erreur technique');
        } finally {
            setDirectCloseLoading(false);
        }
    };

    const openAssignUsersModal = async () => {
        if (!folio) return;
        try {
            const users = await userApi.list({ role: 'CAISSIER', is_active: true });
            setCaissierUsers(users);
            setSelectedUserIds(folio.assigned_users || []);
            setIsAssignUsersModalOpen(true);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleAssignUsers = async () => {
        if (!folio) return;
        setAssignLoading(true);
        try {
            const result = await folioApi.assignUsers(folio.id, selectedUserIds);
            if (result.success) {
                setIsAssignUsersModalOpen(false);
                fetchData();
            } else {
                alert(result.message || 'Erreur');
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Erreur technique');
        } finally {
            setAssignLoading(false);
        }
    };

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

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-10 w-64 rounded" />
                <div className="skeleton h-48 rounded-2xl" />
                <div className="skeleton h-96 rounded-2xl" />
            </div>
        );
    }

    if (!folio) {
        return (
            <div className="empty-state py-20">
                <FolderOpen className="empty-state-icon" />
                <h3 className="text-lg font-medium mb-2">Folio non trouvé</h3>
                <Link href="/folios" className="btn-primary mt-4">
                    Retour aux folios
                </Link>
            </div>
        );
    }

    const canProposeClosure = folio.status === 'OPEN' && hasRole(['CAISSIER']);
    const canApproveClosure = folio.status === 'CLOSURE_PROPOSED' && hasRole(['ADMIN', 'GERANT']);
    const canRejectClosure = folio.status === 'CLOSURE_PROPOSED' && hasRole(['ADMIN', 'GERANT']);
    const canDirectClose = ['OPEN', 'CLOSURE_PROPOSED'].includes(folio.status) && hasRole(['ADMIN', 'GERANT']);
    const canAssignUsers = hasRole(['ADMIN', 'GERANT']) && folio.status !== 'ARCHIVED';
    const canAddTransaction = folio.status === 'OPEN' && hasRole(['ADMIN', 'GERANT', 'CAISSIER']);
    const canVoid = hasRole(['ADMIN', 'GERANT', 'CAISSIER']);

    const totalReceipts = transactions
        .filter(tx => tx.type === 'RECEIPT' && tx.status === 'APPROVED')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalPayments = transactions
        .filter(tx => tx.type === 'PAYMENT' && tx.status === 'APPROVED')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/folios" className="btn-icon">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {folio.code}
                            <span className={`badge ${folio.status === 'OPEN' ? 'badge-success' :
                                folio.status === 'CLOSURE_PROPOSED' ? 'badge-warning' :
                                    folio.status === 'CLOSED' ? 'badge-info' :
                                        'badge-neutral'
                                }`}>
                                {t(`folio.status_${folio.status}`)}
                            </span>
                        </h1>
                        {folio.branch_name && (
                            <p className="text-gray-500 dark:text-gray-400">{folio.branch_name}</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button onClick={handlePrintSummary} className="btn-secondary">
                        <Printer size={18} />
                        {t('folio.print_summary')}
                    </button>

                    {canAddTransaction && (
                        <button
                            onClick={() => setIsTransactionModalOpen(true)}
                            className="btn-primary"
                        >
                            <Plus size={18} />
                            {t('transaction.create')}
                        </button>
                    )}

                    {canProposeClosure && (
                        <button
                            onClick={() => setIsBilletageModalOpen(true)}
                            className="btn-secondary"
                        >
                            <Send size={18} />
                            {t('folio.propose_closure')}
                        </button>
                    )}

                    {canDirectClose && (
                        <button
                            onClick={() => setIsDirectCloseModalOpen(true)}
                            className="btn-danger"
                            id="direct-close-folio-btn"
                        >
                            <Lock size={18} />
                            Fermer le Folio
                        </button>
                    )}

                    {canAssignUsers && (
                        <button
                            onClick={openAssignUsersModal}
                            className="btn-secondary"
                            id="assign-users-btn"
                        >
                            <Users size={18} />
                            Assigner utilisateurs
                        </button>
                    )}

                    {canApproveClosure && (
                        <>
                            <button
                                onClick={() => setClosureModal({ open: true, action: 'approve' })}
                                className="btn-success"
                            >
                                <ThumbsUp size={18} />
                                {t('folio.approve_closure')}
                            </button>
                            <button
                                onClick={() => setClosureModal({ open: true, action: 'reject' })}
                                className="btn-danger"
                            >
                                <ThumbsDown size={18} />
                                {t('folio.reject_closure')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Closure Proposed Alert */}
            {folio.status === 'CLOSURE_PROPOSED' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-4"
                >
                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-400">
                            Clôture proposée
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Par {folio.closure_proposed_by_name} le {formatDate(folio.closure_proposed_at!)}
                        </p>
                        {folio.closure_notes && (
                            <p className="text-sm text-amber-600 mt-1">{folio.closure_notes}</p>
                        )}
                        {folio.actual_physical_balance && (
                            <p className="text-sm font-semibold text-amber-800 mt-1">
                                Solde physique déclaré: {formatCurrency(folio.actual_physical_balance)}
                            </p>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('folio.opening_balance')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(folio.opening_balance)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('transaction.type_RECEIPT')}</p>
                            <p className="text-xl font-bold text-emerald-600">
                                +{formatCurrency(totalReceipts)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('transaction.type_PAYMENT')}</p>
                            <p className="text-xl font-bold text-red-600">
                                -{formatCurrency(totalPayments)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('folio.running_balance')}</p>
                            <p className="text-xl font-bold text-blue-600">
                                {formatCurrency(folio.running_balance)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Folio Info */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Informations
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('folio.opened_by')}</span>
                            <span className="font-medium">{folio.opened_by_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('folio.opened_at')}</span>
                            <span className="font-medium">{formatDate(folio.opened_at)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('folio.transactions_count')}</span>
                            <span className="font-medium">{folio.transaction_count}</span>
                        </div>
                        {folio.status === 'CLOSED' && (
                            <>
                                <hr className="border-gray-200 dark:border-slate-700" />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">{t('folio.closing_balance')}</span>
                                    <span className="font-medium">{formatCurrency(folio.closing_balance!)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">{t('folio.actual_balance')}</span>
                                    <span className="font-medium">{formatCurrency(folio.actual_physical_balance || folio.closing_balance!)}</span>
                                </div>
                                {folio.variance !== null && folio.variance !== 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">{t('folio.variance')}</span>
                                        <span className={`font-medium ${Math.abs(folio.variance ?? 0) > 100 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {formatCurrency(folio.variance ?? 0)}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Transactions List */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Transactions
                        </h3>
                        <Link href={`/transactions?folio=${folio.id}`} className="text-sm text-blue-600 hover:text-blue-700">
                            Voir tout →
                        </Link>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="empty-state py-8">
                            <FileText className="empty-state-icon" />
                            <p className="text-gray-500">Aucune transaction</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {transactions.slice(0, 10).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${tx.type === 'RECEIPT'
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                                            : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                            }`}>
                                            {tx.type === 'RECEIPT' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {t(`transaction.type_${tx.type}`)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {tx.reference || tx.description || formatDate(tx.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <p className={`font-semibold ${tx.type === 'RECEIPT' ? 'text-emerald-600' : 'text-red-600'
                                            }`}>
                                            {tx.type === 'RECEIPT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </p>
                                        {tx.is_void ? (
                                            <span className="badge badge-danger text-xs px-2 py-0.5">Annulée</span>
                                        ) : tx.status === 'PENDING' ? (
                                            <span className="badge badge-warning text-xs px-2 py-0.5">En attente</span>
                                        ) : canVoid && tx.status === 'APPROVED' && folio.status === 'OPEN' ? (
                                            <button
                                                onClick={() => setVoidModal({ open: true, transaction: tx })}
                                                className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 mt-1"
                                                title={hasRole(['ADMIN', 'GERANT']) ? t('transaction.void_transaction') : 'Demander annulation'}
                                            >
                                                <XCircle size={12} />
                                                {hasRole(['ADMIN', 'GERANT']) ? 'Annuler' : 'Demander annulation'}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Closure Modal (Approve/Reject) */}
            {closureModal.open && folio && (
                <ClosureModal
                    isOpen={closureModal.open}
                    folio={folio}
                    action={closureModal.action}
                    onClose={() => setClosureModal({ open: false, action: 'approve' })}
                    onSuccess={fetchData}
                />
            )}

            {/* Billetage Modal (Propose by CAISSIER) */}
            <BilletageModal
                isOpen={isBilletageModalOpen}
                onClose={() => setIsBilletageModalOpen(false)}
                onConfirm={handleProposeClosure}
                expectedBalance={folio ? Number(folio.running_balance) : undefined}
            />

            {/* Direct Close Modal (Admin/GERANT) */}
            {isDirectCloseModalOpen && (
                <div className="modal-overlay" onClick={() => setIsDirectCloseModalOpen(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fermer le Folio</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Solde de clôture calculé : <strong>{formatCurrency(folio.running_balance)}</strong>
                            </p>
                            <div className="mb-4">
                                <label className="label">Notes (optionnel)</label>
                                <textarea
                                    value={directCloseNotes}
                                    onChange={(e) => setDirectCloseNotes(e.target.value)}
                                    className="input"
                                    rows={3}
                                    placeholder="Raison de la clôture directe..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDirectCloseModalOpen(false)}
                                    className="btn-secondary flex-1"
                                    disabled={directCloseLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDirectClose}
                                    className="btn-danger flex-1"
                                    disabled={directCloseLoading}
                                    id="confirm-direct-close-btn"
                                >
                                    {directCloseLoading ? <span className="spinner" /> : 'Confirmer la clôture'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Assign Users Modal (Admin/GERANT) */}
            {isAssignUsersModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAssignUsersModalOpen(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Assigner des utilisateurs
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Sélectionnez les caisssiers qui peuvent accéder au folio {folio.code}.
                            </p>
                            <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
                                {caissierUsers.length === 0 ? (
                                    <p className="text-sm text-gray-500">Aucun caissier actif disponible</p>
                                ) : (
                                    caissierUsers.map((u) => (
                                        <label key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.includes(u.id)}
                                                onChange={(e) =>
                                                    setSelectedUserIds(prev =>
                                                        e.target.checked
                                                            ? [...prev, u.id]
                                                            : prev.filter(id => id !== u.id)
                                                    )
                                                }
                                                className="w-4 h-4 rounded"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {u.first_name} {u.last_name}
                                                </span>
                                                <span className="text-xs text-gray-500 ml-2">(@{u.username})</span>
                                                {u.branch_name && (
                                                    <span className="text-xs text-blue-500 ml-2">{u.branch_name}</span>
                                                )}
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsAssignUsersModalOpen(false)}
                                    className="btn-secondary flex-1"
                                    disabled={assignLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAssignUsers}
                                    className="btn-primary flex-1"
                                    disabled={assignLoading}
                                    id="confirm-assign-users-btn"
                                >
                                    {assignLoading ? <span className="spinner" /> : `Assigner (${selectedUserIds.length})`}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={isTransactionModalOpen}
                folioId={Number(id)}
                onClose={() => setIsTransactionModalOpen(false)}
                onSuccess={() => {
                    fetchData();
                    setIsTransactionModalOpen(false);
                }}
            />

            {/* Void Modal */}
            <VoidModal
                isOpen={voidModal.open}
                transaction={voidModal.transaction}
                onClose={() => setVoidModal({ open: false, transaction: null })}
                onSuccess={fetchData}
            />
        </div>
    );
}

export async function getServerSideProps({ locale, params }: { locale: string; params: { id: string } }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}
