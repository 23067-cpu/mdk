import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion } from 'framer-motion';
import {
    Plus, Search, Users, Mail, Phone, Building2,
    RefreshCw, Lock, Power, Edit, Trash2, CheckCircle, XCircle, Key
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../../../contexts/AuthContext';
import { userApi, branchApi, User, Branch } from '../../../services/api';

// Role badge colors
const roleBadge: Record<string, string> = {
    ADMIN: 'badge-danger',
    GERANT: 'badge-warning',
    CAISSIER: 'badge-info',
};

// Create/Edit User Modal
interface UserModalProps {
    isOpen: boolean;
    user?: User | null;
    branches: Branch[];
    onClose: () => void;
    onSuccess: () => void;
}

function UserModal({ isOpen, user: editUser, branches, onClose, onSuccess }: UserModalProps) {
    const { t, i18n } = useTranslation('common');
    const { hasRole } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'CAISSIER',
        branch: '',
        phone: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editUser) {
            setFormData({
                username: editUser.username,
                email: editUser.email,
                first_name: editUser.first_name,
                last_name: editUser.last_name,
                role: editUser.role,
                branch: editUser.branch?.toString() || '',
                phone: editUser.phone || '',
                password: '',
            });
        } else {
            setFormData({
                username: '',
                email: '',
                first_name: '',
                last_name: '',
                role: 'CAISSIER',
                branch: '',
                phone: '',
                password: '',
            });
        }
    }, [editUser, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (editUser) {
                // Update user
                const { password, ...updateData } = formData;
                await userApi.update(editUser.id, {
                    ...updateData,
                    branch: updateData.branch ? parseInt(updateData.branch) : undefined,
                } as Partial<User>);
            } else {
                // Create user
                await userApi.create({
                    ...formData,
                    branch: formData.branch ? parseInt(formData.branch) : undefined,
                });
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal-content max-w-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        {editUser ? t('users.edit') : t('users.create')}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">{t('users.first_name')} *</label>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">{t('users.last_name')} *</label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">{t('users.username')} *</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="input"
                                required
                                disabled={!!editUser}
                            />
                        </div>

                        <div>
                            <label className="label">{t('users.email')} *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input"
                                required
                            />
                        </div>

                        {!editUser && (
                            <div>
                                <label className="label">{t('auth.password')} *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input"
                                    required={!editUser}
                                    minLength={8}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">{t('users.role')} *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="select"
                                    required
                                    disabled={!hasRole('ADMIN')}
                                >
                                    {Object.keys(ROLE_LABELS[i18n.language] || ROLE_LABELS.fr).map((role) => (
                                        <option key={role} value={role}>
                                            {t(`roles.${role}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">{t('users.branch')}</label>
                                <select
                                    value={formData.branch}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                    className="select"
                                    disabled={!hasRole('ADMIN')}
                                >
                                    <option value="">Toutes les branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label">{t('users.phone')}</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="input"
                                placeholder="+222 XX XX XX XX"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel')}
                            </button>
                            <button type="submit" className="btn-primary flex-1" disabled={loading}>
                                {loading ? <span className="spinner" /> : t('common.save')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

// Reset Password Modal
interface ResetPasswordModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

function ResetPasswordModal({ isOpen, user, onClose, onSuccess }: ResetPasswordModalProps) {
    const { t } = useTranslation('common');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await userApi.resetPassword(user.id, newPassword);
            onSuccess();
            onClose();
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('users.reset_password')}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        {user.first_name} {user.last_name} ({user.username})
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Nouveau mot de passe *</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input"
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label className="label">Confirmer le mot de passe *</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel')}
                            </button>
                            <button type="submit" className="btn-primary flex-1" disabled={loading}>
                                {loading ? <span className="spinner" /> : t('common.save')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default function UsersPage() {
    const { t } = useTranslation('common');
    const { user: currentUser, hasRole } = useAuth();

    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [userModal, setUserModal] = useState<{ open: boolean; user: User | null }>({
        open: false,
        user: null,
    });
    const [resetModal, setResetModal] = useState<{ open: boolean; user: User | null }>({
        open: false,
        user: null,
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, branchesData] = await Promise.all([
                userApi.list(roleFilter ? { role: roleFilter } : undefined),
                branchApi.list(),
            ]);
            setUsers(usersData);
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [roleFilter]);

    const handleToggleActive = async (user: User) => {
        try {
            await userApi.toggleActive(user.id);
            fetchData();
        } catch (error) {
            console.error('Error toggling user:', error);
        }
    };

    const filteredUsers = users.filter((u) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            u.username.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.first_name.toLowerCase().includes(query) ||
            u.last_name.toLowerCase().includes(query)
        );
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!hasRole('ADMIN') && !hasRole('GERANT')) {
        return (
            <div className="empty-state py-20">
                <Lock className="empty-state-icon" />
                <h3 className="text-lg font-medium mb-2">{t('auth.access_denied')}</h3>
                <p className="text-gray-500">Accès refusé. Réservé aux administrateurs ou gérants.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('users.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gérez les utilisateurs et leurs permissions
                    </p>
                </div>

                <button
                    onClick={() => setUserModal({ open: true, user: null })}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    {t('users.create')}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.keys(roleBadge).map((role) => {
                    const count = users.filter((u) => u.role === role).length;
                    return (
                        <div
                            key={role}
                            className={`card p-4 cursor-pointer transition-all ${roleFilter === role ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
                        >
                            <span className={`badge ${roleBadge[role]} mb-2`}>{t(`roles.${role}`)}</span>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-12 rtl:pl-4 rtl:pr-12"
                            placeholder={t('common.search')}
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="select"
                    >
                        <option value="">Tous les rôles</option>
                        {Object.keys(roleBadge).map((role) => (
                            <option key={role} value={role}>
                                {t(`roles.${role}`)}
                            </option>
                        ))}
                    </select>

                    <button onClick={fetchData} className="btn-icon" title={t('common.refresh')}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="table-container">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="skeleton h-16 rounded" />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12">
                        <div className="empty-state">
                            <Users className="empty-state-icon" />
                            <h3 className="text-lg font-medium mb-2">Aucun utilisateur</h3>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>{t('users.email')}</th>
                                    <th>{t('users.role')}</th>
                                    <th>{t('users.branch')}</th>
                                    <th>{t('users.last_login')}</th>
                                    <th>{t('users.is_active')}</th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar">
                                                    {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-gray-600 dark:text-gray-400">{user.email}</td>
                                        <td>
                                            <span className={`badge ${roleBadge[user.role] || 'badge-neutral'}`}>
                                                {t(`roles.${user.role}`)}
                                            </span>
                                        </td>
                                        <td className="text-gray-600 dark:text-gray-400">
                                            {user.branch_name || '-'}
                                        </td>
                                        <td className="text-sm text-gray-500">{formatDate(user.last_login)}</td>
                                        <td>
                                            {user.is_active ? (
                                                <span className="flex items-center gap-1 text-emerald-600">
                                                    <CheckCircle size={16} />
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <XCircle size={16} />
                                                    Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setUserModal({ open: true, user })}
                                                    className="btn-icon"
                                                    title={t('common.edit')}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setResetModal({ open: true, user })}
                                                    className="btn-icon"
                                                    title={t('users.reset_password')}
                                                >
                                                    <Key size={16} />
                                                </button>
                                                {user.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleToggleActive(user)}
                                                        className={`btn-icon ${user.is_active ? 'text-red-600' : 'text-emerald-600'}`}
                                                        title={t('users.toggle_status')}
                                                    >
                                                        <Power size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Modal */}
            <UserModal
                isOpen={userModal.open}
                user={userModal.user}
                branches={branches}
                onClose={() => setUserModal({ open: false, user: null })}
                onSuccess={fetchData}
            />

            {/* Reset Password Modal */}
            <ResetPasswordModal
                isOpen={resetModal.open}
                user={resetModal.user}
                onClose={() => setResetModal({ open: false, user: null })}
                onSuccess={fetchData}
            />
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
