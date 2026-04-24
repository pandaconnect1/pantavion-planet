// app/intelligence/page.tsx

import { getActiveLocale } from '../_pantavion/locale';
import { getActiveDemoRole } from '../_pantavion/role';
import { MetricGrid, PantavionShell } from '../_pantavion/ui';

export default async function IntelligencePage() {
  const locale = await getActiveLocale();
  const role = await getActiveDemoRole();

  return (
    <PantavionShell
      title={locale === 'el' ? 'Αρχή Τεχνητής Νοημοσύνης' : 'AI Authority'}
      subtitle={
        locale === 'el'
          ? 'Επιχειρησιακή επιφάνεια νοημοσύνης για εξουσία παρόχων, στάση δυνατοτήτων, γλωσσική τοπικότητα και ετοιμότητα μελλοντικής νοημοσύνης.'
          : 'Operational intelligence surface for provider authority, capability governance, locale posture and future intelligence readiness.'
      }
      role={role}
      locale={locale}
      currentPath="/intelligence"
    >
      <MetricGrid
        items={
          locale === 'el'
            ? [
                { label: 'Πρόσβαση', value: 'χειριστής+' },
                { label: 'Τομέας', value: 'εξουσία νοημοσύνης' },
                { label: 'Τύπος ελέγχου', value: 'διακυβερνώμενος' },
                { label: 'Μελλοντική στάση', value: 'επεκτάσιμη' },
              ]
            : [
                { label: 'Access', value: 'operator+' },
                { label: 'Domain', value: 'intelligence authority' },
                { label: 'Control type', value: 'governed' },
                { label: 'Future posture', value: 'expandable' },
              ]
        }
      />
    </PantavionShell>
  );
}
