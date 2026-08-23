import Link from 'next/link'
import Image from 'next/image'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLang } from '@/components/LanguageProvider'
import { detectInitialLocale } from '@/lib/locale'

export async function getServerSideProps({ req }) {
  const initialLocale = detectInitialLocale(req);
  return { props: { initialLocale } };
}

export default function Home() {
  const { t } = useLang();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 flex-1 flex flex-col">
        <header className="nav">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Pantavion" className="h-10 w-auto" />
            <span className="text-xl font-semibold tracking-wide">Pantavion</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost">{t('actions.login')}</Link>
            <Link href="/signup" className="btn btn-primary">{t('actions.signup')}</Link>
            <LanguageSwitcher/>
          </div>
        </header>

        <main className="grid place-items-center flex-1">
          <div className="card max-w-3xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-6">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/signup" className="btn btn-primary">{t('cta.getStarted')}</Link>
              <a href="#features" className="btn">{t('cta.explore')}</a>
            </div>
          </div>
        </main>

        <section id="features" className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-xl font-semibold mb-2">{t('features.multilang.title')}</h3>
              <p className="opacity-90">{t('features.multilang.desc')}</p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-2">{t('features.security.title')}</h3>
              <p className="opacity-90">{t('features.security.desc')}</p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-2">{t('features.scalable.title')}</h3>
              <p className="opacity-90">{t('features.scalable.desc')}</p>
            </div>
          </div>
        </section>

        <footer className="container mx-auto px-4 pb-8 text-center opacity-80">
          <p>© {new Date().getFullYear()} Pantavion — {t('footer.rights')}</p>
        </footer>
      </div>
    </div>
  )
}
