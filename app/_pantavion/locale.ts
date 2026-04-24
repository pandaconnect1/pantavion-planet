// app/_pantavion/locale.ts

import { cookies } from 'next/headers';

export type PantavionLocale = 'el' | 'en';

export async function getActiveLocale(): Promise<PantavionLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get('pantavion_lang')?.value;

  if (value === 'en') {
    return 'en';
  }

  return 'el';
}

export function getLocaleLabel(locale: PantavionLocale): string {
  return locale === 'el' ? 'Ελληνικά' : 'English';
}
