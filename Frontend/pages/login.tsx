import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle, Quote, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { settingsApi } from '../services/api';

export default function LoginPage() {
    const { t, i18n } = useTranslation('common');
    const router = useRouter();
    const { login, isLoading } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [companyInfo, setCompanyInfo] = useState({
        name: 'NexaSolft',
        logo: '/Nexasoft.png',
        email: 'info@nexasoft.mr',
        whatsapp: '+222 27 73 62 47'
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError(t('errors.required_field'));
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await login(username, password);
            if (!result.success) {
                setError(result.message || t('auth.login_error'));
            }
        } catch (err) {
            setError(t('errors.network_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const changeLanguage = (lang: string) => {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        router.push(router.pathname, router.asPath, { locale: lang });
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-[#0A0F1C] font-sans selection:bg-blue-500/30">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen" />
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                />
            </div>

            {/* Left Column: Branding Showcase */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:flex w-1/2 flex-col justify-between relative z-10 px-16 py-12 border-r border-white/[0.05] bg-white/[0.01] backdrop-blur-3xl"
            >
                <div>
                    <div className="flex items-center gap-4 mb-16">
                        <img src={companyInfo.logo} alt="Logo" className="w-12 h-12 object-contain rounded-xl bg-white/5 p-1 border border-white/10 shadow-xl shadow-blue-500/10" />
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
                            {companyInfo.name}
                        </span>
                    </div>
                </div>

                <div className="max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h1 className="text-4xl leading-tight font-semibold text-white mb-6 tracking-tight">
                            {t('login.hero_subtitle')}
                        </h1>
                        <p className="text-lg text-white/50 leading-relaxed mb-12">
                            {t('login.hero_desc')}
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {[
                            { icon: <AlertCircle className="text-blue-400" size={20} />, text: t('login.feature_1') },
                            { icon: <Lock className="text-cyan-400" size={20} />, text: t('login.feature_2') },
                            { icon: <User className="text-purple-400" size={20} />, text: t('login.feature_3') }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (idx * 0.1), duration: 0.5 }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors"
                            >
                                <div className="p-3 bg-white/[0.05] rounded-xl border border-white/[0.05]">
                                    {feature.icon}
                                </div>
                                <span className="text-white/80 text-sm font-medium">{feature.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="text-sm text-white/30 font-medium">
                    © {new Date().getFullYear()} NexaSolft. {t('login.rights')}
                </div>
            </motion.div>

            {/* Right Column: Login Form */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="w-full lg:w-1/2 flex flex-col relative z-20"
            >
                {/* Top Actions: Language Switcher and Back Button */}
                <div className="absolute top-6 right-8 lg:right-12 z-30 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white transition-all backdrop-blur-md"
                        title={t('login.back_to_home') || "Retour à l'accueil"}
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] p-1.5 rounded-2xl backdrop-blur-md">
                        {[
                            { code: 'fr', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover"><path fill="#fff" d="M0 0h640v480H0z" /><path fill="#002654" d="M0 0h213.3v480H0z" /><path fill="#ce1126" d="M426.7 0h213.3v480H426.7z" /></svg> },
                            { code: 'ar', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover"><path fill="#006233" d="M0 0h640v480H0z" /><path fill="#ffc400" d="M320 102.9L350.2 186l88.4-5.3-67 55.4 20.8 85.8-72.4-46.7-72.4 46.7 20.8-85.8-67-55.4 88.4 5.3z" /><path fill="#d21034" d="M0 0h640v48H0zm0 432h640v48H0z" /></svg> },
                            { code: 'en', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover"><path fill="#012169" d="M0 0h640v480H0z" /><path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" /><path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 5L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" /><path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" /><path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" /></svg> }
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl text-lg transition-all duration-300 ${i18n.language === lang.code
                                    ? 'bg-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/[0.08] scale-105'
                                    : 'hover:bg-white/5 opacity-50 hover:opacity-100'
                                    }`}
                                title={lang.code.toUpperCase()}
                            >
                                {lang.icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                    <div className="w-full max-w-[420px]">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-10">
                            <img src={companyInfo.logo} alt="Logo" className="w-16 h-16 object-contain rounded-2xl bg-white/5 p-2 border border-white/10 shadow-2xl shadow-blue-500/20" />
                        </div>

                        <div className="mb-10 lg:mb-12">
                            <h2 className="text-3xl font-semibold text-white mb-3 tracking-tight">
                                {t('auth.login_welcome')}
                            </h2>
                            <p className="text-white/40">
                                {t('auth.login_subtitle') || "Entrez vos identifiants pour accéder à votre espace."}
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                    className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 backdrop-blur-sm"
                                >
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium leading-relaxed">{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/60 ml-1">{t('auth.username')}</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User size={18} className="text-white/30 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white/[0.05] focus:border-blue-500/50 transition-all duration-300"
                                            placeholder={t('auth.username')}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-sm font-medium text-white/60">{t('auth.password')}</label>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-white/30 group-focus-within:text-blue-400 transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white/[0.05] focus:border-blue-500/50 transition-all duration-300"
                                            placeholder="••••••••"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/70 transition-colors outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative w-full py-4 rounded-2xl font-semibold text-white overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                style={{ boxShadow: '0 8px 32px -8px rgba(59, 130, 246, 0.5)' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300 group-hover:scale-105" />
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />
                                {isSubmitting ? (
                                    <div className="relative flex items-center justify-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>{t('auth.login_loading')}</span>
                                    </div>
                                ) : (
                                    <div className="relative flex items-center justify-center gap-2">
                                        <LogIn size={18} />
                                        <span>{t('auth.login_button')}</span>
                                    </div>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-12 pt-8 border-t border-white/[0.05] pb-8 lg:pb-0">
                            <p className="text-center text-sm font-medium text-white/30 mb-4">
                                {t('login.support_text')}
                            </p>
                            <div className="flex items-center justify-center gap-6">
                                <a href={`mailto:${companyInfo.email}`} className="text-sm font-medium text-blue-400/80 hover:text-blue-400 transition-colors">
                                    {companyInfo.email}
                                </a>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <a href={companyInfo.whatsapp.startsWith('http') ? companyInfo.whatsapp : `https://wa.me/${companyInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-400/80 hover:text-emerald-400 transition-colors">
                                    {t('login.whatsapp_support')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
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
