import Layout from '../../components/Layout'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Reports() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleExportCSV = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }

            const res = await fetch('http://localhost:8000/api/transactions/export_transactions/', {
                headers: { 'Authorization': `Token ${token}` }
            })

            if (res.status === 401) {
                router.push('/login')
                return
            }

            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'transactions.csv'
                document.body.appendChild(a)
                a.click()
                a.remove()
            } else {
                alert("Erreur lors de l'exportation")
            }
        } catch (error) {
            console.error("Error exporting CSV:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout title="Rapports - NexaSolft">
            <div className="space-y-6">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Rapports et Export
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Générez des rapports et exportez vos données.
                        </p>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Export des Données
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <div className="flex-shrink-0">
                                <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <a href="#" onClick={(e) => { e.preventDefault(); handleExportCSV(); }} className="focus:outline-none">
                                    <span className="absolute inset-0" aria-hidden="true" />
                                    <p className="text-sm font-medium text-gray-900">
                                        Exporter les Transactions (CSV)
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        Télécharger toutes les transactions au format CSV pour Excel.
                                    </p>
                                </a>
                            </div>
                        </div>

                        {/* Placeholder for other reports */}
                        <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 opacity-50 cursor-not-allowed">
                            <div className="flex-shrink-0">
                                <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <a href="#" className="focus:outline-none">
                                    <span className="absolute inset-0" aria-hidden="true" />
                                    <p className="text-sm font-medium text-gray-900">
                                        Rapport Journalier (PDF)
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        Bientôt disponible.
                                    </p>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
