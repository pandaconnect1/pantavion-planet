// app/inspector/page.tsx

import { getActiveLocale } from '../_pantavion/locale';
import { getActiveDemoRole } from '../_pantavion/role';
import { MetricGrid, PantavionShell } from '../_pantavion/ui';

export default async function InspectorPage() {
  const locale = await getActiveLocale();
  const role = await getActiveDemoRole();

  return (
    <PantavionShell
      title={locale === 'el' ? 'Επιθεωρητής ορατότητας' : 'Visibility Inspector'}
      subtitle={
        locale === 'el'
          ? 'Ενοποιημένη επιφάνεια επιθεώρησης για manifest, δομή διαδρομών, αποφάσεις πρόσβασης, κύματα και εξαγόμενα σήματα πλατφόρμας.'
          : 'Unified inspector surface for manifests, route structure, access decisions, waves and exported platform signals.'
      }
      role={role}
      locale={locale}
      currentPath="/inspector"
    >
      <MetricGrid
        items={
          locale === 'el'
            ? [
                { label: 'Πρόσβαση', value: 'πιστοποιημένη' },
                { label: 'Λειτουργία', value: 'ορατότητα + διαγνωστικά' },
                { label: 'Τύπος επιφάνειας', value: 'χώρος εργασίας' },
                { label: 'Εξαγωγές συνδεδεμένες', value: 'ναι' },
              ]
            : [
                { label: 'Access', value: 'authenticated' },
                { label: 'Mode', value: 'visibility + diagnostics' },
                { label: 'Surface type', value: 'workspace' },
                { label: 'Exports linked', value: 'yes' },
              ]
        }
      />
    </PantavionShell>
  );
}
