import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import {
    Shield, Search, Calendar, RefreshCw, User,
    Eye, FileText, Settings, Lock, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auditLogApi, AuditLog } from '../../services/api';

// Action type icons
const actionIcons: Record<string, React.ReactNode> = {
    LOGIN: <User size={16} />,
    LOGOUT: <User size={16} />,
    CREATE: <FileText size={16} />,
    UPDATE: <Settings size={16} />,
    DELETE: <FileText size={16} />,
    APPROVE: <Shield size={16} />,
    REJECT: <Shield size={16} />,
    VOID: <FileText size={16} />,
    VIEW: <Eye size={16} />,
};

// Action type colors
const actionColors: Record<string, string> = {
    LOGIN: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    LOGOUT: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30',
    CREATE: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
    UPDATE: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
    DELETE: 'bg-red-100 text-red-600 dark:bg-red-900/30',
    APPROVE: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
    REJECT: 'bg-red-100 text-red-600 dark:bg-red-900/30',
    VOID: 'bg-red-100 text-red-600 dark:bg-red-900/30',
    VIEW: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
};

export default function AuditLogPage() {
    const { t } = useTranslation('common');
    const { user, hasRole } = useAuth();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedLog, setExpandedLog] = useState<number | null>(null);

    // Set default date range (last 7 days)
    useEffect(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setDateFrom(weekAgo.toISOString().split('T')[0]);
        setDateTo(now.toISOString().split('T')[0]);
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (actionFilter) params.action = actionFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const data = await auditLogApi.list(params);
            setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dateFrom && dateTo) {
            fetchLogs();
        }
    }, [actionFilter, dateFrom, dateTo]);

    const filteredLogs = logs.filter((log) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            log.user_name?.toLowerCase().includes(query) ||
            log.action?.toLowerCase().includes(query) ||
            log.object_type?.toLowerCase().includes(query) ||
            log.object_repr?.toLowerCase().includes(query) ||
            log.details?.toLowerCase().includes(query)
        );
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Get unique actions for filter
    const uniqueActions = [...new Set(logs.map((log) => log.action))].filter(Boolean);

    if (!hasRole(['ADMIN', 'GERANT'])) {
        return (
            <div className="empty-state py-20">
                <Lock className="empty-state-icon" />
                <h3 className="text-lg font-medium mb-2">{t('auth.access_denied')}</h3>
                <p className="text-gray-500">Cette page est réservée aux administrateurs et gérants</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Shield className="text-blue-500" />
                        {t('nav.audit')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Historique complet des actions système
                    </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Activity size={16} />
                    {logs.length} événements
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-12 rtl:pl-4 rtl:pr-12"
                            placeholder="Rechercher..."
                        />
                    </div>

                    {/* Action Filter */}
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="select"
                    >
                        <option value="">Toutes les actions</option>
                        {uniqueActions.map((action) => (
                            <option key={action} value={action}>
                                {action}
                            </option>
                        ))}
                    </select>

                    {/* Date From */}
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="input"
                    />

                    {/* Date To */}
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="input flex-1"
                        />
                        <button onClick={fetchLogs} className="btn-icon" title={t('common.refresh')}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Log Timeline */}
            <div className="card">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="skeleton h-20 rounded" />
                        ))}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12">
                        <div className="empty-state">
                            <Shield className="empty-state-icon" />
                            <h3 className="text-lg font-medium mb-2">Aucun événement</h3>
                            <p className="text-gray-500">Aucun événement ne correspond à vos critères</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                        {filteredLogs.map((log, index) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`p-2 rounded-lg flex-shrink-0 ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                        {actionIcons[log.action] || <Activity size={16} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {log.action}
                                            </span>
                                            {log.object_type && (
                                                <span className="text-sm text-gray-500">
                                                    sur {log.object_type}
                                                </span>
                                            )}
                                            {log.object_repr && (
                                                <span className="text-sm font-medium text-blue-600">
                                                    "{log.object_repr}"
                                                </span>
                                            )}
                                        </div>

                                        {log.details && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {log.details}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User size={12} />
                                                {log.user_name || 'Système'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDate(log.timestamp)}
                                            </span>
                                            {log.ip_address && (
                                                <span>IP: {log.ip_address}</span>
                                            )}
                                        </div>

                                        {/* Expandable Details */}
                                        {(log.before_state || log.after_state) && (
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                >
                                                    <Eye size={12} />
                                                    {expandedLog === log.id ? 'Masquer' : 'Voir'} les détails
                                                </button>

                                                {expandedLog === log.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4"
                                                    >
                                                        {log.before_state && (
                                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">
                                                                    Avant
                                                                </p>
                                                                <pre className="text-xs text-red-600 dark:text-red-300 overflow-auto max-h-40">
                                                                    {JSON.stringify(log.before_state, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                        {log.after_state && (
                                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                                                                    Après
                                                                </p>
                                                                <pre className="text-xs text-emerald-600 dark:text-emerald-300 overflow-auto max-h-40">
                                                                    {JSON.stringify(log.after_state, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
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
