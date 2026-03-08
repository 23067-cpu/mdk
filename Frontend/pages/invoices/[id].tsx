import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, Receipt, Users, Building2, DollarSign, Calendar,
    Clock, CheckCircle, AlertTriangle, FileText, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceApi, Invoice } from '../../services/api';

const statusBadge: Record<string, string> = {
    DRAFT: 'badge-neutral',
    SENT: 'badge-info',
    PAID: 'badge-success',
    PARTIAL: 'badge-warning',
    OVERDUE: 'badge-danger',
    CANCELLED: 'badge-neutral',
};

export default function InvoiceDetailPage() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { id } = router.query;
    const { hasRole } = useAuth();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInvoice = async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const data = await invoiceApi.get(Number(id));
            setInvoice(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(num) + ' MRU';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric',
        });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-10 w-64 rounded" />
                <div className="skeleton h-48 rounded-2xl" />
                <div className="skeleton h-64 rounded-2xl" />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="card p-12">
                <div className="empty-state">
                    <Receipt className="empty-state-icon" />
                    <h3 className="text-lg font-medium mb-2">{error || 'Facture non trouvée'}</h3>
                    <Link href="/invoices" className="btn-primary mt-4">
                        {t('common.back')}
                    </Link>
                </div>
            </div>
        );
    }

    const totalAmount = parseFloat(invoice.total_amount);
    const paidAmount = parseFloat(invoice.paid_amount);
    const remainingAmount = parseFloat(invoice.remaining_amount);
    const paidPercent = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/invoices" className="btn-icon">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {invoice.invoice_number}
                            <span className={`badge ${statusBadge[invoice.status] || 'badge-neutral'}`}>
                                {t(`invoice.status_${invoice.status}`)}
                            </span>
                            {invoice.is_overdue && (
                                <span className="badge badge-danger">{t('invoice.status_OVERDUE')}</span>
                            )}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                            {invoice.invoice_type === 'CLIENT'
                                ? <Users size={16} />
                                : <Building2 size={16} />}
                            {invoice.party_name} · {t(`invoice.type_${invoice.invoice_type}`)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Overdue Alert */}
            {invoice.is_overdue && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3"
                >
                    <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                    <div>
                        <p className="font-semibold text-red-800 dark:text-red-400">
                            {t('invoice.status_OVERDUE')}
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-300">
                            {t('invoice.due_date')}: {formatDate(invoice.due_date)}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Amount Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                    className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('invoice.total_amount')}</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(invoice.total_amount)}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('invoice.paid_amount')}</p>
                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(invoice.paid_amount)}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${remainingAmount > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                            {remainingAmount > 0 ? <Clock size={24} /> : <TrendingUp size={24} />}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('invoice.remaining_amount')}</p>
                            <p className={`text-xl font-bold ${remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {formatCurrency(invoice.remaining_amount)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Payment Progress Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="card p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('invoice.paid_amount')}</h3>
                    <span className="text-sm font-bold text-blue-600">{paidPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${paidPercent}%` }}
                        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                        className={`h-3 rounded-full ${paidPercent >= 100 ? 'bg-emerald-500' : paidPercent > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0</span>
                    <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
            </motion.div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Invoice Info */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        {t('invoice.title')} #{invoice.invoice_number}
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                            <span className="text-sm text-gray-500">{t('invoice.type')}</span>
                            <span className="font-medium flex items-center gap-2">
                                {invoice.invoice_type === 'CLIENT'
                                    ? <><Users size={14} /> {t('invoice.type_CLIENT')}</>
                                    : <><Building2 size={14} /> {t('invoice.type_SUPPLIER')}</>}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                            <span className="text-sm text-gray-500">{t('invoice.party_name')}</span>
                            <span className="font-medium">{invoice.party_name}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                            <span className="text-sm text-gray-500">{t('invoice.status')}</span>
                            <span className={`badge ${statusBadge[invoice.status] || 'badge-neutral'}`}>
                                {t(`invoice.status_${invoice.status}`)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                            <span className="text-sm text-gray-500">{t('common.created_at') || 'Créé le'}</span>
                            <span className="font-medium">{formatDateTime(invoice.created_at)}</span>
                        </div>
                        {invoice.due_date && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                                <span className="text-sm text-gray-500">{t('invoice.due_date')}</span>
                                <span className={`font-medium flex items-center gap-2 ${invoice.is_overdue ? 'text-red-600' : ''}`}>
                                    <Calendar size={14} />
                                    {formatDate(invoice.due_date)}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Notes */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="card p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        {t('folio.notes')}
                    </h3>
                    {invoice.notes ? (
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1">{invoice.notes}</p>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-gray-400 text-sm italic">{t('common.no_data') || 'Aucune note'}</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export async function getServerSideProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}
