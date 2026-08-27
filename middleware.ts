// middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

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
const WATER_ADMIN_PREFIX = '/professional/infrastructure/water/admin';
const WATER_ADMIN_ACCESS_PATH = `${WATER_ADMIN_PREFIX}/access`;
const WATER_MOBILE_FOUNDER_PATH = '/professional/infrastructure/water/mobile-founder';
const WATER_ADMIN_SESSION_COOKIE = 'pantavion_water_admin_session';
const WATER_ADMIN_SESSION_VERSION = 'v2';
const WATER_ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 2;
const WATER_ADMIN_SESSION_CONTEXT = 'pantavion-water-admin-session-v2';
const WATER_ADMIN_CLOCK_SKEW_SECONDS = 60;
const WATER_ADMIN_ONLY_PATHS = [
  '/professional/infrastructure/water/intelligence',
  '/professional/infrastructure/water/master',
  '/professional/infrastructure/water/master-dwg',
] as const;

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

function readWaterAdminSessionSecret() {
  return (
    process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET ||
    process.env.PANTAVION_WATER_ADMIN_ACCESS_CODE ||
    process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE ||
    process.env.PANTAVION_ADMIN_ACCESS_CODE ||
    ''
  ).trim();
}

function decodeBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function verifyWaterAdminSessionValue(
  suppliedSession: string,
  secret: string,
  nowMs = Date.now(),
) {
  if (!suppliedSession || !secret) return false;

  const parts = suppliedSession.split('.');
  if (parts.length !== 5) return false;

  const [version, issuedRaw, expiresRaw, nonce, signatureRaw] = parts;
  if (version !== WATER_ADMIN_SESSION_VERSION) return false;

  const issuedAt = Number(issuedRaw);
  const expiresAt = Number(expiresRaw);
  const nowSeconds = Math.floor(nowMs / 1000);

  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt) || expiresAt <= issuedAt) {
    return false;
  }
  if (issuedAt > nowSeconds + WATER_ADMIN_CLOCK_SKEW_SECONDS) return false;
  if (expiresAt <= nowSeconds) return false;
  if (expiresAt - issuedAt > WATER_ADMIN_SESSION_TTL_SECONDS) return false;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(nonce)) return false;

  const signature = decodeBase64Url(signatureRaw);
  if (!signature) return false;

  const payload = `${issuedAt}.${expiresAt}.${nonce}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(`${WATER_ADMIN_SESSION_CONTEXT}:${payload}`),
  );
}

function waterAdminAccessRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = WATER_ADMIN_ACCESS_PATH;
  redirectUrl.search = '';
  redirectUrl.searchParams.set('next', request.nextUrl.pathname);

  const response = NextResponse.redirect(redirectUrl);
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === WATER_MOBILE_FOUNDER_PATH) {
    return waterAdminAccessRedirect(request);
  }

  const isProtectedWaterAdminPath =
    path === WATER_ADMIN_PREFIX ||
    (path.startsWith(`${WATER_ADMIN_PREFIX}/`) && path !== WATER_ADMIN_ACCESS_PATH) ||
    WATER_ADMIN_ONLY_PATHS.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );

  if (isProtectedWaterAdminPath) {
    const secret = readWaterAdminSessionSecret();
    const suppliedSession = request.cookies.get(WATER_ADMIN_SESSION_COOKIE)?.value || '';
    const authorized = await verifyWaterAdminSessionValue(suppliedSession, secret);

    if (!authorized) {
      return waterAdminAccessRedirect(request);
    }
  }

  if (path.startsWith('/profile') || path.startsWith('/dashboard')) {
    return updateSession(request);
  }

  const roleParam = request.nextUrl.searchParams.get('as');
  const langParam = request.nextUrl.searchParams.get('lang');

  if (roleParam || langParam) {
    const normalizedRole = normalizeRole(roleParam ?? undefined);
    const normalizedLocale = normalizeLocale(langParam ?? undefined);

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('as');
    redirectUrl.searchParams.delete('lang');

    const response = NextResponse.redirect(redirectUrl);

    if (roleParam) {
      if (process.env.NODE_ENV !== 'production' && normalizedRole !== 'guest') {
        response.cookies.set('pantavion_role', normalizedRole, {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
        });
      } else {
        response.cookies.delete('pantavion_role');
      }
    }

    if (langParam) {
      response.cookies.set('pantavion_lang', normalizedLocale, {
        path: '/',
        sameSite: 'lax',
      });
    }

    return response;
  }

  const activeRole =
    process.env.NODE_ENV === 'production'
      ? 'guest'
      : normalizeRole(request.cookies.get('pantavion_role')?.value);

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
