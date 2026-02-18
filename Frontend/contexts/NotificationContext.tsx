import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Types
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook
export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

// Icons and colors for each type
const typeConfig = {
    success: {
        icon: CheckCircle,
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        iconColor: 'text-emerald-500',
        progressColor: 'bg-emerald-500',
    },
    error: {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-500',
        progressColor: 'bg-red-500',
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-amber-50 dark:bg-amber-900/30',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconColor: 'text-amber-500',
        progressColor: 'bg-amber-500',
    },
    info: {
        icon: Info,
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-500',
        progressColor: 'bg-blue-500',
    },
};

// Toast Component
function Toast({ notification, onRemove }: { notification: Notification; onRemove: () => void }) {
    const config = typeConfig[notification.type];
    const Icon = config.icon;
    const duration = notification.duration || 5000;

    React.useEffect(() => {
        const timer = setTimeout(onRemove, duration);
        return () => clearTimeout(timer);
    }, [duration, onRemove]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`
        relative overflow-hidden rounded-xl border shadow-lg
        ${config.bgColor} ${config.borderColor}
        min-w-[320px] max-w-[420px]
      `}
        >
            <div className="flex items-start gap-3 p-4">
                <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={20} />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                        {notification.title}
                    </p>
                    {notification.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            {notification.message}
                        </p>
                    )}
                </div>
                <button
                    onClick={onRemove}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <X size={16} className="text-gray-400" />
                </button>
            </div>

            {/* Progress bar */}
            <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-1 ${config.progressColor}`}
            />
        </motion.div>
    );
}

// Provider Component
export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setNotifications((prev) => [...prev, { ...notification, id }]);
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addNotification({ type: 'success', title, message });
    }, [addNotification]);

    const error = useCallback((title: string, message?: string) => {
        addNotification({ type: 'error', title, message, duration: 8000 });
    }, [addNotification]);

    const warning = useCallback((title: string, message?: string) => {
        addNotification({ type: 'warning', title, message, duration: 6000 });
    }, [addNotification]);

    const info = useCallback((title: string, message?: string) => {
        addNotification({ type: 'info', title, message });
    }, [addNotification]);

    return (
        <NotificationContext.Provider
            value={{ notifications, addNotification, removeNotification, success, error, warning, info }}
        >
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                        <Toast
                            key={notification.id}
                            notification={notification}
                            onRemove={() => removeNotification(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
}

export default NotificationContext;
