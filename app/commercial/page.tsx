// app/commercial/page.tsx

import { getActiveLocale } from '../_pantavion/locale';
import { getActiveDemoRole } from '../_pantavion/role';
import { MetricGrid, PantavionShell } from '../_pantavion/ui';

export default async function CommercialPage() {
  const locale = await getActiveLocale();
  const role = await getActiveDemoRole();

  return (
    <PantavionShell
      title={locale === 'el' ? 'Εμπορική Κονσόλα' : 'Commercial Console'}
      subtitle={
        locale === 'el'
          ? 'Ιδρυτική εμπορική επιφάνεια για συνδρομές, ράγες πληρωμών, κατάσταση πληρωμών και ορατότητα εσόδων.'
          : 'Founder commercial surface for subscriptions, billing rails, payout posture and revenue visibility.'
      }
      role={role}
      locale={locale}
      currentPath="/commercial"
    >
      <MetricGrid
        items={
          locale === 'el'
            ? [
                { label: 'Πρόσβαση', value: 'μόνο ιδρυτής' },
                { label: 'Ράγα χρέωσης', value: 'seeded' },
                { label: 'Συνδρομές', value: 'μοντελοποιημένες' },
                { label: 'Πληρωμές', value: 'προετοιμασμένες' },
              ]
            : [
                { label: 'Access', value: 'founder only' },
                { label: 'Billing rail', value: 'seeded' },
                { label: 'Subscriptions', value: 'modeled' },
                { label: 'Payout posture', value: 'prepared' },
              ]
        }
      />
    </PantavionShell>
  );
}
