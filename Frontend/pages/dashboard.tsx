import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import {
    Wallet, FolderOpen, TrendingUp, TrendingDown,
    Clock, AlertTriangle, Shield, Users, Building2,
    Plus, ArrowRight, FileText, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { DashboardData, Folio, Transaction, Settlement, Invoice } from '../services/api';
import { LineChartComponent, PieChartComponent, BarChartComponent } from '../components/Charts';

// Chart data is now provided dynamically via the API (dashboardData.cash_flow_data / payment_methods_data)

interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    loading?: boolean;
}

function KPICard({ title, value, icon, trend, trendValue, variant = 'default', loading }: KPICardProps) {
    const gradientClasses = {
        default: 'from-blue-500 to-cyan-500',
        success: 'from-emerald-500 to-teal-500',
        warning: 'from-amber-500 to-orange-500',
        danger: 'from-red-500 to-pink-500',
    };

    const variantClasses = {
        default: '',
        success: 'success',
        warning: 'warning',
        danger: 'danger',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={`kpi-card ${variantClasses[variant]} hover:shadow-lg transition-shadow duration-300`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</p>
                    {loading ? (
                        <div className="skeleton h-8 w-28 rounded-lg" />
                    ) : (
                        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
                    )}
                    {trendValue && (
                        <p className={`text-sm mt-2 flex items-center gap-1 font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                            {trend === 'up' && <TrendingUp size={14} />}
                            {trend === 'down' && <TrendingDown size={14} />}
                            {trendValue}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClasses[variant]} text-white shadow-lg`}
                    style={{
                        boxShadow: `0 8px 24px -4px ${variant === 'success' ? 'rgba(16, 185, 129, 0.3)' :
                            variant === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
                                variant === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(30, 90, 235, 0.3)'}`
                    }}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

// Quick Action Button
interface QuickActionProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    description?: string;
}

function QuickAction({ href, icon, label, description }: QuickActionProps) {
    return (
        <Link href={href} className="block">
            <motion.div
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="card p-4 flex items-center gap-4 group transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800"
            >
                <div className="p-3 rounded-xl text-white transition-all duration-300 group-hover:scale-110"
                    style={{
                        background: 'linear-gradient(135deg, #1e5aeb 0%, #0ea5e9 100%)',
                        boxShadow: '0 8px 24px -4px rgba(30, 90, 235, 0.3)'
                    }}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{label}</p>
                    {description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{description}</p>
                    )}
                </div>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
            </motion.div>
        </Link>
    );
}

export default function Dashboard() {
    const { t, i18n } = useTranslation('common');
    const { user, getDashboardData } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getDashboardData();
            setDashboardData(data);
            setLoading(false);
        };

        if (user) {
            fetchData();
        }
    }, [user, getDashboardData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' MRU';
    };

    // Render based on role
    const renderAdminDashboard = () => (
        <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard
                    title={t('dashboard.total_liquidity')}
                    value={formatCurrency(dashboardData?.total_liquidity || 0)}
                    icon={<Wallet size={24} />}
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.open_folios')}
                    value={Number(dashboardData?.open_folios_count) || 0}
                    icon={<FolderOpen size={24} />}
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.today_receipts')}
                    value={formatCurrency(dashboardData?.today_receipts || 0)}
                    icon={<TrendingUp size={24} />}
                    variant="success"
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.today_payments')}
                    value={formatCurrency(dashboardData?.today_payments || 0)}
                    icon={<TrendingDown size={24} />}
                    variant="warning"
                    loading={loading}
                />
            </div>

            {/* Second row KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard
                    title={t('dashboard.pending_approvals')}
                    value={Number(dashboardData?.pending_approvals) || 0}
                    icon={<Clock size={24} />}
                    variant={Number(dashboardData?.pending_approvals) > 0 ? 'warning' : 'default'}
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.transactions_today')}
                    value={Number(dashboardData?.today_transactions_count) || 0}
                    icon={<FileText size={24} />}
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.security_alerts')}
                    value={Number(dashboardData?.security_alerts_24h) || 0}
                    icon={<Shield size={24} />}
                    variant={Number(dashboardData?.security_alerts_24h) > 0 ? 'danger' : 'default'}
                    loading={loading}
                />
                <KPICard
                    title={t('nav.users')}
                    value={Number(dashboardData?.users_count) || 0}
                    icon={<Users size={24} />}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {t('dashboard.quick_actions')}
                        </h3>
                        <div className="space-y-3">
                            <QuickAction
                                href="/folios"
                                icon={<Plus size={20} />}
                                label={t('folio.create')}
                            />
                            <QuickAction
                                href="/transactions"
                                icon={<FileText size={20} />}
                                label={t('transaction.create')}
                            />
                            <QuickAction
                                href="/reports"
                                icon={<FileText size={20} />}
                                label={t('reports.title')}
                            />
                            <QuickAction
                                href="/admin/users"
                                icon={<Users size={20} />}
                                label={t('users.title')}
                            />
                        </div>
                    </div>
                </div>

                {/* Pending Settlements */}
                <div className="lg:col-span-2">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('dashboard.pending_settlements')}
                            </h3>
                            <Link href="/settlements" className="text-sm text-blue-600 hover:text-blue-700">
                                {t('common.view')} →
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="skeleton h-16 rounded-xl" />
                                ))}
                            </div>
                        ) : (dashboardData?.pending_settlements?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                {dashboardData?.pending_settlements?.slice(0, 5).map((settlement: Settlement) => (
                                    <div
                                        key={settlement.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {settlement.party_name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {settlement.created_by_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(parseFloat(settlement.amount))}
                                            </p>
                                            <span className="badge badge-warning">
                                                {t(`settlement.status_${settlement.status}`)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state py-8">
                                <CheckCircle className="empty-state-icon text-emerald-500" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('common.no_data')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Cash Flow Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('dashboard.cash_flow_chart')}
                    </h3>
                    <LineChartComponent
                        data={dashboardData?.cash_flow_data || []}
                        lines={[
                            { dataKey: 'receipts', name: t('dashboard.receipts_label'), color: '#10b981' },
                            { dataKey: 'payments', name: t('dashboard.payments_label'), color: '#f59e0b' },
                        ]}
                        height={280}
                    />
                </div>

                {/* Payment Methods Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('dashboard.payment_methods_chart')}
                    </h3>
                    <PieChartComponent
                        data={dashboardData?.payment_methods_data || []}
                        height={280}
                        innerRadius={50}
                    />
                </div>
            </div>
        </>
    );


    const renderGerantDashboard = () => (
        <>
            {/* Branch indicator */}
            {typeof dashboardData?.branch_name === 'string' && dashboardData.branch_name && (
                <div className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400">
                    <Building2 size={20} />
                    <span className="font-medium">{dashboardData.branch_name}</span>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard
                    title={t('dashboard.total_liquidity')}
                    value={formatCurrency(dashboardData?.total_liquidity || 0)}
                    icon={<Wallet size={24} />}
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.open_folios')}
                    value={dashboardData?.open_folios_count || 0}
                    icon={<FolderOpen size={24} />}
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.pending_approvals')}
                    value={dashboardData?.pending_approvals || 0}
                    icon={<Clock size={24} />}
                    variant={dashboardData?.pending_approvals ? 'warning' : 'default'}
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.pending_closures')}
                    value={dashboardData?.pending_closure_requests || 0}
                    icon={<AlertTriangle size={24} />}
                    variant={dashboardData?.pending_closure_requests ? 'danger' : 'default'}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <KPICard
                    title={t('dashboard.today_receipts')}
                    value={formatCurrency(dashboardData?.today_receipts || 0)}
                    icon={<TrendingUp size={24} />}
                    variant="success"
                    loading={loading}
                />
                <KPICard
                    title={t('dashboard.today_payments')}
                    value={formatCurrency(dashboardData?.today_payments || 0)}
                    icon={<TrendingDown size={24} />}
                    variant="warning"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('dashboard.quick_actions')}
                    </h3>
                    <div className="space-y-3">
                        <QuickAction
                            href="/folios?status=CLOSURE_PROPOSED"
                            icon={<Clock size={20} />}
                            label={t('dashboard.closures_to_approve')}
                        />
                        <QuickAction
                            href="/settlements?status=PROPOSED"
                            icon={<FileText size={20} />}
                            label={t('dashboard.settlements_to_approve')}
                        />
                        <QuickAction
                            href="/reports"
                            icon={<FileText size={20} />}
                            label={t('reports.title')}
                        />
                    </div>
                </div>

                {/* Caissier Performance */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('dashboard.cashiers_performance')}
                    </h3>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton h-12 rounded-xl" />
                            ))}
                        </div>
                    ) : (dashboardData?.caissiers_performance?.length ?? 0) > 0 ? (
                        <div className="space-y-3">
                            {dashboardData?.caissiers_performance?.slice(0, 5).map((perf, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="avatar avatar-sm">
                                            {(perf.created_by__first_name || perf.created_by__username)?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {perf.created_by__first_name || perf.created_by__username}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {perf.count} tx
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatCurrency(perf.total || 0)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            {t('common.no_data')}
                        </p>
                    )}
                </div>
            </div>
        </>
    );

    const renderCaissierDashboard = () => {
        const currentFolio = dashboardData?.current_folio as Folio | null;

        return (
            <>
                {/* Current Folio Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 mb-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <p className="text-blue-200 text-sm mb-1">{t('dashboard.current_folio')}</p>
                            <h2 className="text-3xl font-bold mb-2">
                                {currentFolio?.code || t('dashboard.no_open_folio')}
                            </h2>
                            {currentFolio && (
                                <p className="text-blue-200">
                                    {t('dashboard.opened_on')} {new Date(currentFolio.opened_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR')}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="text-center bg-white/10 rounded-xl px-6 py-4">
                                <p className="text-blue-200 text-sm">{t('dashboard.opening_balance')}</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(dashboardData?.opening_balance || 0)}
                                </p>
                            </div>
                            <div className="text-center bg-white/20 rounded-xl px-6 py-4">
                                <p className="text-blue-200 text-sm">{t('dashboard.current_balance')}</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(dashboardData?.running_balance || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <KPICard
                        title={t('dashboard.transactions_today')}
                        value={dashboardData?.today_transactions_count || 0}
                        icon={<FileText size={24} />}
                        loading={loading}
                    />
                    <KPICard
                        title={t('dashboard.last_receipt')}
                        value={dashboardData?.last_receipt_number || '-'}
                        icon={<FileText size={24} />}
                        loading={loading}
                    />
                    <KPICard
                        title={t('dashboard.folio_status')}
                        value={currentFolio ? t(`folio.status_${currentFolio.status}`) : '-'}
                        icon={<FolderOpen size={24} />}
                        variant={currentFolio?.status === 'OPEN' ? 'success' : 'default'}
                        loading={loading}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {t('dashboard.quick_actions')}
                        </h3>
                        <div className="space-y-3">
                            {currentFolio?.status === 'OPEN' ? (
                                <>
                                    <Link
                                        href={`/transactions/new?type=RECEIPT&folio=${currentFolio.id}`}
                                        className="btn-success w-full flex items-center justify-center gap-2"
                                    >
                                        <TrendingUp size={18} />
                                        {t('transaction.type_RECEIPT')}
                                    </Link>
                                    <Link
                                        href={`/transactions/new?type=PAYMENT&folio=${currentFolio.id}`}
                                        className="btn-danger w-full flex items-center justify-center gap-2"
                                    >
                                        <TrendingDown size={18} />
                                        {t('transaction.type_PAYMENT')}
                                    </Link>
                                    <Link
                                        href={`/folios/${currentFolio.id}`}
                                        className="btn-secondary w-full flex items-center justify-center gap-2"
                                    >
                                        <Clock size={18} />
                                        {t('folio.propose_closure')}
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href="/folios"
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    {t('folio.create')}
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="lg:col-span-2 card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('dashboard.recent_activity')}
                            </h3>
                            <Link href="/transactions" className="text-sm text-blue-600 hover:text-blue-700">
                                {t('common.view')} →
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="skeleton h-14 rounded-xl" />
                                ))}
                            </div>
                        ) : (dashboardData?.recent_transactions?.length ?? 0) > 0 ? (
                            <div className="space-y-3">
                                {dashboardData?.recent_transactions?.slice(0, 5).map((tx: Transaction) => (
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
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {tx.reference || tx.description || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`font-semibold ${tx.type === 'RECEIPT' ? 'text-emerald-600' : 'text-red-600'
                                            }`}>
                                            {tx.type === 'RECEIPT' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state py-8">
                                <FileText className="empty-state-icon" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('common.no_data')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('dashboard.welcome', { name: user?.first_name || user?.username })}
                    </p>
                </div>
            </div>

            {/* Role-based content */}
            {user?.role === 'ADMIN' && renderAdminDashboard()}
            {user?.role === 'GERANT' && renderGerantDashboard()}
            {user?.role === 'CAISSIER' && renderCaissierDashboard()}
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
