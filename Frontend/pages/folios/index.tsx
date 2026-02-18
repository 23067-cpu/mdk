import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Plus, Search, Filter, FolderOpen, Clock,
    CheckCircle, AlertTriangle, Archive, Eye,
    ChevronRight, Calendar, User, DollarSign,
    FileText, XCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { folioApi, Folio } from '../../services/api';

// Status badge colors
const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
    DRAFT: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', badge: 'badge-neutral' },
    OPEN: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', badge: 'badge-success' },
    CLOSURE_PROPOSED: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', badge: 'badge-warning' },
    CLOSED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', badge: 'badge-info' },
    ARCHIVED: { bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-500', badge: 'badge-neutral' },
};

// Create Folio Modal
interface CreateFolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function CreateFolioModal({ isOpen, onClose, onSuccess }: CreateFolioModalProps) {
    const { t } = useTranslation('common');
    const [openingBalance, setOpeningBalance] = useState('0');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await folioApi.create({
                opening_balance: parseFloat(openingBalance) || 0,
                notes: notes || undefined,
            });

            if (result.success) {
                onSuccess();
                onClose();
                setOpeningBalance('0');
                setNotes('');
            } else {
                setError(result.message || 'Error creating folio');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error creating folio');
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
                        {t('folio.create')}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">{t('folio.opening_balance')}</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    className="input pl-12"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">{t('folio.notes')}</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="input"
                                rows={3}
                                placeholder="Notes optionnelles..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary flex-1"
                                disabled={loading}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn-primary flex-1"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="spinner" />
                                        {t('common.loading')}
                                    </span>
                                ) : (
                                    t('common.create')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default function FoliosPage() {
    const { t } = useTranslation('common');
    const { user, hasRole } = useAuth();

    const [folios, setFolios] = useState<Folio[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const fetchFolios = async () => {
        setLoading(true);
        try {
            const data = await folioApi.list(statusFilter ? { status: statusFilter } : undefined);
            setFolios(data);
        } catch (error) {
            console.error('Error fetching folios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolios();
    }, [statusFilter]);

    const filteredFolios = folios.filter(folio => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            folio.code.toLowerCase().includes(query) ||
            folio.opened_by_name?.toLowerCase().includes(query) ||
            folio.branch_name?.toLowerCase().includes(query)
        );
    });

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('fr-FR', {
            style: 'decimal',
            minimumFractionDigits: 2,
        }).format(num) + ' MRU';
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

    const canCreateFolio = hasRole(['ADMIN', 'GERANT', 'CAISSIER']);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('folio.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gérez vos folios de caisse et suivez les transactions
                    </p>
                </div>

                {canCreateFolio && (
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        {t('folio.create')}
                    </button>
                )}
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
                            placeholder="Rechercher par code, utilisateur..."
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setStatusFilter('')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!statusFilter
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            Tous
                        </button>
                        {['OPEN', 'CLOSURE_PROPOSED', 'CLOSED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === status
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {status === 'OPEN' && <FolderOpen size={14} />}
                                {status === 'CLOSURE_PROPOSED' && <Clock size={14} />}
                                {status === 'CLOSED' && <CheckCircle size={14} />}
                                {t(`folio.status_${status}`)}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchFolios}
                        className="btn-icon"
                        title={t('common.refresh')}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Folios Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card p-6">
                            <div className="space-y-4">
                                <div className="skeleton h-6 w-3/4 rounded" />
                                <div className="skeleton h-4 w-1/2 rounded" />
                                <div className="skeleton h-20 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredFolios.length === 0 ? (
                <div className="card p-12">
                    <div className="empty-state">
                        <FolderOpen className="empty-state-icon" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Aucun folio trouvé
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {statusFilter
                                ? `Aucun folio avec le statut "${t(`folio.status_${statusFilter}`)}"`
                                : 'Commencez par créer un nouveau folio'
                            }
                        </p>
                        {canCreateFolio && !statusFilter && (
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="btn-primary"
                            >
                                <Plus size={18} />
                                {t('folio.create')}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFolios.map((folio, index) => (
                        <motion.div
                            key={folio.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link href={`/folios/${folio.id}`}>
                                <div className="card-hover p-6 h-full">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {folio.code}
                                            </h3>
                                            {folio.branch_name && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {folio.branch_name}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`badge ${statusColors[folio.status]?.badge || 'badge-neutral'}`}>
                                            {t(`folio.status_${folio.status}`)}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <DollarSign size={14} />
                                                {t('folio.opening_balance')}
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(folio.opening_balance)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <DollarSign size={14} />
                                                {t('folio.running_balance')}
                                            </span>
                                            <span className="font-semibold text-blue-600">
                                                {formatCurrency(folio.running_balance)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <FileText size={14} />
                                                {t('folio.transactions_count')}
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {folio.transaction_count}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <User size={12} />
                                                {folio.opened_by_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDate(folio.opened_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Variance Warning */}
                                    {folio.status === 'CLOSED' && folio.variance != null && folio.variance !== 0 && (
                                        <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-2 ${Math.abs(folio.variance ?? 0) > 100
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                            <AlertTriangle size={14} />
                                            Écart: {formatCurrency(folio.variance)}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <CreateFolioModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchFolios}
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
