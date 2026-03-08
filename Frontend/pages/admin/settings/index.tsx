import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import {
    Settings, Building2, Receipt, DollarSign, Shield, Bell,
    Save, Trash2, Plus, Lock, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { settingsApi, SystemSettings } from '../../../services/api';

// Simulated settings data (would come from API)
const defaultSettings = {
    company: {
        name: 'NexaSolft',
        address: 'Mauritanie',
        phone: '+222 27 73 62 47',
        email: 'info@nexasoft.mr',
        website: 'https://www.nexasoft.mr',
        facebook: 'https://facebook.com/nexasolft',
        whatsapp: '+222 27 73 62 47',
        currency: 'MRU',
        logo: '',
    },
    approval: {
        transaction_threshold: 50000,
        admin_transaction_threshold: 200000,
        settlement_requires_approval: true,
        folio_closure_requires_approval: true,
    },
    security: {
        session_timeout_minutes: 30,
        max_login_attempts: 5,
        require_2fa: false,
        password_expiry_days: 90,
    },
    notifications: {
        email_on_high_value_transaction: true,
        email_on_folio_closure: true,
        email_on_settlement_approval: true,
        discrepancy_threshold: 1000,
    },
    receipt: {
        header_text: 'NexaSolft Treasury',
        footer_text: 'Merci pour votre confiance',
        show_qr_code: true,
        include_signature_line: true,
    },
};

type SettingsTab = 'company' | 'approval' | 'security' | 'notifications' | 'receipt';

export default function SettingsPage() {
    const { t } = useTranslation('common');
    const { hasRole } = useAuth();
    const { success, error, warning } = useNotification();

    const [activeTab, setActiveTab] = useState<SettingsTab>('company');
    const [settings, setSettings] = useState(defaultSettings);
    const [settingsIds, setSettingsIds] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsApi.list();
            const newSettings = { ...defaultSettings };
            const newIds: Record<string, number> = {};

            data.forEach((setting) => {
                if (setting.key in newSettings) {
                    // Merge remote data with default structure to ensure all fields exist
                    const key = setting.key as keyof typeof defaultSettings;
                    (newSettings as any)[key] = {
                        ...newSettings[key],
                        ...setting.value
                    };
                    newIds[setting.key] = setting.id;
                }
            });

            setSettings(newSettings);
            setSettingsIds(newIds);
        } catch (err) {
            console.error('Failed to load settings', err);
            error(t('common.error'), 'Erreur lors du chargement des paramètres');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'company', label: t('settings.company'), icon: Building2 },
        { id: 'approval', label: t('settings.approval'), icon: Shield },
        { id: 'security', label: t('settings.security'), icon: Lock },
        { id: 'notifications', label: t('settings.notifications'), icon: Bell },
        { id: 'receipt', label: t('settings.receipt'), icon: Receipt },
    ];

    const handleSave = async () => {
        setLoading(true);
        try {
            // Save each section
            const promises = Object.keys(settings).map(async (key) => {
                const settingKey = key as keyof typeof settings;
                const value = settings[settingKey];

                if (settingsIds[key]) {
                    // Update existing
                    await settingsApi.update(settingsIds[key], { value });
                } else {
                    // Create new
                    const newSetting = await settingsApi.create({
                        key,
                        value,
                        description: `Settings for ${key}`
                    });
                    setSettingsIds(prev => ({ ...prev, [key]: newSetting.id }));
                }
            });

            await Promise.all(promises);

            success(t('common.saved'), t('settings.save_success'));
            setHasChanges(false);
        } catch (err) {
            console.error('Save error', err);
            error(t('common.error'), t('settings.save_error'));
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = (category: string, key: string, value: any) => {
        setSettings((prev) => ({
            ...prev,
            [category]: {
                ...prev[category as keyof typeof prev],
                [key]: value,
            },
        }));
        setHasChanges(true);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                error(t('common.error'), 'L\'image ne doit pas dépasser 2 MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                updateSetting('company', 'logo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!hasRole('ADMIN')) {
        return (
            <div className="empty-state py-20">
                <Lock className="empty-state-icon" />
                <h3 className="text-lg font-medium mb-2">{t('auth.access_denied')}</h3>
                <p className="text-gray-500">{t('settings.admin_only')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Settings className="text-blue-500" />
                        {t('settings.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('settings.subtitle')}
                    </p>
                </div>

                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3"
                    >
                        <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle size={16} />
                            {t('settings.unsaved_changes')}
                        </span>
                        <button onClick={handleSave} className="btn-primary" disabled={loading}>
                            {loading ? <span className="spinner" /> : <Save size={18} />}
                            {t('common.save')}
                        </button>
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tabs Sidebar */}
                <div className="lg:col-span-1">
                    <div className="card p-2 space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left rtl:text-right transition-all ${activeTab === tab.id
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-3">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card p-6"
                    >
                        {/* Company Settings */}
                        {activeTab === 'company' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Building2 size={20} />
                                    {t('settings.company_info')}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 flex items-center gap-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 dark:border-slate-600 shrink-0">
                                            {settings.company.logo ? (
                                                <img src={settings.company.logo} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <Building2 className="text-gray-400" size={32} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                                                {t('settings.company_logo')}
                                            </label>
                                            <p className="text-xs text-gray-500 mb-3">
                                                {t('settings.logo_help')}
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.company_name')}</label>
                                        <input
                                            type="text"
                                            value={settings.company.name}
                                            onChange={(e) => updateSetting('company', 'name', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.company_phone')}</label>
                                        <input
                                            type="tel"
                                            value={settings.company.phone}
                                            onChange={(e) => updateSetting('company', 'phone', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.company_email')}</label>
                                        <input
                                            type="email"
                                            value={settings.company.email}
                                            onChange={(e) => updateSetting('company', 'email', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.company_website')}</label>
                                        <input
                                            type="url"
                                            value={settings.company.website}
                                            onChange={(e) => updateSetting('company', 'website', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.company_facebook')}</label>
                                        <input
                                            type="url"
                                            value={settings.company.facebook}
                                            onChange={(e) => updateSetting('company', 'facebook', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.company_whatsapp')}</label>
                                        <input
                                            type="tel"
                                            value={settings.company.whatsapp}
                                            onChange={(e) => updateSetting('company', 'whatsapp', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="label">{t('settings.company_address')}</label>
                                        <textarea
                                            value={settings.company.address}
                                            onChange={(e) => updateSetting('company', 'address', e.target.value)}
                                            className="input"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.default_currency')}</label>
                                        <select
                                            value={settings.company.currency}
                                            onChange={(e) => updateSetting('company', 'currency', e.target.value)}
                                            className="select"
                                        >
                                            <option value="MRU">MRU (Ouguiya)</option>
                                            <option value="EUR">EUR (Euro)</option>
                                            <option value="USD">USD (Dollar)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Approval Settings */}
                        {activeTab === 'approval' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Shield size={20} />
                                    {t('settings.approval_rules')}
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="label flex items-center gap-2">
                                            <DollarSign size={16} />
                                            {t('settings.approval_threshold')}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={settings.approval.transaction_threshold}
                                                onChange={(e) => updateSetting('approval', 'transaction_threshold', e.target.value ? parseInt(e.target.value) : '')}
                                                className="input w-40"
                                            />
                                            <span className="text-gray-500">MRU</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {t('settings.approval_threshold_help')}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="label flex items-center gap-2">
                                            <DollarSign size={16} />
                                            Limite Administrateur (Admin Threshold)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={settings.approval.admin_transaction_threshold}
                                                onChange={(e) => updateSetting('approval', 'admin_transaction_threshold', e.target.value ? parseInt(e.target.value) : '')}
                                                className="input w-40"
                                            />
                                            <span className="text-gray-500">MRU</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Seul l'Administrateur peut approuver une transaction atteignant cette limite.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {t('settings.approval_settlement')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {t('settings.approval_settlement_help')}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.approval.settlement_requires_approval}
                                                onChange={(e) => updateSetting('approval', 'settlement_requires_approval', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {t('settings.approval_folio')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {t('settings.approval_folio_help')}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.approval.folio_closure_requires_approval}
                                                onChange={(e) => updateSetting('approval', 'folio_closure_requires_approval', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Lock size={20} />
                                    {t('settings.security_settings')}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">{t('settings.security_timeout')}</label>
                                        <input
                                            type="number"
                                            value={settings.security.session_timeout_minutes}
                                            onChange={(e) => updateSetting('security', 'session_timeout_minutes', e.target.value ? parseInt(e.target.value) : '')}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.security_max_attempts')}</label>
                                        <input
                                            type="number"
                                            value={settings.security.max_login_attempts}
                                            onChange={(e) => updateSetting('security', 'max_login_attempts', e.target.value ? parseInt(e.target.value) : '')}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.security_password_expiry')}</label>
                                        <input
                                            type="number"
                                            value={settings.security.password_expiry_days}
                                            onChange={(e) => updateSetting('security', 'password_expiry_days', e.target.value ? parseInt(e.target.value) : '')}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {t('settings.security_2fa')}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t('settings.security_2fa_help')}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.security.require_2fa}
                                            onChange={(e) => updateSetting('security', 'require_2fa', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Notifications Settings */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Bell size={20} />
                                    {t('settings.notification_settings')}
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="label">{t('settings.notif_threshold')}</label>
                                        <input
                                            type="number"
                                            value={settings.notifications.discrepancy_threshold}
                                            onChange={(e) => updateSetting('notifications', 'discrepancy_threshold', parseInt(e.target.value))}
                                            className="input w-40"
                                        />
                                    </div>

                                    {[
                                        { key: 'email_on_high_value_transaction', label: t('settings.notif_high_value') },
                                        { key: 'email_on_folio_closure', label: t('settings.notif_folio_close') },
                                        { key: 'email_on_settlement_approval', label: t('settings.notif_settlement') },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                            <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                                                    onChange={(e) => updateSetting('notifications', item.key, e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Receipt Settings */}
                        {activeTab === 'receipt' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Receipt size={20} />
                                    {t('settings.receipt_template')}
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="label">{t('settings.receipt_header')}</label>
                                        <input
                                            type="text"
                                            value={settings.receipt.header_text}
                                            onChange={(e) => updateSetting('receipt', 'header_text', e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">{t('settings.receipt_footer')}</label>
                                        <input
                                            type="text"
                                            value={settings.receipt.footer_text}
                                            onChange={(e) => updateSetting('receipt', 'footer_text', e.target.value)}
                                            className="input"
                                        />
                                    </div>

                                    {[
                                        { key: 'show_qr_code', label: t('settings.receipt_qr') },
                                        { key: 'include_signature_line', label: t('settings.receipt_signature') },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                            <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.receipt[item.key as keyof typeof settings.receipt] as boolean}
                                                    onChange={(e) => updateSetting('receipt', item.key, e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
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
