import '@/styles/globals.css'
import { LanguageProvider } from '@/components/LanguageProvider';

function getCookieLocale() {
  if (typeof document === 'undefined') return 'en';
  const m = document.cookie.match(/(?:^|; )locale=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : 'en';
}

export default function App({ Component, pageProps }) {
  const initial = (typeof window === 'undefined') ? (pageProps.initialLocale || 'en') : getCookieLocale();
  return (
    <LanguageProvider initialLocale={initial}>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
