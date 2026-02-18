import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Plus, Search, Filter, FileCheck, Users, Building2,
    Calendar, RefreshCw, Clock, CheckCircle, XCircle,
    ChevronDown, Eye, ThumbsUp, ThumbsDown, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { settlementApi, invoiceApi, folioApi, Settlement, Invoice, Folio } from '../../services/api';

// Status badges
const statusBadge: Record<string, string> = {
    DRAFT: 'badge-neutral',
    PROPOSED: 'badge-warning',
    APPROVED: 'badge-success',
    REJECTED: 'badge-danger',
    CANCELLED: 'badge-neutral',
};

// Approve/Reject Modal
interface ApprovalModalProps {
    isOpen: boolean;
    settlement: Settlement | null;
    action: 'approve' | 'reject';
    onClose: () => void;
    onSuccess: () => void;
}

function ApprovalModal({ isOpen, settlement, action, onClose, onSuccess }: ApprovalModalProps) {
    const { t } = useTranslation('common');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settlement) return;

        setError('');
        setLoading(true);

        try {
            let result;
            if (action === 'approve') {
                result = await settlementApi.approve(settlement.id);
            } else {
                result = await settlementApi.reject(settlement.id, reason);
            }

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

    if (!isOpen || !settlement) return null;

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
                        <div className={`p-3 rounded-xl ${action === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {action === 'approve' ? <ThumbsUp size={24} /> : <ThumbsDown size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {action === 'approve' ? t('settlement.approve') : t('settlement.reject')}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {settlement.party_name} - {parseFloat(settlement.amount).toFixed(2)} MRU
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {action === 'reject' && (
                            <div>
                                <label className="label">{t('settlement.rejection_reason')} *</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="input"
                                    rows={4}
                                    required
                                    minLength={10}
                                    placeholder="Expliquez la raison du rejet..."
                                />
                            </div>
                        )}

                        {action === 'approve' && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                    Vous êtes sur le point d&apos;approuver ce règlement. Cette action est irréversible.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className={`flex-1 ${action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                disabled={loading || (action === 'reject' && reason.length < 10)}
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

// Create Settlement Modal
interface CreateSettlementModalProps {
    isOpen: boolean;
    defaultPartyType?: 'CLIENT' | 'SUPPLIER';
    onClose: () => void;
    onSuccess: () => void;
}

function CreateSettlementModal({ isOpen, defaultPartyType, onClose, onSuccess }: CreateSettlementModalProps) {
    const { t } = useTranslation('common');
    const [partyType, setPartyType] = useState<'CLIENT' | 'SUPPLIER'>(defaultPartyType || 'CLIENT');
    const [partyName, setPartyName] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedFolio, setSelectedFolio] = useState<number | null>(null);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [folios, setFolios] = useState<Folio[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            folioApi.list({ status: 'OPEN' }).then(setFolios).catch(console.error);
            if (defaultPartyType) setPartyType(defaultPartyType);
        }
    }, [isOpen, defaultPartyType]);

    useEffect(() => {
        // Fetch invoices based on party type
        if (isOpen) {
            invoiceApi.list({ type: partyType, open_only: true })
                .then(setInvoices)
                .catch(console.error);
        }
    }, [isOpen, partyType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFolio) {
            setError('Veuillez sélectionner un folio');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await settlementApi.create({
                folio: selectedFolio,
                party_type: partyType,
                party_name: partyName,
                amount: parseFloat(amount),
                method: method || undefined,
                reference: reference || undefined,
                notes: notes || undefined,
                invoice_ids: selectedInvoices.length > 0 ? selectedInvoices : undefined,
            });

            if (result.success) {
                onSuccess();
                onClose();
                // Reset form
                setPartyName('');
                setAmount('');
                setMethod('');
                setReference('');
                setNotes('');
                setSelectedInvoices([]);
            } else {
                setError(result.message || 'Error');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setLoading(false);
        }
    };

    const toggleInvoice = (id: number) => {
        setSelectedInvoices(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('settlement.create')}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Party Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPartyType('CLIENT')}
                                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${partyType === 'CLIENT'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                            >
                                <Users size={20} />
                                {t('settlement.party_CLIENT')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPartyType('SUPPLIER')}
                                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${partyType === 'SUPPLIER'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                            >
                                <Building2 size={20} />
                                {t('settlement.party_SUPPLIER')}
                            </button>
                        </div>

                        {/* Folio Selection */}
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

                        {/* Party Name */}
                        <div>
                            <label className="label">{t('settlement.party_name')} *</label>
                            <input
                                type="text"
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                                className="input"
                                required
                                placeholder={partyType === 'CLIENT' ? 'Nom du client' : 'Nom du fournisseur'}
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="label">{t('settlement.amount')} *</label>
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

                        {/* Method */}
                        <div>
                            <label className="label">{t('settlement.method')}</label>
                            <input
                                type="text"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="input"
                                placeholder="Ex: Espèces, Virement, Chèque..."
                            />
                        </div>

                        {/* Reference */}
                        <div>
                            <label className="label">{t('settlement.reference')}</label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="input"
                                placeholder="Référence optionnelle..."
                            />
                        </div>

                        {/* Linked Invoices */}
                        {invoices.length > 0 && (
                            <div>
                                <label className="label">{t('settlement.linked_invoices')}</label>
                                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-slate-700 rounded-xl">
                                    {invoices.map((invoice) => (
                                        <label
                                            key={invoice.id}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedInvoices.includes(invoice.id)
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200'
                                                : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInvoices.includes(invoice.id)}
                                                    onChange={() => toggleInvoice(invoice.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                                />
                                                <div>
                                                    <p className="font-medium text-sm">{invoice.invoice_number}</p>
                                                    <p className="text-xs text-gray-500">{invoice.party_name}</p>
                                                </div>
                                            </div>
                                            <span className="font-medium text-sm">
                                                {parseFloat(invoice.remaining_amount).toFixed(2)} MRU
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                disabled={loading || !partyName || !amount || !selectedFolio}
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

export default function SettlementsPage() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { user, hasRole } = useAuth();

    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [partyTypeFilter, setPartyTypeFilter] = useState<string>('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [approvalModal, setApprovalModal] = useState<{
        open: boolean;
        settlement: Settlement | null;
        action: 'approve' | 'reject';
    }>({ open: false, settlement: null, action: 'approve' });

    // Get default party type from query params or role
    const defaultPartyType = router.query.party_type as 'CLIENT' | 'SUPPLIER' | undefined;

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (statusFilter) params.status = statusFilter;
            if (partyTypeFilter) params.party_type = partyTypeFilter;

            const data = await settlementApi.list(params);
            setSettlements(data);
        } catch (error) {
            console.error('Error fetching settlements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettlements();
    }, [statusFilter, partyTypeFilter]);

    const handlePropose = async (settlement: Settlement) => {
        try {
            await settlementApi.propose(settlement.id);
            fetchSettlements();
        } catch (error) {
            console.error('Error proposing settlement:', error);
        }
    };

    const filteredSettlements = settlements.filter((s) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            s.party_name.toLowerCase().includes(query) ||
            s.reference?.toLowerCase().includes(query) ||
            s.created_by_name?.toLowerCase().includes(query)
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
        });
    };

    const canCreate = hasRole(['ADMIN', 'GERANT', 'CAISSIER', 'SAISIE_CLIENT', 'SAISIE_FOURNISSEUR']);
    const canApprove = hasRole(['ADMIN', 'GERANT']);

    // Stats
    const pendingCount = settlements.filter((s) => s.status === 'PROPOSED').length;
    const totalAmount = settlements
        .filter((s) => s.status === 'APPROVED')
        .reduce((sum, s) => sum + parseFloat(s.amount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('settlement.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gérez les règlements clients et fournisseurs
                    </p>
                </div>

                {canCreate && (
                    <button onClick={() => setCreateModalOpen(true)} className="btn-primary">
                        <Plus size={18} />
                        {t('settlement.create')}
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En attente</p>
                        <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total approuvé</p>
                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalAmount)}</p>
                    </div>
                </div>

                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                        <FileCheck size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total règlements</p>
                        <p className="text-xl font-bold text-blue-600">{settlements.length}</p>
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

                    {/* Party Type Filter */}
                    <select
                        value={partyTypeFilter}
                        onChange={(e) => setPartyTypeFilter(e.target.value)}
                        className="select"
                    >
                        <option value="">{t('settlement.party_type')}</option>
                        <option value="CLIENT">{t('settlement.party_CLIENT')}</option>
                        <option value="SUPPLIER">{t('settlement.party_SUPPLIER')}</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="select"
                    >
                        <option value="">{t('transaction.status')}</option>
                        <option value="DRAFT">{t('settlement.status_DRAFT')}</option>
                        <option value="PROPOSED">{t('settlement.status_PROPOSED')}</option>
                        <option value="APPROVED">{t('settlement.status_APPROVED')}</option>
                        <option value="REJECTED">{t('settlement.status_REJECTED')}</option>
                    </select>

                    <button onClick={fetchSettlements} className="btn-icon" title={t('common.refresh')}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Settlements Table */}
            <div className="table-container">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="skeleton h-16 rounded" />
                        ))}
                    </div>
                ) : filteredSettlements.length === 0 ? (
                    <div className="p-12">
                        <div className="empty-state">
                            <FileCheck className="empty-state-icon" />
                            <h3 className="text-lg font-medium mb-2">Aucun règlement</h3>
                            <p className="text-gray-500 mb-4">Aucun règlement ne correspond à vos critères</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('settlement.party_type')}</th>
                                    <th>{t('settlement.party_name')}</th>
                                    <th>{t('settlement.amount')}</th>
                                    <th>{t('settlement.method')}</th>
                                    <th>{t('transaction.created_by')}</th>
                                    <th>{t('transaction.created_at')}</th>
                                    <th>{t('transaction.status')}</th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSettlements.map((settlement, index) => (
                                    <motion.tr
                                        key={settlement.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${settlement.party_type === 'CLIENT'
                                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                                    : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                                                    }`}>
                                                    {settlement.party_type === 'CLIENT' ? <Users size={16} /> : <Building2 size={16} />}
                                                </div>
                                                <span>{t(`settlement.party_${settlement.party_type}`)}</span>
                                            </div>
                                        </td>
                                        <td className="font-medium">{settlement.party_name}</td>
                                        <td className="font-semibold">{formatCurrency(settlement.amount)}</td>
                                        <td className="text-gray-600 dark:text-gray-400">{settlement.method || '-'}</td>
                                        <td>{settlement.created_by_name}</td>
                                        <td className="text-sm text-gray-500">{formatDate(settlement.created_at)}</td>
                                        <td>
                                            <span className={`badge ${statusBadge[settlement.status] || 'badge-neutral'}`}>
                                                {t(`settlement.status_${settlement.status}`)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                {settlement.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handlePropose(settlement)}
                                                        className="btn-icon text-blue-600"
                                                        title={t('settlement.propose')}
                                                    >
                                                        <FileCheck size={16} />
                                                    </button>
                                                )}
                                                {canApprove && settlement.status === 'PROPOSED' && (
                                                    <>
                                                        <button
                                                            onClick={() => setApprovalModal({ open: true, settlement, action: 'approve' })}
                                                            className="btn-icon text-emerald-600"
                                                            title={t('settlement.approve')}
                                                        >
                                                            <ThumbsUp size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setApprovalModal({ open: true, settlement, action: 'reject' })}
                                                            className="btn-icon text-red-600"
                                                            title={t('settlement.reject')}
                                                        >
                                                            <ThumbsDown size={16} />
                                                        </button>
                                                    </>
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

            {/* Create Settlement Modal */}
            <CreateSettlementModal
                isOpen={createModalOpen}
                defaultPartyType={defaultPartyType}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchSettlements}
            />

            {/* Approval Modal */}
            <ApprovalModal
                isOpen={approvalModal.open}
                settlement={approvalModal.settlement}
                action={approvalModal.action}
                onClose={() => setApprovalModal({ open: false, settlement: null, action: 'approve' })}
                onSuccess={fetchSettlements}
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
