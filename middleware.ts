// middleware.ts

import { NextRequest, NextResponse } from 'next/server';

type PantavionRole =
  | 'guest'
  | 'user'
  | 'operator'
  | 'founder';

type PantavionLocale =
  | 'el'
  | 'en';

const AUTHENTICATED = new Set<PantavionRole>(['user', 'operator', 'founder']);
const OPERATOR = new Set<PantavionRole>(['operator', 'founder']);
const FOUNDER = new Set<PantavionRole>(['founder']);

const ROUTE_RULES = [
  { prefix: '/memory', allowed: AUTHENTICATED, gate: 'authenticated' },
  { prefix: '/inspector', allowed: AUTHENTICATED, gate: 'authenticated' },
  { prefix: '/intelligence', allowed: OPERATOR, gate: 'operator' },
  { prefix: '/security', allowed: OPERATOR, gate: 'operator' },
  { prefix: '/commercial', allowed: FOUNDER, gate: 'founder' },
  { prefix: '/governance', allowed: FOUNDER, gate: 'founder' },
] as const;

function normalizeRole(value: string | undefined): PantavionRole {
  if (value === 'user' || value === 'operator' || value === 'founder') {
    return value;
  }

  return 'guest';
}

function normalizeLocale(value: string | undefined): PantavionLocale {
  if (value === 'en') {
    return 'en';
  }

  return 'el';
}

export function middleware(request: NextRequest) {
  const roleParam = request.nextUrl.searchParams.get('as');
  const langParam = request.nextUrl.searchParams.get('lang');

  if (roleParam || langParam) {
    const normalizedRole = normalizeRole(roleParam ?? undefined);
    const normalizedLocale = normalizeLocale(langParam ?? undefined);

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('as');
    redirectUrl.searchParams.delete('lang');

    const response = NextResponse.redirect(redirectUrl);

    if (normalizedRole === 'guest') {
      response.cookies.delete('pantavion_role');
    } else {
      response.cookies.set('pantavion_role', normalizedRole, {
        path: '/',
        sameSite: 'lax',
      });
    }

    response.cookies.set('pantavion_lang', normalizedLocale, {
      path: '/',
      sameSite: 'lax',
    });

    return response;
  }

  const activeRole = normalizeRole(request.cookies.get('pantavion_role')?.value);
  const path = request.nextUrl.pathname;

  const rule = ROUTE_RULES.find((item) => path === item.prefix || path.startsWith(`${item.prefix}/`));

  if (!rule) {
    return NextResponse.next();
  }

  if (rule.allowed.has(activeRole)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/';
  redirectUrl.searchParams.set('gate', rule.gate);
  redirectUrl.searchParams.set('next', path);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
