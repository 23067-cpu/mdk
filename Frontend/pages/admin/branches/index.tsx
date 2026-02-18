import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Plus, Edit, Trash2, Users, MapPin, Phone,
    Search, Check, X, AlertTriangle, Lock
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { branchApi, Branch } from '../../../services/api';

export default function BranchesPage() {
    const { t } = useTranslation('common');
    const { hasRole } = useAuth();
    const { success, error, warning } = useNotification();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        address: '',
        phone: '',
        is_active: true,
    });

    const loadBranches = async () => {
        try {
            const data = await branchApi.list();
            setBranches(data);
        } catch (err) {
            error(t('common.error'), 'Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
    }, []);

    const filteredBranches = branches.filter(
        (b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                code: branch.code,
                name: branch.name,
                address: branch.address || '',
                phone: branch.phone || '',
                is_active: branch.is_active,
            });
        } else {
            setEditingBranch(null);
            setFormData({
                code: '',
                name: '',
                address: '',
                phone: '',
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingBranch) {
                await branchApi.update(editingBranch.id, formData);
                success(t('common.saved'), t('branches.update_success'));
            } else {
                await branchApi.create(formData);
                success(t('common.saved'), t('branches.create_success'));
            }
            setShowModal(false);
            loadBranches();
        } catch (err) {
            error(t('common.error'), err instanceof Error ? err.message : 'Operation failed');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await branchApi.delete(id);
            success(t('common.deleted'), t('branches.delete_success'));
            setDeleteConfirm(null);
            loadBranches();
        } catch (err) {
            error(t('common.error'), 'Cannot delete branch with associated users or folios');
        }
    };

    const handleToggleActive = async (branch: Branch) => {
        try {
            await branchApi.update(branch.id, { is_active: !branch.is_active });
            loadBranches();
            success(t('common.saved'), branch.is_active ? t('branches.deactivated') : t('branches.activated'));
        } catch (err) {
            error(t('common.error'), 'Failed to update branch status');
        }
    };

    if (!hasRole('ADMIN')) {
        return (
            <div className="empty-state py-20">
                <Lock className="empty-state-icon" />
                <h3 className="text-lg font-medium mb-2">{t('auth.access_denied')}</h3>
                <p className="text-gray-500">Cette page est réservée aux administrateurs</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Building2 className="text-blue-500" />
                        {t('branches.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('branches.subtitle')}
                    </p>
                </div>
                <button onClick={() => openModal()} className="btn-primary">
                    <Plus size={18} />
                    {t('branches.add')}
                </button>
            </div>

            {/* Search */}
            <div className="card p-4">
                <div className="relative">
                    <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('common.search') + '...'}
                        className="input pl-12 rtl:pl-4 rtl:pr-12 w-full"
                    />
                </div>
            </div>

            {/* Branches Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner-lg" />
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="empty-state py-12">
                    <Building2 className="empty-state-icon" />
                    <h3 className="text-lg font-medium">{t('branches.no_branches')}</h3>
                    <p className="text-gray-500 mb-4">{t('branches.no_branches_desc')}</p>
                    <button onClick={() => openModal()} className="btn-primary">
                        <Plus size={18} />
                        {t('branches.add')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBranches.map((branch, index) => (
                        <motion.div
                            key={branch.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`card p-5 relative ${!branch.is_active ? 'opacity-60' : ''}`}
                        >
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                <span className={`badge ${branch.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                    {branch.is_active ? t('common.active') : t('common.inactive')}
                                </span>
                            </div>

                            {/* Branch Info */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Building2 size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {branch.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {branch.code}
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="mt-4 space-y-2">
                                {branch.address && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin size={16} />
                                        <span className="truncate">{branch.address}</span>
                                    </div>
                                )}
                                {branch.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Phone size={16} />
                                        <span>{branch.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Users size={16} />
                                    <span>{branch.user_count || 0} {t('users.title')}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
                                <button
                                    onClick={() => openModal(branch)}
                                    className="flex-1 btn-secondary text-sm"
                                >
                                    <Edit size={16} />
                                    {t('common.edit')}
                                </button>
                                <button
                                    onClick={() => handleToggleActive(branch)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${branch.is_active
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        }`}
                                >
                                    {branch.is_active ? t('common.deactivate') : t('common.activate')}
                                </button>
                                {deleteConfirm === branch.id ? (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleDelete(branch.id)}
                                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(branch.id)}
                                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Building2 className="text-blue-500" />
                                {editingBranch ? t('branches.edit') : t('branches.add')}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="label">{t('branches.code')}</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="input"
                                        required
                                        placeholder="BR001"
                                        disabled={!!editingBranch}
                                    />
                                </div>

                                <div>
                                    <label className="label">{t('branches.name')}</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input"
                                        required
                                        placeholder="Agence Principale"
                                    />
                                </div>

                                <div>
                                    <label className="label">{t('branches.address')}</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="input"
                                        rows={2}
                                        placeholder="Adresse de l'agence"
                                    />
                                </div>

                                <div>
                                    <label className="label">{t('branches.phone')}</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input"
                                        placeholder="+222 XX XX XX XX"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {t('branches.active')}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 btn-secondary"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button type="submit" className="flex-1 btn-primary">
                                        {editingBranch ? t('common.save') : t('common.create')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
