// app/security/page.tsx

import { getActiveLocale } from '../_pantavion/locale';
import { getActiveDemoRole } from '../_pantavion/role';
import { MetricGrid, PantavionShell } from '../_pantavion/ui';

export default async function SecurityPage() {
  const locale = await getActiveLocale();
  const role = await getActiveDemoRole();

  return (
    <PantavionShell
      title={locale === 'el' ? 'Επιχειρήσεις ασφάλειας' : 'Security Operations'}
      subtitle={
        locale === 'el'
          ? 'Επιφάνεια λειτουργιών ασφάλειας για σκλήρυνση, επιβολή, όρια μισθωτών, κλείδωμα περιστατικών και παρατηρησιμότητα ασφαλούς ανάπτυξης.'
          : 'Operational security surface for hardening, enforcement, tenant boundaries, incident lockdowns and deploy-safe observability.'
      }
      role={role}
      locale={locale}
      currentPath="/security"
    >
      <MetricGrid
        items={
          locale === 'el'
            ? [
                { label: 'Πρόσβαση', value: 'χειριστής+' },
                { label: 'Zero trust', value: 'ενεργό μοντέλο' },
                { label: 'Όριο μισθωτή', value: 'επιβαλλόμενο' },
                { label: 'Λειτουργία περιστατικού', value: 'έτοιμη για κλείδωμα' },
              ]
            : [
                { label: 'Access', value: 'operator+' },
                { label: 'Zero trust', value: 'active model' },
                { label: 'Tenant boundary', value: 'enforced' },
                { label: 'Incident mode', value: 'lockdown-ready' },
              ]
        }
      />
    </PantavionShell>
  );
}
