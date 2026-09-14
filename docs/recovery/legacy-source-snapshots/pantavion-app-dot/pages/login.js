import Link from 'next/link'
import { useLang } from '@/components/LanguageProvider'
import { detectInitialLocale } from '@/lib/locale'

export async function getServerSideProps({ req }) {
  const initialLocale = detectInitialLocale(req);
  return { props: { initialLocale } };
}

export default function Login() {
  const { t } = useLang();
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">{t('auth.loginTitle')}</h1>
        <form className="grid gap-3">
          <input type="email" placeholder={t('auth.email')} className="px-4 py-2 rounded-xl border" />
          <input type="password" placeholder={t('auth.password')} className="px-4 py-2 rounded-xl border" />
          <button type="submit" className="btn btn-primary">{t('actions.login')}</button>
        </form>
        <p className="mt-4 text-sm opacity-80">
          {t('auth.noAccount')} <Link href="/signup" className="underline">{t('actions.signup')}</Link>
        </p>
      </div>
    </div>
  )
}
