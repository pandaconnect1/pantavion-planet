export function detectInitialLocale(req) {
  // 1) cookie
  const cookie = req?.headers?.cookie || '';
  const match = cookie.match(/(?:^|; )locale=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  // 2) accept-language
  const al = req?.headers?.['accept-language'] || '';
  const langs = al.split(',').map(s => s.split(';')[0].trim().toLowerCase());
  for (const l of langs) {
    if (l.startsWith('el')) return 'el';
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}
