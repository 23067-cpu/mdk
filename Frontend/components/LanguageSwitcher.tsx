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
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-sm ${router.locale === 'fr' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Français"
            >
                <span className="flex items-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-5 h-3.5 rounded-sm shadow-sm object-cover"><path fill="#fff" d="M0 0h640v480H0z" /><path fill="#002654" d="M0 0h213.3v480H0z" /><path fill="#ce1126" d="M426.7 0h213.3v480H426.7z" /></svg>
                </span>
                <span className="hidden sm:inline">FR</span>
            </button>
            <button
                onClick={() => changeLanguage('ar')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-sm ${router.locale === 'ar' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="العربية"
            >
                <span className="flex items-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-5 h-3.5 rounded-sm shadow-sm object-cover"><path fill="#006233" d="M0 0h640v480H0z" /><path fill="#ffc400" d="M320 102.9L350.2 186l88.4-5.3-67 55.4 20.8 85.8-72.4-46.7-72.4 46.7 20.8-85.8-67-55.4 88.4 5.3z" /><path fill="#d21034" d="M0 0h640v48H0zm0 432h640v48H0z" /></svg>
                </span>
                <span className="hidden sm:inline">AR</span>
            </button>
            <button
                onClick={() => changeLanguage('en')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-sm ${router.locale === 'en' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="English"
            >
                <span className="flex items-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-5 h-3.5 rounded-sm shadow-sm object-cover"><path fill="#012169" d="M0 0h640v480H0z" /><path fill="#FFF" d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" /><path fill="#C8102E" d="M424 281l216 159v40L369 281h55zm-184 20l6 5L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" /><path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" /><path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" /></svg>
                </span>
                <span className="hidden sm:inline">EN</span>
            </button>
        </div>
    )
}
