import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, ReactNode } from 'react'

interface User {
    username: string;
    first_name?: string;
}

interface LayoutProps {
    children: ReactNode;
    title?: string;
}

export default function Layout({ children, title = 'NexaSolft Treasury' }: LayoutProps) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        } else if (router.pathname !== '/login') {
            router.push('/login')
        }
    }, [router])

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
    }

    if (!user && router.pathname !== '/login') {
        return null // Or a loading spinner
    }

    if (router.pathname === '/login') {
        return (
            <div className="min-h-screen bg-gray-100">
                <Head>
                    <title>{title}</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <main>{children}</main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>{title}</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-blue-900">NexaSolft</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link href="/dashboard" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname === '/dashboard' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                                    Tableau de bord
                                </Link>
                                <Link href="/folios" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname.startsWith('/folios') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                                    Folios
                                </Link>
                                <Link href="/transactions" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname.startsWith('/transactions') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                                    Journal
                                </Link>
                                <Link href="/invoices" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname.startsWith('/invoices') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                                    Factures
                                </Link>
                                <Link href="/settlements" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname.startsWith('/settlements') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                                    Règlements
                                </Link>
                                <Link href="/reports" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${router.pathname.startsWith('/reports') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                                    Rapports
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="flex flex-col items-end mr-4">
                                <span className="text-sm font-medium text-gray-700">{user?.first_name || user?.username}</span>
                                <span className="text-xs text-gray-500">Gestionnaire</span>
                            </div>
                            <button onClick={logout} className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200" title="Déconnexion">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} NexaSolft. Tous droits réservés.
                    </p>
                </div>
            </footer>
        </div>
    )
}
