import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
    Shield, TrendingUp, Users, FileText, BarChart3,
    Globe, Lock, Smartphone, ArrowRight,
    Facebook, Mail, MessageCircle, ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const features = [
    {
        icon: Shield,
        title: { fr: 'Sécurité Avancée', ar: 'أمان متقدم', en: 'Advanced Security' },
        desc: { fr: 'Contrôle d\'accès basé sur les rôles', ar: 'تحكم بالوصول حسب الأدوار', en: 'Role-based access control' },
    },
    {
        icon: TrendingUp,
        title: { fr: 'Suivi en Temps Réel', ar: 'تتبع فوري', en: 'Real-time Tracking' },
        desc: { fr: 'Surveillance des flux de trésorerie', ar: 'مراقبة التدفقات النقدية', en: 'Cash flow monitoring' },
    },
    {
        icon: Users,
        title: { fr: 'Multi-utilisateurs', ar: 'متعدد المستخدمين', en: 'Multi-user' },
        desc: { fr: '5 rôles avec permissions distinctes', ar: '5 أدوار بصلاحيات مختلفة', en: '5 roles with distinct permissions' },
    },
    {
        icon: FileText,
        title: { fr: 'Rapports Détaillés', ar: 'تقارير مفصلة', en: 'Detailed Reports' },
        desc: { fr: 'Export PDF, Excel, CSV', ar: 'تصدير PDF, Excel, CSV', en: 'Export to PDF, Excel, CSV' },
    },
    {
        icon: BarChart3,
        title: { fr: 'Tableaux de Bord', ar: 'لوحات تحكم', en: 'Dashboards' },
        desc: { fr: 'KPIs personnalisés par rôle', ar: 'مؤشرات مخصصة لكل دور', en: 'Role-specific KPIs' },
    },
    {
        icon: Globe,
        title: { fr: 'Multilingue', ar: 'متعدد اللغات', en: 'Multilingual' },
        desc: { fr: 'Français, Arabe, Anglais', ar: 'فرنسية، عربية، إنجليزية', en: 'French, Arabic, English' },
    },
];

const companyInfo = {
    facebook: 'https://web.facebook.com/nexasoft.mr',
    email: 'info@nexasoft.mr',
    whatsapp: 'https://wa.me/22227736247',
    website: 'https://www.nexasoft.mr',
};

export default function HomePage() {
    const { t, i18n } = useTranslation('common');
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const lang = (i18n.language || 'fr') as 'fr' | 'ar' | 'en';

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0f2744 50%, #0f172a 100%)' }}
        >
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Animated Grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(30, 90, 235, 0.5) 1px, transparent 1px),
                                         linear-gradient(90deg, rgba(30, 90, 235, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />

                {/* Floating Orbs */}
                <motion.div
                    animate={{
                        y: [0, -40, 0],
                        opacity: [0.15, 0.25, 0.15]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(30, 90, 235, 0.4) 0%, transparent 70%)',
                        filter: 'blur(100px)'
                    }}
                />
                <motion.div
                    animate={{
                        y: [0, 30, 0],
                        x: [0, -20, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)',
                        filter: 'blur(80px)'
                    }}
                />
                <motion.div
                    animate={{
                        y: [0, 20, 0],
                        opacity: [0.08, 0.15, 0.08]
                    }}
                    transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-2/3 left-1/3 w-[400px] h-[400px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(212, 165, 116, 0.3) 0%, transparent 70%)',
                        filter: 'blur(60px)'
                    }}
                />
            </div>

            {/* Header */}
            <header className="relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center gap-3"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-xl scale-150" />
                                <Image
                                    src="/Nexasoft.png"
                                    alt="NexaSolft"
                                    width={48}
                                    height={48}
                                    className="rounded-xl relative z-10"
                                />
                            </div>
                            <span className="text-2xl font-bold text-white">NexaSolft Treasury</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center gap-4"
                        >
                            {/* Language Switcher */}
                            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1">
                                {['fr', 'ar', 'en'].map((lng) => (
                                    <button
                                        key={lng}
                                        onClick={() => router.push(router.pathname, router.asPath, { locale: lng })}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${i18n.language === lng
                                            ? 'bg-white text-slate-900'
                                            : 'text-white/60 hover:text-white'
                                            }`}
                                    >
                                        {lng.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                                style={{
                                    background: 'linear-gradient(135deg, #1e5aeb 0%, #0ea5e9 100%)',
                                    boxShadow: '0 8px 32px -8px rgba(30, 90, 235, 0.5)'
                                }}
                            >
                                <Lock size={18} />
                                {t('auth.login')}
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                                <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                                    {lang === 'ar' ? 'نظام إدارة الخزينة المتكامل' :
                                        lang === 'en' ? 'Complete Treasury Management System' :
                                            'Système de Gestion de Trésorerie Complet'}
                                </span>
                            </h1>
                            <p className="text-xl text-blue-200/70 max-w-3xl mx-auto mb-12 leading-relaxed">
                                {lang === 'ar' ? 'إدارة احترافية للتدفقات النقدية مع تحكم دقيق بالصلاحيات وتتبع كامل للعمليات' :
                                    lang === 'en' ? 'Professional cash flow management with granular permissions and complete audit trail' :
                                        'Gestion professionnelle des flux de trésorerie avec contrôle granulaire des permissions et traçabilité complète'}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                        >
                            <Link
                                href="/login"
                                className="group flex items-center gap-2 px-8 py-4 text-white rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, #1e5aeb 0%, #0ea5e9 100%)',
                                    boxShadow: '0 12px 40px -8px rgba(30, 90, 235, 0.5)'
                                }}
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                <span className="relative z-10">{t('landing.get_started')}</span>
                                <ArrowRight size={20} className="relative z-10" />
                            </Link>
                            <a
                                href={companyInfo.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all"
                            >
                                {t('landing.learn_more')}
                                <ExternalLink size={18} />
                            </a>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-wrap items-center justify-center gap-8 sm:gap-16"
                        >
                            {[
                                { value: '5', label: lang === 'ar' ? 'أدوار' : lang === 'en' ? 'Roles' : 'Rôles' },
                                { value: '3', label: lang === 'ar' ? 'لغات' : lang === 'en' ? 'Languages' : 'Langues' },
                                { value: '∞', label: lang === 'ar' ? 'معاملات' : lang === 'en' ? 'Transactions' : 'Transactions' },
                            ].map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-4xl sm:text-5xl font-bold text-white mb-1">{stat.value}</div>
                                    <div className="text-blue-200/60 text-sm uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="relative py-24">
                <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            {lang === 'ar' ? 'مميزات النظام' :
                                lang === 'en' ? 'System Features' :
                                    'Fonctionnalités du Système'}
                        </h2>
                        <p className="text-blue-200/60 text-lg max-w-2xl mx-auto">
                            {lang === 'ar' ? 'حلول متكاملة لجميع احتياجات إدارة الخزينة' :
                                lang === 'en' ? 'Complete solutions for all treasury management needs' :
                                    'Solutions complètes pour tous vos besoins de trésorerie'}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    whileHover={{ y: -4 }}
                                    className="group relative p-6 bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
                                >
                                    {/* Gradient glow on hover */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all duration-300" />

                                    <div className="relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                                            <Icon className="text-blue-300 group-hover:text-blue-200 transition-colors" size={24} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{feature.title[lang]}</h3>
                                        <p className="text-blue-200/60 text-sm">{feature.desc[lang]}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Contact Footer */}
            <footer className="relative py-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        {/* Logo and Copyright */}
                        <div className="flex items-center gap-4">
                            <Image
                                src="/Nexasoft.png"
                                alt="NexaSolft"
                                width={40}
                                height={40}
                                className="rounded-lg"
                            />
                            <div>
                                <p className="text-white font-semibold">NexaSolft</p>
                                <p className="text-blue-200/50 text-sm">© {new Date().getFullYear()} All rights reserved</p>
                            </div>
                        </div>

                        {/* Contact Links */}
                        <div className="flex items-center gap-6">
                            {[
                                { href: companyInfo.facebook, icon: Facebook, label: 'Facebook' },
                                { href: `mailto:${companyInfo.email}`, icon: Mail, label: companyInfo.email },
                                { href: companyInfo.whatsapp, icon: MessageCircle, label: 'WhatsApp' },
                                { href: companyInfo.website, icon: Globe, label: 'Website' },
                            ].map((item, index) => (
                                <a
                                    key={index}
                                    href={item.href}
                                    target={item.href.startsWith('mailto') ? undefined : '_blank'}
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-200/50 hover:text-white transition-colors duration-300"
                                >
                                    <item.icon size={20} />
                                    <span className="hidden sm:inline text-sm">{item.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
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
