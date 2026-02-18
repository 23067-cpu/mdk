import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCcw } from 'lucide-react';
import { CashDenomination, cashDenominationApi } from '../services/api';

interface BilletageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (total: number, counts: { denomination: number; quantity: number }[]) => void;
    currency?: string;
}

export default function BilletageModal({ isOpen, onClose, onConfirm, currency = 'MRU' }: BilletageModalProps) {
    const { t } = useTranslation();
    const [denominations, setDenominations] = useState<CashDenomination[]>([]);
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadDenominations();
        }
    }, [isOpen]);

    const loadDenominations = async () => {
        try {
            setLoading(true);
            const data = await cashDenominationApi.list();
            // Sort by value (highest first)
            const activeDenoms = data.filter(d => d.is_active).sort((a, b) => b.value - a.value);
            setDenominations(activeDenoms);

            // Initialize counts
            const initialCounts: Record<number, number> = {};
            activeDenoms.forEach(d => initialCounts[d.id] = 0);
            setCounts(initialCounts);
        } catch (error) {
            console.error('Error loading denominations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCountChange = (id: number, quantity: string) => {
        const qty = parseInt(quantity) || 0;
        setCounts(prev => ({
            ...prev,
            [id]: Math.max(0, qty)
        }));
    };

    const calculateTotal = () => {
        return denominations.reduce((sum, denom) => {
            return sum + (denom.value * (counts[denom.id] || 0));
        }, 0);
    };

    const handleConfirm = () => {
        const total = calculateTotal();
        const formattedCounts = Object.entries(counts)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({
                denomination: parseInt(id),
                quantity: qty
            }));

        onConfirm(total, formattedCounts);
        onClose();
    };

    const handleReset = () => {
        const resetCounts: Record<number, number> = {};
        denominations.forEach(d => resetCounts[d.id] = 0);
        setCounts(resetCounts);
    };

    if (!isOpen) return null;

    const totalAmount = calculateTotal();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('folio.cash_count', 'Billetage (Comptage de Caisse)')}
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {denominations.map((denom) => (
                                        <div key={denom.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-100 dark:border-slate-700">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                                                ${denom.is_coin
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                }`}
                                            >
                                                {denom.value}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {denom.is_coin ? 'Pièce' : 'Billet'} de {denom.value} {denom.currency}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={counts[denom.id] || ''}
                                                        onChange={(e) => handleCountChange(denom.id, e.target.value)}
                                                        className="w-24 px-3 py-1.5 text-right rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        = {(counts[denom.id] || 0) * denom.value}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-lg font-medium text-gray-600 dark:text-gray-300">Total Calculé:</span>
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {totalAmount.toLocaleString()} <span className="text-lg text-gray-500">{currency}</span>
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2.5 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                                <RotateCcw size={18} />
                                {t('common.reset', 'Réinitialiser')}
                            </button>
                            <div className="flex-1"></div>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                {t('common.cancel', 'Annuler')}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={totalAmount <= 0}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                <Save size={18} />
                                {t('common.confirm', 'Confirmer le Billetage')}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
