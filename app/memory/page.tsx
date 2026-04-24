// app/memory/page.tsx

import { getActiveLocale } from '../_pantavion/locale';
import { getActiveDemoRole } from '../_pantavion/role';
import { MetricGrid, PantavionShell } from '../_pantavion/ui';

export default async function MemoryPage() {
  const locale = await getActiveLocale();
  const role = await getActiveDemoRole();

  return (
    <PantavionShell
      title={locale === 'el' ? 'Χρονολόγιο μνήμης' : 'Memory Timeline'}
      subtitle={
        locale === 'el'
          ? 'Προσωπική επιφάνεια συνέχειας για μνήμη χρήστη, νήματα, γεγονότα, γεγονότα αναφοράς, δεσμεύσεις και υπενθυμίσεις.'
          : 'Personal continuity surface for user memory, threads, facts, commitments and reminders.'
      }
      role={role}
      locale={locale}
      currentPath="/memory"
    >
      <MetricGrid
        items={
          locale === 'el'
            ? [
                { label: 'Πρόσβαση', value: 'πιστοποιημένη' },
                { label: 'Μοντέλο ιδιοκτησίας', value: 'αυτο-οριοθετημένο' },
                { label: 'Συνέχεια', value: 'ενεργή' },
                { label: 'Μνήμη', value: 'επεισοδιακή + σημασιολογική + εργασίας' },
              ]
            : [
                { label: 'Access', value: 'authenticated' },
                { label: 'Owner model', value: 'self-bounded' },
                { label: 'Continuity', value: 'active' },
                { label: 'Memory mode', value: 'episodic + semantic + working' },
              ]
        }
      />
    </PantavionShell>
  );
}
