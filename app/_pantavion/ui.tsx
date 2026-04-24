// app/_pantavion/ui.tsx

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PantavionLocale } from './locale';
import type { PantavionDemoRole } from './role';
import { getLocalizedRoleLabel, getRoleDescription } from './role';

export interface PantavionMetricItem {
  label: string;
  value: string;
}

export interface PantavionLinkItem {
  href: string;
  label: string;
  hint: string;
}

export function PantavionShell(props: {
  title: string;
  subtitle: string;
  role: PantavionDemoRole;
  locale: PantavionLocale;
  currentPath: string;
  children: ReactNode;
}): ReactNode {
  const dictionary =
    props.locale === 'el'
      ? {
          activeRole: 'Ενεργός ρόλος Pantavion',
          home: 'Σπίτι',
          memory: 'Μνήμη',
          inspector: 'Επιθεωρητής',
          intelligence: 'Νοημοσύνη',
          security: 'Ασφάλεια',
          commercial: 'Εμπορικός',
          governance: 'Διακυβέρνηση',
          legacyKernel: 'Παλαιός ιστός πυρήνα',
          signals: 'Σήματα',
          resetHome: 'Αρχική',
        }
      : {
          activeRole: 'Pantavion active role',
          home: 'Home',
          memory: 'Memory',
          inspector: 'Inspector',
          intelligence: 'Intelligence',
          security: 'Security',
          commercial: 'Commercial',
          governance: 'Governance',
          legacyKernel: 'Legacy Kernel',
          signals: 'Signals',
          resetHome: 'Home',
        };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #08111f 0%, #0f1c31 100%)',
        color: '#e8eef8',
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px 56px' }}>
        <div
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(15, 26, 47, 0.86)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 14px 40px rgba(0,0,0,0.28)',
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.72, marginBottom: 8 }}>
            {dictionary.activeRole}{' '}
            <strong>{getLocalizedRoleLabel(props.role, props.locale)}</strong> —{' '}
            {getRoleDescription(props.role, props.locale)}
          </div>
          <h1 style={{ fontSize: 34, margin: '0 0 10px 0' }}>{props.title}</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.88, margin: 0 }}>{props.subtitle}</p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <RoleLink
            href={`${props.currentPath}?as=guest&lang=${props.locale}`}
            label={getLocalizedRoleLabel('guest', props.locale)}
          />
          <RoleLink
            href={`${props.currentPath}?as=user&lang=${props.locale}`}
            label={getLocalizedRoleLabel('user', props.locale)}
          />
          <RoleLink
            href={`${props.currentPath}?as=operator&lang=${props.locale}`}
            label={getLocalizedRoleLabel('operator', props.locale)}
          />
          <RoleLink
            href={`${props.currentPath}?as=founder&lang=${props.locale}`}
            label={getLocalizedRoleLabel('founder', props.locale)}
          />
          <RoleLink href={`/?lang=${props.locale}`} label={dictionary.resetHome} />
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <LangLink href={`${props.currentPath}?lang=el&as=${props.role}`} label="Ελληνικά" />
          <LangLink href={`${props.currentPath}?lang=en&as=${props.role}`} label="English" />
        </div>

        <nav
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 22,
          }}
        >
          <NavLink href="/" label={dictionary.home} />
          <NavLink href="/memory" label={dictionary.memory} />
          <NavLink href="/inspector" label={dictionary.inspector} />
          <NavLink href="/intelligence" label={dictionary.intelligence} />
          <NavLink href="/security" label={dictionary.security} />
          <NavLink href="/commercial" label={dictionary.commercial} />
          <NavLink href="/governance" label={dictionary.governance} />
          <NavLink href="/kernel" label={dictionary.legacyKernel} />
          <NavLink href="/signals" label={dictionary.signals} />
        </nav>

        {props.children}
      </div>
    </main>
  );
}

export function MetricGrid(props: { items: PantavionMetricItem[] }): ReactNode {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14,
        marginBottom: 22,
      }}
    >
      {props.items.map((item) => (
        <article
          key={`${item.label}-${item.value}`}
          style={{
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(18, 30, 54, 0.92)',
            borderRadius: 18,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.68, marginBottom: 8 }}>{item.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{item.value}</div>
        </article>
      ))}
    </section>
  );
}

export function LinkGrid(props: { items: PantavionLinkItem[] }): ReactNode {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 14,
      }}
    >
      {props.items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          style={{
            textDecoration: 'none',
            color: '#e8eef8',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(18, 30, 54, 0.92)',
            borderRadius: 18,
            padding: 18,
            display: 'block',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.label}</div>
          <div style={{ fontSize: 14, opacity: 0.74, lineHeight: 1.5 }}>{item.hint}</div>
        </Link>
      ))}
    </section>
  );
}

function NavLink(props: { href: string; label: string }): ReactNode {
  return (
    <Link
      href={props.href}
      style={{
        textDecoration: 'none',
        color: '#d8e6ff',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 999,
        padding: '10px 14px',
        fontSize: 14,
      }}
    >
      {props.label}
    </Link>
  );
}

function RoleLink(props: { href: string; label: string }): ReactNode {
  return (
    <Link
      href={props.href}
      style={{
        textDecoration: 'none',
        color: '#0f172a',
        background: '#d7e8ff',
        borderRadius: 999,
        padding: '10px 14px',
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {props.label}
    </Link>
  );
}

function LangLink(props: { href: string; label: string }): ReactNode {
  return (
    <Link
      href={props.href}
      style={{
        textDecoration: 'none',
        color: '#d8e6ff',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 999,
        padding: '10px 14px',
        fontSize: 14,
      }}
    >
      {props.label}
    </Link>
  );
}
