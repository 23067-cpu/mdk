import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface Folio {
    id: number;
    code: string;
    opening_balance: string;
    running_balance: number;
    opened_at: string;
    status: string;
}

export default function Dashboard() {
    const [folio, setFolio] = useState<Folio | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }

            const res = await fetch('http://localhost:8000/api/dashboard/', {
                headers: { 'Authorization': `Token ${token}` }
            })

            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
                return;
            }

            const data = await res.json()
            if (data.success && data.folio) {
                setFolio(data.folio)
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenFolio = () => {
        router.push('/folios')
    }

    return (
        <Layout title="Tableau de bord - NexaSolft">
            <div className="space-y-8">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Tableau de bord
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Aperçu de votre activité de trésorerie.
                        </p>
                    </div>
                </div>

                {/* Open Folio Card - Hero Section */}
                <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${folio ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Folio Actif
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {folio ? folio.code : "Aucun folio ouvert"}
                                    </p>
                                </div>
                            </div>
                            {folio && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    OUVERT
                                </span>
                            )}
                        </div>

                        {folio ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500">Ouvert le</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">{new Date(folio.opened_at).toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500">Solde Initial</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">{Number(folio.opening_balance).toFixed(2)} MRU</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <p className="text-sm font-medium text-blue-600">Solde Courant</p>
                                    <p className="mt-1 text-2xl font-bold text-blue-900">{Number(folio.running_balance).toFixed(2)} MRU</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-gray-500 mb-4">Vous n'avez pas de folio ouvert actuellement.</p>
                                <button onClick={handleOpenFolio} className="btn-primary">
                                    Ouvrir un nouveau folio
                                </button>
                            </div>
                        )}
                    </div>

                    {folio && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                            <Link href={`/folios/${folio.id}`} className="btn-primary justify-center">
                                Nouvelle Opération
                            </Link>
                            <Link href={`/folios/${folio.id}`} className="btn-secondary justify-center">
                                Voir Détails
                            </Link>
                        </div>
                    )}
                </div>

                {/* Quick Links Grid */}
                <h3 className="text-lg font-medium text-gray-900 mt-8">Accès Rapide</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Card 1 */}
                    <Link href="/transactions" className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Journal des écritures
                                    </dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-sm text-gray-900">
                                            Historique complet
                                        </div>
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 2 */}
                    <Link href="/invoices" className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Factures
                                    </dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-sm text-gray-900">
                                            Gérer les factures
                                        </div>
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 3 */}
                    <Link href="/settlements" className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Règlements
                                    </dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-sm text-gray-900">
                                            Gestion des règlements
                                        </div>
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </Layout>
    )
}
