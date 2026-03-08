import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { transactionApi, folioApi, Folio } from '../services/api';

const paymentMethodIcons: Record<string, string> = {
    CASH: '💵',
    CARD: '💳',
    TRANSFER: '🏦',
    CHECK: '📝',
    MOBILE: '📱',
    OTHER: '📋',
};

interface TransactionModalProps {
    isOpen: boolean;
    defaultType?: 'RECEIPT' | 'PAYMENT';
    folioId?: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TransactionModal({ isOpen, defaultType, folioId, onClose, onSuccess }: TransactionModalProps) {
    const { t } = useTranslation('common');
    const [type, setType] = useState<'RECEIPT' | 'PAYMENT'>(defaultType || 'RECEIPT');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedFolio, setSelectedFolio] = useState<number | null>(folioId || null);
    const [folios, setFolios] = useState<Folio[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            folioApi.list({ status: 'OPEN' }).then(setFolios).catch(console.error);
            if (defaultType) setType(defaultType);
            if (folioId) setSelectedFolio(folioId);

            // Auto-generate reference in the background
            if (!reference) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const randomCode = Math.floor(1000 + Math.random() * 9000);
                setReference(`FAC-${yyyy}${mm}${dd}-${randomCode}`);
            }
        }
    }, [isOpen, defaultType, folioId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFolio) {
            setError('Veuillez sélectionner un folio');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await transactionApi.create({
                folio: selectedFolio,
                type,
                amount: parseFloat(amount),
                payment_method: paymentMethod,
                reference: reference || undefined,
                description: description || undefined,
                client_name: type === 'RECEIPT' ? clientName || undefined : undefined,
                supplier_name: type === 'PAYMENT' ? clientName || undefined : undefined,
            });

            if (result.success) {
                onSuccess();
                onClose();
                // Reset form
                setAmount('');
                setReference('');
                setDescription('');
                setClientName('');
            } else {
                setError(result.message || 'Error');
            }
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
                        {t('transaction.create')}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Transaction Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType('RECEIPT')}
                                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${type === 'RECEIPT'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                            >
                                <TrendingUp size={20} />
                                {t('transaction.type_RECEIPT')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('PAYMENT')}
                                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${type === 'PAYMENT'
                                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                    }`}
                            >
                                <TrendingDown size={20} />
                                {t('transaction.type_PAYMENT')}
                            </button>
                        </div>

                        {/* Folio Selection */}
                        {!folioId && (
                            <div>
                                <label className="label">Folio *</label>
                                <select
                                    value={selectedFolio || ''}
                                    onChange={(e) => setSelectedFolio(Number(e.target.value))}
                                    className="select"
                                    required
                                >
                                    <option value="">Sélectionnez un folio</option>
                                    {folios.map((folio) => (
                                        <option key={folio.id} value={folio.id}>
                                            {folio.code} - {folio.running_balance.toFixed(2)} MRU
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="label">{t('transaction.amount')} *</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input"
                                placeholder="0.00"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="label">{t('transaction.payment_method')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['CASH', 'CARD', 'TRANSFER', 'CHECK', 'MOBILE', 'OTHER'].map((method) => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method)}
                                        className={`p-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all ${paymentMethod === method
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span>{paymentMethodIcons[method]}</span>
                                        <span className="hidden sm:inline">{t(`transaction.method_${method}`)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Client/Supplier Name */}
                        <div>
                            <label className="label">
                                {type === 'RECEIPT' ? t('transaction.client_name') : t('transaction.supplier_name')}
                            </label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="input"
                                placeholder="Nom..."
                            />
                        </div>

                        {/* Reference is hidden now */}

                        {/* Description */}
                        <div>
                            <label className="label">{t('transaction.description')}</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input"
                                rows={2}
                                placeholder="Description optionnelle..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className={`flex-1 ${type === 'RECEIPT' ? 'btn-success' : 'btn-danger'}`}
                                disabled={loading || !amount || !selectedFolio}
                            >
                                {loading ? <span className="spinner" /> : t('common.create')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
