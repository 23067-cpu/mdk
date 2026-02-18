import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import {
    BarChart3, Download, Printer, Calendar, TrendingUp, TrendingDown,
    FileText, Filter, RefreshCw, DollarSign, Users, Building2, PieChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { transactionApi, Transaction, downloadFile } from '../../services/api';

export default function ReportsPage() {
    const { t } = useTranslation('common');
    const { user, hasRole } = useAuth();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [activeReport, setActiveReport] = useState<'summary' | 'transactions' | 'methods'>('summary');

    // Set default date range (current month)
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        setDateFrom(firstDay.toISOString().split('T')[0]);
        setDateTo(now.toISOString().split('T')[0]);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (typeFilter) params.type = typeFilter;

            const data = await transactionApi.list(params);
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dateFrom && dateTo) {
            fetchData();
        }
    }, [dateFrom, dateTo, typeFilter]);

    const handleExportCSV = async () => {
        try {
            const params: Record<string, string> = {};
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (typeFilter) params.type = typeFilter;

            const blob = await transactionApi.export(params);
            downloadFile(blob, `rapport_transactions_${dateFrom}_${dateTo}.csv`);
        } catch (error) {
            console.error('Error exporting:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(amount) + ' MRU';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Calculate statistics
    const approvedTransactions = transactions.filter(tx => tx.status === 'APPROVED' && !tx.is_void);

    const totalReceipts = approvedTransactions
        .filter(tx => tx.type === 'RECEIPT')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalPayments = approvedTransactions
        .filter(tx => tx.type === 'PAYMENT')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const netBalance = totalReceipts - totalPayments;

    const receiptCount = approvedTransactions.filter(tx => tx.type === 'RECEIPT').length;
    const paymentCount = approvedTransactions.filter(tx => tx.type === 'PAYMENT').length;

    // Payment method breakdown
    const methodBreakdown = approvedTransactions.reduce((acc, tx) => {
        const method = tx.payment_method || 'OTHER';
        if (!acc[method]) {
            acc[method] = { receipts: 0, payments: 0, total: 0 };
        }
        if (tx.type === 'RECEIPT') {
            acc[method].receipts += parseFloat(tx.amount);
        } else {
            acc[method].payments += parseFloat(tx.amount);
        }
        acc[method].total += parseFloat(tx.amount);
        return acc;
    }, {} as Record<string, { receipts: number; payments: number; total: number }>);

    // Daily breakdown
    const dailyBreakdown = approvedTransactions.reduce((acc, tx) => {
        const date = tx.created_at.split('T')[0];
        if (!acc[date]) {
            acc[date] = { receipts: 0, payments: 0 };
        }
        if (tx.type === 'RECEIPT') {
            acc[date].receipts += parseFloat(tx.amount);
        } else {
            acc[date].payments += parseFloat(tx.amount);
        }
        return acc;
    }, {} as Record<string, { receipts: number; payments: number }>);

    const sortedDays = Object.keys(dailyBreakdown).sort();

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header - Hidden on print */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('reports.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Analyses et rapports de trésorerie
                    </p>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleExportCSV} className="btn-secondary">
                        <Download size={18} />
                        {t('reports.export_csv')}
                    </button>
                    <button onClick={handlePrint} className="btn-primary">
                        <Printer size={18} />
                        {t('reports.print')}
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-8">
                <h1 className="text-2xl font-bold">NexaSolft Treasury</h1>
                <h2 className="text-xl">Rapport de Trésorerie</h2>
                <p className="text-gray-600">
                    Période: {formatDate(dateFrom)} - {formatDate(dateTo)}
                </p>
            </div>

            {/* Filters - Hidden on print */}
            <div className="card p-4 print:hidden">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="input"
                        />
                        <span className="text-gray-400">→</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="input"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="select"
                    >
                        <option value="">Tous les types</option>
                        <option value="RECEIPT">{t('transaction.type_RECEIPT')}</option>
                        <option value="PAYMENT">{t('transaction.type_PAYMENT')}</option>
                    </select>

                    <button onClick={fetchData} className="btn-icon" title={t('common.refresh')}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Report Tabs */}
                <div className="flex gap-2 mt-4">
                    {[
                        { id: 'summary', label: 'Résumé', icon: <BarChart3 size={16} /> },
                        { id: 'transactions', label: 'Transactions', icon: <FileText size={16} /> },
                        { id: 'methods', label: 'Par méthode', icon: <PieChart size={16} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveReport(tab.id as typeof activeReport)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${activeReport === tab.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('reports.total_in')}</p>
                            <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(totalReceipts)}</p>
                            <p className="text-xs text-gray-400">{receiptCount} transactions</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('reports.total_out')}</p>
                            <p className="text-2xl font-bold text-red-600">-{formatCurrency(totalPayments)}</p>
                            <p className="text-xs text-gray-400">{paymentCount} transactions</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${netBalance >= 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('reports.net_balance')}</p>
                            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Summary Report */}
            {activeReport === 'summary' && (
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={20} />
                        Résumé journalier
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="skeleton h-12 rounded" />
                            ))}
                        </div>
                    ) : sortedDays.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Aucune donnée pour cette période</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th className="text-right">{t('transaction.type_RECEIPT')}</th>
                                        <th className="text-right">{t('transaction.type_PAYMENT')}</th>
                                        <th className="text-right">Solde</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDays.map((date) => {
                                        const { receipts, payments } = dailyBreakdown[date];
                                        const dayNet = receipts - payments;
                                        return (
                                            <tr key={date}>
                                                <td>{formatDate(date)}</td>
                                                <td className="text-right text-emerald-600 font-medium">
                                                    +{formatCurrency(receipts)}
                                                </td>
                                                <td className="text-right text-red-600 font-medium">
                                                    -{formatCurrency(payments)}
                                                </td>
                                                <td className={`text-right font-semibold ${dayNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                    {dayNet >= 0 ? '+' : ''}{formatCurrency(dayNet)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-gray-200 dark:border-slate-600">
                                        <td className="font-bold">Total</td>
                                        <td className="text-right text-emerald-600 font-bold">+{formatCurrency(totalReceipts)}</td>
                                        <td className="text-right text-red-600 font-bold">-{formatCurrency(totalPayments)}</td>
                                        <td className={`text-right font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Transactions Report */}
            {activeReport === 'transactions' && (
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        Détail des transactions
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="skeleton h-12 rounded" />
                            ))}
                        </div>
                    ) : approvedTransactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Aucune transaction pour cette période</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table text-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Montant</th>
                                        <th>Méthode</th>
                                        <th>Référence</th>
                                        <th>Créé par</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvedTransactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td>{formatDate(tx.created_at)}</td>
                                            <td>
                                                <span className={`inline-flex items-center gap-1 ${tx.type === 'RECEIPT' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}>
                                                    {tx.type === 'RECEIPT' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {t(`transaction.type_${tx.type}`)}
                                                </span>
                                            </td>
                                            <td className={`font-medium ${tx.type === 'RECEIPT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {tx.type === 'RECEIPT' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
                                            </td>
                                            <td>{tx.payment_method_display || '-'}</td>
                                            <td className="text-gray-500">{tx.reference || tx.client_name || tx.supplier_name || '-'}</td>
                                            <td className="text-gray-500">{tx.created_by_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Methods Report */}
            {activeReport === 'methods' && (
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <PieChart size={20} />
                        Répartition par méthode de paiement
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="skeleton h-16 rounded" />
                            ))}
                        </div>
                    ) : Object.keys(methodBreakdown).length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Aucune donnée pour cette période</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(methodBreakdown).map(([method, data]) => (
                                <div key={method} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {t(`transaction.method_${method}`)}
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(data.total)}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">{t('transaction.type_RECEIPT')}</span>
                                            <span className="text-emerald-600 font-medium">+{formatCurrency(data.receipts)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">{t('transaction.type_PAYMENT')}</span>
                                            <span className="text-red-600 font-medium">-{formatCurrency(data.payments)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Print Footer */}
            <div className="hidden print:block text-center mt-8 pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-600">
                    Rapport généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                </p>
                <p className="text-sm text-gray-600">© {new Date().getFullYear()} NexaSolft - www.nexasoft.mr</p>
            </div>
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
