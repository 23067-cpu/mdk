import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { t, i18n } = useTranslation('common');
    const router = useRouter();
    const { login, isLoading } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0f2744 50%, #0f172a 100%)' }}>
            {/* Animated Background Elements */}
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
                        y: [0, -30, 0],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(30, 90, 235, 0.4) 0%, transparent 70%)',
                        filter: 'blur(80px)'
                    }}
                />
                <motion.div
                    animate={{
                        y: [0, 20, 0],
                        x: [0, -10, 0],
                        opacity: [0.15, 0.25, 0.15]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)',
                        filter: 'blur(60px)'
                    }}
                />
                <motion.div
                    animate={{
                        y: [0, 15, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(212, 165, 116, 0.3) 0%, transparent 70%)',
                        filter: 'blur(50px)'
                    }}
                />

                {/* Floating Particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0, 0.5, 0]
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.8
                        }}
                        className="absolute w-1 h-1 bg-blue-400 rounded-full"
                        style={{
                            left: `${15 + i * 15}%`,
                            top: `${30 + (i % 3) * 20}%`
                        }}
                    />
                ))}
            </div>

            {/* Left side - Branding */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:flex lg:w-1/2 relative"
            >
                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-8 relative"
                    >
                        <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-2xl scale-150" />
                        <Image
                            src="/Nexasoft.png"
                            alt="NexaSolft"
                            width={130}
                            height={130}
                            className="rounded-2xl shadow-2xl relative z-10"
                        />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl font-bold mb-4 text-center bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent"
                    >
                        NexaSolft Treasury
                    </motion.h1>

                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="text-xl text-blue-200/80 text-center max-w-md leading-relaxed"
                    >
                        {t('landing.hero_subtitle')}
                    </motion.p>

                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-12 grid grid-cols-2 gap-4"
                    >
                        {[
                            { icon: '📊', text: t('landing.feature_1_title') },
                            { icon: '🔒', text: t('landing.feature_2_title') },
                            { icon: '📈', text: t('landing.feature_3_title') },
                            { icon: '👥', text: t('landing.feature_4_title') },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.03, y: -2 }}
                                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 transition-all duration-300 hover:bg-white/10 hover:border-white/20"
                            >
                                <span className="text-2xl">{feature.icon}</span>
                                <span className="text-sm font-medium text-white/90">{feature.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Right side - Login Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10"
            >
                <div className="w-full max-w-md">
                    {/* Language Switcher */}
                    <div className="flex justify-end mb-8 gap-2">
                        {['fr', 'ar', 'en'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => changeLanguage(lang)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${i18n.language === lang
                                    ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10'
                                    }`}
                            >
                                {lang === 'fr' ? '🇫🇷' : lang === 'ar' ? '🇲🇷' : '🇬🇧'} {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Mobile Logo */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="lg:hidden flex flex-col items-center mb-8"
                    >
                        <Image
                            src="/Nexasoft.png"
                            alt="NexaSolft"
                            width={80}
                            height={80}
                            className="rounded-xl shadow-xl mb-4"
                        />
                        <h1 className="text-2xl font-bold text-white">NexaSolft Treasury</h1>
                    </motion.div>

                    {/* Login Card */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        {/* Card Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-[28px] blur-xl opacity-50" />

                        <div className="relative bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            {/* Inner glow line */}
                            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {t('auth.login_welcome')} 👋
                                </h2>
                                <p className="text-white/50">
                                    {t('auth.login_subtitle')}
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400"
                                >
                                    <AlertCircle size={20} />
                                    <span className="text-sm">{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">{t('auth.username')}</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all duration-300"
                                            placeholder={t('auth.username')}
                                            autoComplete="username"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">{t('auth.password')}</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" size={18} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all duration-300"
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.01, y: -1 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                                    style={{
                                        background: 'linear-gradient(135deg, #1e5aeb 0%, #0ea5e9 100%)',
                                        boxShadow: '0 8px 32px -8px rgba(30, 90, 235, 0.5)'
                                    }}
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2 relative z-10">
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {t('auth.login_loading')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2 relative z-10">
                                            <LogIn size={18} />
                                            {t('auth.login_button')}
                                        </span>
                                    )}
                                </motion.button>
                            </form>

                            {/* Contact Info */}
                            <div className="mt-8 pt-6 border-t border-white/10 text-center">
                                <p className="text-sm text-white/40 mb-3">
                                    {t('footer.contact')}
                                </p>
                                <div className="flex justify-center gap-4">
                                    <a
                                        href="mailto:info@nexasoft.mr"
                                        className="text-sm text-blue-400/80 hover:text-blue-400 transition-colors"
                                    >
                                        info@nexasoft.mr
                                    </a>
                                    <span className="text-white/20">|</span>
                                    <a
                                        href="https://wa.me/22227736247"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-emerald-400/80 hover:text-emerald-400 transition-colors"
                                    >
                                        WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer */}
                    <p className="text-center text-sm text-white/30 mt-8">
                        © {new Date().getFullYear()} NexaSolft. {t('footer.rights')}.
                    </p>
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
