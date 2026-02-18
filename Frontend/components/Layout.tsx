import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import {
    LayoutDashboard, FolderOpen, ArrowLeftRight, FileCheck,
    Receipt, BarChart3, Users, Settings, Shield,
    Menu, X, Bell, Sun, Moon, LogOut, ChevronDown,
    Globe, User, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
    children: ReactNode;
}

interface NavItem {
    href: string;
    icon: React.ReactNode;
    label: string;
    roles?: string[];
}

export default function Layout({ children }: LayoutProps) {
    const { t, i18n } = useTranslation('common');
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    // Load dark mode preference
    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    // Handle dark mode toggle
    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', String(newDarkMode));
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Handle language change
    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        setLanguageMenuOpen(false);
    };

    // RTL support
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    }, [i18n.language]);

    // Navigation items based on role
    const navItems: NavItem[] = [
        { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: t('nav.dashboard') },
        { href: '/folios', icon: <FolderOpen size={20} />, label: t('nav.folios'), roles: ['ADMIN', 'GERANT', 'CAISSIER'] },
        { href: '/transactions', icon: <ArrowLeftRight size={20} />, label: t('nav.transactions'), roles: ['ADMIN', 'GERANT', 'CAISSIER'] },
        { href: '/settlements', icon: <FileCheck size={20} />, label: t('nav.settlements') },
        { href: '/invoices', icon: <Receipt size={20} />, label: t('nav.invoices') },
        { href: '/reports', icon: <BarChart3 size={20} />, label: t('nav.reports'), roles: ['ADMIN', 'GERANT', 'CAISSIER'] },
        { href: '/admin/users', icon: <Users size={20} />, label: t('nav.users'), roles: ['ADMIN'] },
        { href: '/admin/branches', icon: <Building2 size={20} />, label: t('nav.branches'), roles: ['ADMIN'] },
        { href: '/admin/settings', icon: <Settings size={20} />, label: t('nav.settings'), roles: ['ADMIN'] },

        { href: '/audit', icon: <Shield size={20} />, label: t('nav.audit'), roles: ['ADMIN', 'GERANT'] },
    ];

    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return user && item.roles.includes(user.role);
    });

    const isActivePath = (path: string) => router.pathname === path || router.pathname.startsWith(`${path}/`);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    // Don't show layout for public pages
    if (!isAuthenticated || router.pathname === '/login' || router.pathname === '/') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Sidebar */}
            <aside
                className={`sidebar ${sidebarOpen ? 'w-64' : 'w-20'} ${mobileMenuOpen ? 'open' : ''}`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <Image
                            src="/Nexasoft.png"
                            alt="NexaSolft"
                            width={40}
                            height={40}
                            className="rounded-lg"
                        />
                        {sidebarOpen && (
                            <span className="font-bold text-lg text-gray-900 dark:text-white">
                                NexaSolft
                            </span>
                        )}
                    </Link>

                    {/* Mobile close button */}
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden btn-icon"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User info */}
                {sidebarOpen && user && (
                    <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="avatar">
                                {user.first_name?.[0] || user.username[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {user.first_name} {user.last_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t(`roles.${user.role}`)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-2 overflow-y-auto">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActivePath(item.href) ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {item.icon}
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-800">
                    {sidebarOpen && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <p className="font-semibold">NexaSolft</p>
                            <a
                                href="https://www.nexasoft.mr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block hover:text-blue-600"
                            >
                                www.nexasoft.mr
                            </a>
                            <a
                                href="mailto:info@nexasoft.mr"
                                className="block hover:text-blue-600"
                            >
                                info@nexasoft.mr
                            </a>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800">
                    <div className="flex items-center justify-between px-4 h-16">
                        {/* Left side */}
                        <div className="flex items-center gap-4">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden btn-icon"
                            >
                                <Menu size={20} />
                            </button>

                            {/* Sidebar toggle (desktop) */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="hidden lg:flex btn-icon"
                            >
                                <Menu size={20} />
                            </button>

                            {/* Branch indicator */}
                            {user?.branch_name && (
                                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Building2 size={16} />
                                    <span>{user.branch_name}</span>
                                </div>
                            )}
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            {/* Language Switcher */}
                            <div className="relative">
                                <button
                                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                                    className="btn-icon flex items-center gap-1"
                                >
                                    <Globe size={18} />
                                    <span className="hidden sm:inline text-sm uppercase">{i18n.language}</span>
                                </button>

                                {languageMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setLanguageMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
                                            <button
                                                onClick={() => changeLanguage('fr')}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors ${i18n.language === 'fr' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover">
                                                    <path fill="#fff" d="M0 0h640v480H0z" />
                                                    <path fill="#002654" d="M0 0h213.3v480H0z" />
                                                    <path fill="#ce1126" d="M426.7 0h213.3v480H426.7z" />
                                                </svg>
                                                <span>Français</span>
                                            </button>
                                            <button
                                                onClick={() => changeLanguage('ar')}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors ${i18n.language === 'ar' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover">
                                                    <path fill="#006233" d="M0 0h640v480H0z" />
                                                    <path fill="#ffc400" d="M320 102.9L350.2 186l88.4-5.3-67 55.4 20.8 85.8-72.4-46.7-72.4 46.7 20.8-85.8-67-55.4 88.4 5.3z" />
                                                    <path fill="#d21034" d="M0 0h640v48H0zm0 432h640v48H0z" />
                                                </svg>
                                                <span>العربية</span>
                                            </button>
                                            <button
                                                onClick={() => changeLanguage('en')}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors ${i18n.language === 'en' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover">
                                                    <path fill="#012169" d="M0 0h640v480H0z" />
                                                    <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" />
                                                    <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 5L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" />
                                                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
                                                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
                                                </svg>
                                                <span>English</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Dark Mode Toggle */}
                            <button onClick={toggleDarkMode} className="btn-icon">
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {/* Notifications */}
                            <button className="btn-icon relative">
                                <Bell size={18} />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </span>
                                )}
                            </button>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="avatar avatar-sm">
                                        {user?.first_name?.[0] || user?.username[0]?.toUpperCase()}
                                    </div>
                                    <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
                                            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {user?.first_name} {user?.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {user?.email}
                                                </p>
                                            </div>
                                            <div className="p-2">
                                                <Link
                                                    href="/profile"
                                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <User size={16} />
                                                    Profil
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <LogOut size={16} />
                                                    {t('auth.logout')}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    <div className="page-enter">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <p>© {new Date().getFullYear()} NexaSolft. {t('footer.rights')}.</p>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://web.facebook.com/nexasoft.mr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 transition-colors"
                            >
                                Facebook
                            </a>
                            <a
                                href="https://wa.me/22227736247"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-green-600 transition-colors"
                            >
                                WhatsApp
                            </a>
                            <a
                                href="https://www.nexasoft.mr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600 transition-colors"
                            >
                                Website
                            </a>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
