// app/governance/page.tsx

import { getActiveLocale } from '../_pantavion/locale';
import { getActiveDemoRole } from '../_pantavion/role';
import { MetricGrid, PantavionShell } from '../_pantavion/ui';

export default async function GovernancePage() {
  const locale = await getActiveLocale();
  const role = await getActiveDemoRole();

  return (
    <PantavionShell
      title={locale === 'el' ? 'Κονσόλα Διακυβέρνησης' : 'Governance Console'}
      subtitle={
        locale === 'el'
          ? 'Ιδρυτική συνταγματική επιφάνεια για ανθρώπινη τελική εξουσία, νομικά ασφαλή προσαρμογή, επικαλύψεις δικαιοδοσίας και κυρίαρχη διακυβέρνηση.'
          : 'Founder constitutional surface for human final authority, legal-safe adaptation, jurisdiction overlays and sovereign governance.'
      }
      role={role}
      locale={locale}
      currentPath="/governance"
    >
      <MetricGrid
        items={
          locale === 'el'
            ? [
                { label: 'Πρόσβαση', value: 'μόνο ιδρυτής' },
                { label: 'Εξουσία', value: 'ανθρώπινη-τελική' },
                { label: 'Δικαιοδοσία', value: 'παγκόσμια επίγνωση' },
                { label: 'Δόγμα', value: 'νομικά ασφαλές' },
              ]
            : [
                { label: 'Access', value: 'founder only' },
                { label: 'Authority', value: 'human-final' },
                { label: 'Jurisdiction', value: 'global-aware' },
                { label: 'Doctrine', value: 'legal-safe' },
              ]
        }
      />
    </PantavionShell>
  );
}
