import { useRouter } from 'next/router'

export default function LanguageSwitcher() {
    const router = useRouter()

    const changeLanguage = (lang: string) => {
        router.push(router.pathname, router.asPath, { locale: lang })
        // document.dir is handled in Layout or _document usually, but we can force it here for immediate effect
        document.dir = lang === 'ar' ? 'rtl' : 'ltr'
    }

    return (
        <div className="flex space-x-1 rtl:space-x-reverse">
            <button
                onClick={() => changeLanguage('fr')}
                className={`p-2 rounded-lg transition-colors ${router.locale === 'fr' ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Français"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover">
                    <path fill="#fff" d="M0 0h640v480H0z" />
                    <path fill="#002654" d="M0 0h213.3v480H0z" />
                    <path fill="#ce1126" d="M426.7 0h213.3v480H426.7z" />
                </svg>
            </button>
            <button
                onClick={() => changeLanguage('ar')}
                className={`p-2 rounded-lg transition-colors ${router.locale === 'ar' ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="العربية"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover">
                    <path fill="#006233" d="M0 0h640v480H0z" />
                    <path fill="#ffc400" d="M320 102.9L350.2 186l88.4-5.3-67 55.4 20.8 85.8-72.4-46.7-72.4 46.7 20.8-85.8-67-55.4 88.4 5.3z" />
                    <path fill="#d21034" d="M0 0h640v48H0zm0 432h640v48H0z" />
                </svg>
            </button>
            <button
                onClick={() => changeLanguage('en')}
                className={`p-2 rounded-lg transition-colors ${router.locale === 'en' ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="English"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm object-cover">
                    <path fill="#012169" d="M0 0h640v480H0z" />
                    <path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" />
                    <path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 5L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" />
                    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
                    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
                </svg>
            </button>
        </div>
    )
}
