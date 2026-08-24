/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'el', 'es'],
    defaultLocale: 'en',
    localeDetection: true
  },
  images: { unoptimized: true }
};

module.exports = nextConfig;
