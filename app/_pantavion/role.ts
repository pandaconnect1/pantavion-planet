// app/_pantavion/role.ts

import { cookies } from 'next/headers';
import type { PantavionLocale } from './locale';

export type PantavionDemoRole =
  | 'guest'
  | 'user'
  | 'operator'
  | 'founder';

export async function getActiveDemoRole(): Promise<PantavionDemoRole> {
  const cookieStore = await cookies();
  const value = cookieStore.get('pantavion_role')?.value;

  if (value === 'user' || value === 'operator' || value === 'founder') {
    return value;
  }

  return 'guest';
}

export function getLocalizedRoleLabel(role: PantavionDemoRole, locale: PantavionLocale): string {
  if (locale === 'el') {
    switch (role) {
      case 'guest':
        return 'Επισκέπτης';
      case 'user':
        return 'Χρήστης';
      case 'operator':
        return 'Χειριστής';
      case 'founder':
        return 'Ιδρυτής';
    }
  }

  switch (role) {
    case 'guest':
      return 'Guest';
    case 'user':
      return 'User';
    case 'operator':
      return 'Operator';
    case 'founder':
      return 'Founder';
  }
}

export function getRoleDescription(role: PantavionDemoRole, locale: PantavionLocale): string {
  if (locale === 'el') {
    switch (role) {
      case 'guest':
        return 'πρόσβαση μόνο για το κοινό';
      case 'user':
        return 'πρόσβαση σε μνήμη και χώρο εργασίας';
      case 'operator':
        return 'πρόσβαση σε λειτουργίες και ασφάλεια';
      case 'founder':
        return 'πλήρης ιδρυτική διακυβέρνηση και εμπορικός έλεγχος';
    }
  }

  switch (role) {
    case 'guest':
      return 'public-only access';
    case 'user':
      return 'memory and workspace access';
    case 'operator':
      return 'operations and security access';
    case 'founder':
      return 'full founder governance and commercial control';
  }
}
