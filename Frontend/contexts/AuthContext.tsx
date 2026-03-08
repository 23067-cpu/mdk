import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authApi, User, dashboardApi, DashboardData } from '../services/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasRole: (roles: string | string[]) => boolean;
    canAccess: (requiredRoles: string[]) => boolean;
    getDashboardData: () => Promise<DashboardData | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<string, number> = {
    'ADMIN': 5,
    'GERANT': 4,
    'CAISSIER': 3
};

// Routes accessible by each role
const ROLE_ROUTES: Record<string, string[]> = {
    'ADMIN': ['/dashboard', '/folios', '/transactions', '/settlements', '/invoices', '/reports', '/admin', '/admin/users', '/admin/settings', '/audit'],
    'GERANT': ['/dashboard', '/folios', '/transactions', '/settlements', '/invoices', '/reports', '/audit'],
    'CAISSIER': ['/dashboard', '/folios', '/transactions', '/settlements'],
    'SAISIE_FACTURE': ['/dashboard', '/invoices'],
};

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    // Verify token is still valid
                    const response = await authApi.getCurrentUser();
                    if (response.success && response.user) {
                        setUser(response.user);
                        localStorage.setItem('user', JSON.stringify(response.user));
                        // Apply the user's preferred language if it differs from current
                        const prefLang = response.user.preferred_language || 'fr';
                        if (router.locale !== prefLang && router.pathname !== '/' && router.pathname !== '/login') {
                            document.documentElement.dir = prefLang === 'ar' ? 'rtl' : 'ltr';
                            router.replace(router.pathname, router.asPath, { locale: prefLang });
                        }
                    } else {
                        // Token invalid, clear storage
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                } catch (error) {
                    // Token invalid
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Redirect unauthenticated users
    useEffect(() => {
        if (!isLoading && !user) {
            const publicRoutes = ['/', '/login'];
            if (!publicRoutes.includes(router.pathname)) {
                router.push('/login');
            }
        }
    }, [user, isLoading, router]);

    const login = useCallback(async (username: string, password: string) => {
        try {
            const response = await authApi.login(username, password);

            if (response.success && response.token && response.user) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);

                // Apply the user's saved language preference
                const prefLang = response.user.preferred_language || 'fr';
                document.documentElement.dir = prefLang === 'ar' ? 'rtl' : 'ltr';

                // Redirect to dashboard with the correct locale
                router.push('/dashboard', '/dashboard', { locale: prefLang });

                return { success: true };
            } else {
                return { success: false, message: response.message || 'Identifiants invalides' };
            }
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : 'Erreur de connexion' };
        }
    }, [router]);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch (error) {
            // Ignore logout errors
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            router.push('/login');
        }
    }, [router]);

    const refreshUser = useCallback(async () => {
        try {
            const response = await authApi.getCurrentUser();
            if (response.success && response.user) {
                setUser(response.user);
                localStorage.setItem('user', JSON.stringify(response.user));
            }
        } catch (error) {
            // Handle error silently
        }
    }, []);

    const hasRole = useCallback((roles: string | string[]) => {
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    }, [user]);

    const canAccess = useCallback((requiredRoles: string[]) => {
        if (!user) return false;

        // Admin can access everything
        if (user.role === 'ADMIN') return true;

        // Check if user's role is in the required roles
        return requiredRoles.includes(user.role);
    }, [user]);

    const getDashboardData = useCallback(async (): Promise<DashboardData | null> => {
        if (!user) return null;

        try {
            switch (user.role) {
                case 'ADMIN':
                    return await dashboardApi.getAdminDashboard();
                case 'GERANT':
                    return await dashboardApi.getGerantDashboard();
                case 'CAISSIER':
                    return await dashboardApi.getCaissierDashboard();
                default:
                    return null;
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            return null;
        }
    }, [user]);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        hasRole,
        canAccess,
        getDashboardData,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    allowedRoles?: string[]
) {
    return function ProtectedRoute(props: P) {
        const { user, isLoading, canAccess } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isLoading) {
                if (!user) {
                    router.push('/login');
                } else if (allowedRoles && !canAccess(allowedRoles)) {
                    router.push('/dashboard');
                }
            }
        }, [user, isLoading, router, canAccess]);

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                    <div className="flex flex-col items-center gap-4">
                        <div className="spinner w-8 h-8 border-blue-500"></div>
                        <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
                    </div>
                </div>
            );
        }

        if (!user) {
            return null;
        }

        if (allowedRoles && !canAccess(allowedRoles)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès refusé</h1>
                        <p className="text-gray-600 dark:text-gray-400">Vous n&apos;avez pas les permissions nécessaires.</p>
                    </div>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}

// Role display names
export const ROLE_LABELS: Record<string, Record<string, string>> = {
    fr: {
        'ADMIN': 'Administrateur',
        'GERANT': 'Gérant',
        'CAISSIER': 'Caissier',
    },
    ar: {
        'ADMIN': 'مدير النظام',
        'GERANT': 'المدير',
        'CAISSIER': 'أمين الصندوق',
    },
    en: {
        'ADMIN': 'Administrator',
        'GERANT': 'Manager',
        'CAISSIER': 'Cashier',
    },
};
