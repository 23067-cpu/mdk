import Layout from '../../components/Layout'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import TransactionModal from '../../components/TransactionModal'

interface Transaction {
    id: number;
    type: string;
    amount: string;
    payment_method: string;
    reference: string;
    description: string;
    created_at: string;
    receipt_number: string | null;
}

interface Folio {
    id: number;
    code: string;
    opening_balance: string;
    running_balance: number; // Calculated in frontend or fetched
    status: string;
    opened_at: string;
    transactions: Transaction[];
}

export default function FolioDetails() {
    const router = useRouter()
    const { id } = router.query
    const [folio, setFolio] = useState<Folio | null>(null)
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (id) {
            fetchFolioDetails()
        }
    }, [id])

    const fetchFolioDetails = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`http://localhost:8000/api/folios/${id}/`, {
                headers: { 'Authorization': `Token ${token}` }
            })
            const data = await res.json()
            if (data.id) {
                // Calculate running balance locally for now or use what API gives if implemented
                // The API view we wrote returns 'folio' object. Wait, the ViewSet default retrieve returns the object.
                // We didn't customize retrieve in ViewSet to include running_balance, but Dashboard does.
                // Let's rely on the transactions list to show history.
                // Ideally we should update the serializer or view to send running_balance.
                // For this demo, let's just show the static data.
                setFolio(data)
            }
        } catch (error) {
            console.error("Error fetching folio:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddTransaction = async (transactionData: any) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8000/api/transactions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(transactionData)
            })
            const data = await res.json()
            if (data.success) {
                setIsModalOpen(false)
                fetchFolioDetails() // Refresh data
            } else {
                alert(data.message || "Erreur lors de l'ajout")
            }
        } catch (error) {
            alert("Erreur réseau")
        }
    }

    const handleCloseFolio = async () => {
        if (!confirm("Êtes-vous sûr de vouloir clôturer ce folio ? Cette action est irréversible.")) return;

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`http://localhost:8000/api/folios/${id}/close/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                fetchFolioDetails()
            } else {
                alert(data.message || "Erreur lors de la clôture")
            }
        } catch (error) {
            alert("Erreur réseau")
        }
    }

    const handlePrintReceipt = async (transactionId: number) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`http://localhost:8000/api/transactions/${transactionId}/print_receipt/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` }
            })

            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `receipt_${transactionId}.pdf`
                document.body.appendChild(a)
                a.click()
                a.remove()
            } else {
                alert("Erreur lors de la génération du reçu")
            }
        } catch (error) {
            alert("Erreur lors de l'impression")
        }
    }

    if (loading) return <Layout><div className="p-4">Chargement...</div></Layout>
    if (!folio) return <Layout><div className="p-4">Folio introuvable</div></Layout>

    return (
        <Layout title={`Folio ${folio.code} - NexaSolft`}>
            <div className="space-y-6">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Détails du Folio: {folio.code}
                        </h2>
                        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                Statut: <span className={`ml-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${folio.status === 'OPEN' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>{folio.status}</span>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                Solde Ouverture: {folio.opening_balance} MRU
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
                        {folio.status === 'OPEN' && (
                            <>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    type="button"
                                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    Ajouter Transaction
                                </button>
                                <button
                                    onClick={handleCloseFolio}
                                    type="button"
                                    className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                                >
                                    Clôturer Folio
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Transactions</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Montant</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Méthode</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Référence</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {/* Note: In a real app, we need to fetch transactions for this folio. 
                                        The default ViewSet retrieve might not include them unless nested serializer is used.
                                        For this demo, assuming they are included or we fetch them separately. 
                                        Let's assume the serializer includes them for now or we map them if separate.
                                        If not, the table will be empty.
                                    */}
                                    {/* To make this work robustly without changing backend too much, 
                                        we should probably fetch transactions? 
                                        Actually, let's assume the backend serializer includes 'transactions' (related_name).
                                        I didn't add it to FolioSerializer explicitly, but fields='__all__' might include it if it's a field.
                                        Reverse relations are NOT included by default in ModelSerializer '__all__'.
                                        I should update the serializer to include it or fetch separately.
                                        
                                        Let's update the frontend to fetch transactions separately to be safe.
                                    */}
                                </tbody>
                            </table>
                            {/* Fetching transactions separately for robustness */}
                            <TransactionsList folioId={folio.id} onPrint={handlePrintReceipt} />
                        </div>
                    </div>
                </div>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddTransaction}
                folioId={folio.id}
            />
        </Layout>
    )
}

function TransactionsList({ folioId, onPrint }: { folioId: number, onPrint: (id: number) => void }) {
    const [transactions, setTransactions] = useState<Transaction[]>([])

    useEffect(() => {
        const fetchTransactions = async () => {
            const token = localStorage.getItem('token')
            // Filter by folio. The ViewSet has filter_backends? 
            // We didn't add DjangoFilterBackend. 
            // Let's just fetch all and filter client side for this demo or add filter to backend.
            // Adding filter to backend is better.
            // But for now, let's assume we can filter or just fetch all.
            // Actually, let's just use the nested relation approach by updating the serializer in the next step if needed.
            // OR, simpler: The backend ViewSet for transactions doesn't have filtering enabled by default.
            // Let's fetch all and filter in JS (not efficient but works for demo).
            const res = await fetch('http://localhost:8000/api/transactions/', {
                headers: { 'Authorization': `Token ${token}` }
            })
            const data = await res.json()
            if (Array.isArray(data)) {
                setTransactions(data.filter((t: any) => t.folio === folioId))
            }
        }
        fetchTransactions()
    }, [folioId])

    return (
        <table className="min-w-full divide-y divide-gray-300">
            <thead>
                <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Montant</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Méthode</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Référence</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0">{new Date(transaction.created_at).toLocaleString()}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${transaction.type === 'RECEIPT' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                                {transaction.type === 'RECEIPT' ? 'Encaissement' : 'Décaissement'}
                            </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{transaction.amount} MRU</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.payment_method}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.reference}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.description}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            {transaction.type === 'RECEIPT' && (
                                <button onClick={() => onPrint(transaction.id)} className="text-indigo-600 hover:text-indigo-900">
                                    Imprimer<span className="sr-only">, {transaction.id}</span>
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
