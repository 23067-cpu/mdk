import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import {
    User, Mail, Phone, Building2, Shield, Key,
    Globe, Moon, Bell, Save, Eye, EyeOff, Check
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { authApi } from '../../services/api';

export default function ProfilePage() {
    const { t, i18n } = useTranslation('common');
    const { user, refreshUser } = useAuth();
    const { success, error } = useNotification();
    const lang = (i18n.language || 'fr') as 'fr' | 'ar' | 'en';

    // Profile form
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        preferred_language: 'fr',
    });
    const [profileLoading, setProfileLoading] = useState(false);

    // Password form
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                preferred_language: user.preferred_language || 'fr',
            });
        }
    }, [user]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);

        try {
            await authApi.updateProfile(profileData);
            await refreshUser();
            success(t('common.saved'), t('profile.update_success'));
        } catch (err) {
            error(t('common.error'), err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            error(t('common.error'), t('profile.password_mismatch'));
            return;
        }

        if (passwordData.new_password.length < 8) {
            error(t('common.error'), t('profile.password_too_short'));
            return;
        }

        setPasswordLoading(true);

        try {
            await authApi.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            success(t('common.saved'), t('profile.password_changed'));
        } catch (err) {
            error(t('common.error'), err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const roleBadgeColors: Record<string, string> = {
        ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        GERANT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        CAISSIER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        SAISIE_CLIENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        SAISIE_FOURNISSEUR: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
    };

    if (!user) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('profile.title')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {t('profile.subtitle')}
                </p>
            </div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
            >
                <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium mt-2 ${roleBadgeColors[user.role] || ''}`}>
                            <Shield size={14} />
                            {ROLE_LABELS[lang]?.[user.role] || user.role}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">{t('users.first_name')}</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={profileData.first_name}
                                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                    className="input pl-12"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">{t('users.last_name')}</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={profileData.last_name}
                                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                                    className="input pl-12"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">{t('users.email')}</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="input pl-12"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">{t('users.phone')}</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="input pl-12"
                                    placeholder="+222 XX XX XX XX"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label">{t('profile.language')}</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={profileData.preferred_language}
                                onChange={(e) => setProfileData({ ...profileData, preferred_language: e.target.value })}
                                className="select pl-12"
                            >
                                <option value="fr">Français</option>
                                <option value="ar">العربية</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>

                    {user.branch_name && (
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Building2 size={18} />
                                <span>{t('users.branch')}:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{user.branch_name}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary" disabled={profileLoading}>
                            {profileLoading ? (
                                <span className="spinner" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    {t('common.save')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* Change Password Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
            >
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700 mb-6">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                        <Key size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {t('profile.change_password')}
                        </h3>
                        <p className="text-sm text-gray-500">{t('profile.password_hint')}</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label className="label">{t('profile.current_password')}</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                className="input pl-12 pr-12"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">{t('profile.new_password')}</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    className="input pl-12 pr-12"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="label">{t('profile.confirm_password')}</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    className="input pl-12 pr-12"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="btn-secondary" disabled={passwordLoading}>
                            {passwordLoading ? (
                                <span className="spinner" />
                            ) : (
                                <>
                                    <Check size={18} />
                                    {t('profile.update_password')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
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
