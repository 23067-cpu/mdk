import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import {
    Shield, TrendingUp, Users, FileText, BarChart3,
    Globe, Lock, ArrowRight,
    Facebook, Mail, MessageCircle, ExternalLink, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { settingsApi } from '../services/api';

const features = [
    {
        icon: Shield,
        title: { fr: 'Sécurité Bancaire', ar: 'أمان بنكي', en: 'Bank-grade Security' },
        desc: { fr: 'Chiffrement de bout en bout et gestion granulaire des accès.', ar: 'تشفير شامل وإدارة دقيقة للوصول.', en: 'End-to-end encryption and granular access control.' },
    },
    {
        icon: TrendingUp,
        title: { fr: 'Visibilité Temps Réel', ar: 'رؤية فورية', en: 'Real-time Visibility' },
        desc: { fr: 'Suivez vos flux de trésorerie avec une précision chirurgicale.', ar: 'تتبع تدفقاتك النقدية بدقة جراحية.', en: 'Track cash flows with surgical precision.' },
    },
    {
        icon: Users,
        title: { fr: 'Collaboration Multi-rôles', ar: 'تعاون متعدد الأدوار', en: 'Multi-role Collaboration' },
        desc: { fr: 'Des workflows adaptés pour Administrateurs, Gérants et Caissiers.', ar: 'مسارات عمل مخصصة للمديرين والمحاسبين والصرافين.', en: 'Tailored workflows for Admins, Managers, and Cashiers.' },
    },
    {
        icon: FileText,
        title: { fr: 'Traçabilité Absolue', ar: 'تتبع مطلق', en: 'Absolute Traceability' },
        desc: { fr: 'Chaque action est enregistrée et auditable en un clic.', ar: 'يتم تسجيل كل إجراء ويمكن التدقيق فيه بنقرة واحدة.', en: 'Every action is logged and auditable in one click.' },
    },
    {
        icon: BarChart3,
        title: { fr: 'Analyses Intelligentes', ar: 'تحليلات ذكية', en: 'Smart Analytics' },
        desc: { fr: 'Tableaux de bord dynamiques pour des décisions éclairées.', ar: 'لوحات تحكم ديناميكية لقرارات مستنيرة.', en: 'Dynamic dashboards for informed decision-making.' },
    },
    {
        icon: Globe,
        title: { fr: 'Déploiement Global', ar: 'نشر عالمي', en: 'Global Deployment' },
        desc: { fr: 'Interface 100% multilingue et support multi-devises intégré.', ar: 'واجهة متعددة اللغات 100٪ ودعم مدمج للعملات المتعددة.', en: '100% multilingual interface and built-in multi-currency support.' },
    },
];

export default function HomePage() {
    const { t, i18n } = useTranslation('common');
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const lang = (i18n.language || 'fr') as 'fr' | 'ar' | 'en';
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -200]);

    const [companyInfo, setCompanyInfo] = useState({
        name: 'NexaSolft',
        logo: '/Nexasoft.png',
        website: 'https://www.nexasoft.mr',
        facebook: 'https://web.facebook.com/nexasoft.mr',
        email: 'info@nexasoft.mr',
        whatsapp: 'https://wa.me/22227736247'
    });

    useEffect(() => {
        settingsApi.getPublic().then(data => {
            if (data?.company) {
                setCompanyInfo(prev => ({
                    ...prev,
                    ...data.company
                }));
            }
        }).catch(e => console.error('Failed to load public settings', e));
    }, []);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C]">
                <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen relative overflow-x-hidden bg-[#0A0F1C] font-sans selection:bg-blue-500/30 text-white"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen" />
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                />
            </div>

            {/* Navigation Header */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.05] bg-[#0A0F1C]/70 backdrop-blur-xl transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <img src={companyInfo.logo} alt="Logo" className="w-10 h-10 object-contain rounded-xl bg-white/5 p-1.5 border border-white/10" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            {companyInfo.name} Treasury
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 sm:gap-6"
                    >
                        <div className="hidden sm:flex items-center gap-1 bg-white/[0.03] border border-white/[0.05] rounded-xl p-1">
                            {[
                                { code: 'fr', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover"><path fill="#fff" d="M0 0h640v480H0z" /><path fill="#002654" d="M0 0h213.3v480H0z" /><path fill="#ce1126" d="M426.7 0h213.3v480H426.7z" /></svg> },
                                { code: 'ar', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover"><path fill="#006233" d="M0 0h640v480H0z" /><path fill="#ffc400" d="M320 102.9L350.2 186l88.4-5.3-67 55.4 20.8 85.8-72.4-46.7-72.4 46.7 20.8-85.8-67-55.4 88.4 5.3z" /><path fill="#d21034" d="M0 0h640v48H0zm0 432h640v48H0z" /></svg> },
                                { code: 'en', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover"><path fill="#012169" d="M0 0h640v480H0z" /><path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" /><path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 5L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" /><path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" /><path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" /></svg> }
                            ].map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => router.push(router.pathname, router.asPath, { locale: l.code })}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${i18n.language === l.code ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/80'
                                        }`}
                                >
                                    <span>{l.icon}</span>
                                    <span className="hidden md:inline">{l.code.toUpperCase()}</span>
                                </button>
                            ))}
                        </div>

                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300"
                        >
                            <Lock size={16} className="text-blue-400" />
                            {t('auth.login')}
                        </Link>
                    </motion.div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 lg:pt-52 lg:pb-32 z-10 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-semibold tracking-wide"
                    >
                        {t('landing.badge')}
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight leading-[1.1] max-w-5xl mx-auto"
                    >
                        {t('landing.hero_title_1')}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
                            {t('landing.hero_title_highlight')}
                        </span>{' '}
                        {t('landing.hero_title_2')}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        {t('landing.hero_desc')}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-5"
                    >
                        <Link
                            href="/login"
                            className="group relative flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-white overflow-hidden w-full sm:w-auto shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 group-hover:scale-105" />
                            <div className="absolute top-0 inset-x-0 h-px bg-white/40" />
                            <span className="relative z-10">{t('landing.get_started')}</span>
                            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <a
                            href={companyInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-white bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] transition-all w-full sm:w-auto"
                        >
                            <span>{t('landing.discover')} {companyInfo.name}</span>
                            <ExternalLink size={18} className="text-white/50" />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Stats Separator */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 mb-32">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                    {[
                        { v: 'Multi', l: t('landing.stat_roles') },
                        { v: '100%', l: t('landing.stat_trace') },
                        { v: 'Temps réel', l: t('landing.stat_analytics') },
                        { v: '256-bit', l: t('landing.stat_crypto') }
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-2">{stat.v}</div>
                            <div className="text-sm font-medium text-white/40 uppercase tracking-widest">{stat.l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">{t('landing.architecture_title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{t('landing.architecture_highlight')}</span></h2>
                        <p className="text-lg text-white/50 max-w-2xl mx-auto">{t('landing.architecture_desc')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-500 overflow-hidden text-left rtl:text-right"
                                >
                                    <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl shadow-black/20 group-hover:scale-110 transition-transform duration-500">
                                            <Icon className="text-blue-400" size={26} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{feature.title[lang]}</h3>
                                        <p className="text-white/50 leading-relaxed text-sm">{feature.desc[lang]}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="relative p-12 lg:p-20 rounded-[3rem] bg-gradient-to-b from-blue-900/40 to-cyan-900/10 border border-blue-500/20 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent opacity-50" />

                        <div className="relative z-10">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white tracking-tight">Prêt à transformer votre gestion ?</h2>
                            <p className="text-lg text-blue-200/60 mb-10 max-w-2xl mx-auto">Rejoignez l'écosystème NexaSolft et dotez votre organisation des meilleurs outils financiers de leur catégorie.</p>

                            <Link
                                href="/login"
                                className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-slate-900 bg-white hover:bg-gray-100 transition-colors shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)]"
                            >
                                <span>{t('landing.get_started')}</span>
                                <ChevronRight size={20} className="text-slate-500" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/[0.05] bg-[#0A0F1C] pt-16 pb-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <div className="flex items-center gap-4">
                            <img src={companyInfo.logo} alt="NexaSolft" className="w-12 h-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all rounded-xl border border-white/5 bg-white/5 p-1" />
                            <span className="text-xl font-bold text-white/50">{companyInfo.name}</span>
                        </div>

                        <div className="flex flex-wrapjustify-center gap-8">
                            <a href={`mailto:${companyInfo.email}`} className="text-sm font-medium text-white/40 hover:text-white transition-colors flex items-center gap-2">
                                <Mail size={16} /> Contact
                            </a>
                            <a href={companyInfo.facebook} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/40 hover:text-white transition-colors flex items-center gap-2">
                                <Facebook size={16} /> Facebook
                            </a>
                            <a href={companyInfo.whatsapp.startsWith('http') ? companyInfo.whatsapp : `https://wa.me/${companyInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/40 hover:text-white transition-colors flex items-center gap-2">
                                <MessageCircle size={16} /> WhatsApp
                            </a>
                        </div>
                    </div>

                    <div className="text-center text-xs font-medium text-white/20 pt-8 border-t border-white/[0.05]">
                        © {new Date().getFullYear()} {companyInfo.name}. {t('login.rights')}
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
