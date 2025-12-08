import Layout from '../../components/Layout'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface Folio {
    id: number;
    code: string;
    opened_by: number; // In real app, expand to user object or name
    opened_at: string;
    opening_balance: string;
    status: string;
    closed_at: string | null;
    closing_balance: string | null;
}

export default function Folios() {
    const [folios, setFolios] = useState<Folio[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetchFolios()
    }, [])

    const fetchFolios = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8000/api/folios/', {
                headers: { 'Authorization': `Token ${token}` }
            })
            const data = await res.json()
            if (Array.isArray(data)) {
                setFolios(data)
            }
        } catch (error) {
            console.error("Error fetching folios:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenFolio = async () => {
        setError('')
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('http://localhost:8000/api/folios/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ opening_balance: 0 }) // Default 0, could prompt user
            })
            const data = await res.json()

            if (data.success) {
                router.push(`/folios/${data.folio.id}`)
            } else {
                setError(data.message || "Impossible d'ouvrir un nouveau folio")
            }
        } catch (error) {
            setError("Erreur lors de l'ouverture du folio")
        }
    }

    return (
        <Layout title="Folios - NexaSolft">
            <div className="space-y-6">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Liste des Folios
                        </h2>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0">
                        <button
                            onClick={handleOpenFolio}
                            type="button"
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Ouvrir un Folio
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Code</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ouvert le</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Solde Ouverture</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fermé le</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Solde Clôture</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {folios.map((folio) => (
                                <tr key={folio.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{folio.code}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(folio.opened_at).toLocaleDateString()}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{folio.opening_balance}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${folio.status === 'OPEN' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                                            {folio.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{folio.closed_at ? new Date(folio.closed_at).toLocaleDateString() : '-'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{folio.closing_balance || '-'}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <Link href={`/folios/${folio.id}`} className="text-blue-600 hover:text-blue-900">
                                            Voir détails<span className="sr-only">, {folio.code}</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    )
}
