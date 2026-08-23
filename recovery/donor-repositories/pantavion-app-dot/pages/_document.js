import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1f6feb" />
        <meta property="og:title" content="Pantavion" />
        <meta property="og:description" content="Everything for Everyone — Global social & life hub." />
        <meta property="og:image" content="/logo.svg" />
      </Head>
      <body className="bg-gradient-to-br from-brand to-brand-accent text-gray-900 dark:text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
