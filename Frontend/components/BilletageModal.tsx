import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface BilletageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (total: number, counts: { denomination: number; quantity: number }[]) => void;
    currency?: string;
    expectedBalance?: number;
}

export default function BilletageModal({ isOpen, onClose, onConfirm, currency = 'MRU', expectedBalance }: BilletageModalProps) {
    const { t } = useTranslation('common');
    const [actualBalance, setActualBalance] = useState<string>('');
    const [matchesExpected, setMatchesExpected] = useState<boolean>(true);

    useEffect(() => {
        if (isOpen && expectedBalance !== undefined) {
            setActualBalance(expectedBalance.toString());
            setMatchesExpected(true);
        }
    }, [isOpen, expectedBalance]);

    const handleConfirm = () => {
        const total = matchesExpected ? (expectedBalance || 0) : parseFloat(actualBalance) || 0;
        onConfirm(total, []);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('folio.propose_closure', 'Proposer la clôture')}
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <div className="mb-6">
                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                                Solde théorique attendu:
                            </p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {expectedBalance?.toLocaleString() || 0} <span className="text-lg text-gray-500">{currency}</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="font-medium text-gray-900 dark:text-white">
                                Est-ce le même montant présent dans la caisse ?
                            </p>

                            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <input
                                    type="radio"
                                    name="matches"
                                    checked={matchesExpected}
                                    onChange={() => setMatchesExpected(true)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Oui, le montant correspond.</span>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <input
                                    type="radio"
                                    name="matches"
                                    checked={!matchesExpected}
                                    onChange={() => setMatchesExpected(false)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Non, il y a un écart.</span>
                            </label>

                            {!matchesExpected && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-2"
                                >
                                    <label className="label">Montant physique réel compté</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={actualBalance}
                                            onChange={(e) => setActualBalance(e.target.value)}
                                            className="input pr-16"
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                            {currency}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-3">
                        <button
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            {t('common.cancel', 'Annuler')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!matchesExpected && (!actualBalance || parseFloat(actualBalance) < 0)}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {t('common.confirm', 'Confirmer')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
