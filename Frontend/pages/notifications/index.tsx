import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { notificationApi, NotificationData } from '../../services/api';
import { Bell, CheckCircle, Info, AlertTriangle, Clock } from 'lucide-react';

export default function NotificationsPage() {
    const { t } = useTranslation('common');
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const renderNotificationTitle = (title: string) => {
        if (title && title.startsWith('NOTIF_')) {
            return t(`notifications.${title}`);
        }
        return title;
    };

    const renderNotificationMessage = (msg: string, data?: Record<string, any>): string => {
        if (msg && msg.startsWith('NOTIF_')) {
            return t(`notifications.${msg}`, data || {}) as string;
        }
        return msg;
    };

    const loadNotifications = async () => {
        try {
            const list = await notificationApi.list();
            const countRes = await notificationApi.getUnreadCount();
            setNotifications(list);
            setUnreadCount(countRes.count);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationApi.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    return (
        <>
            <Head>
                <title>{t('notifications.title')} - NexaSolft</title>
            </Head>

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Bell className="text-blue-500" />
                            {t('notifications.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {unreadCount} {unreadCount > 1 ? t('notifications.new_plural') : t('notifications.new_singular')}
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            {t('notifications.mark_all_read')}
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="animate-pulse flex gap-4">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
                                <Bell className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {t('notifications.no_notifications')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {t('notifications.up_to_date')}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                    className={`p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700/50 flex gap-4 transition-colors ${!notif.is_read
                                        ? 'bg-blue-50/50 dark:bg-slate-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700/80 relative'
                                        : 'bg-white dark:bg-slate-800/60 opacity-80'
                                        }`}
                                >
                                    {!notif.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                    )}

                                    <div className={`mt-1 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 ${notif.notification_type === 'FOLIO_CLOSURE' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                                        notif.notification_type === 'SECURITY_ALERT' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                        }`}>
                                        {notif.notification_type === 'FOLIO_CLOSURE' || notif.notification_type === 'SECURITY_ALERT' ? (
                                            <AlertTriangle size={20} />
                                        ) : notif.notification_type === 'SETTLEMENT_APPROVAL' ? (
                                            <CheckCircle size={20} />
                                        ) : (
                                            <Info size={20} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 gap-2">
                                            <h3 className={`text-base font-semibold ${!notif.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {renderNotificationTitle(notif.title)}
                                            </h3>
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-600 w-fit">
                                                <Clock size={12} />
                                                {new Date(notif.created_at).toLocaleDateString()} à {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                                            {renderNotificationMessage(notif.message, notif.action_data)}
                                        </p>
                                    </div>

                                    {!notif.is_read && (
                                        <div className="flex items-center ml-2">
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export async function getStaticProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}
