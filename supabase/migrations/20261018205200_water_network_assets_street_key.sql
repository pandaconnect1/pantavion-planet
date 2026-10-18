-- Street search key: the drawing's street label in capitals without Greek
-- accents, so "Σουλίου", "ΣΟΥΛΙΟΥ" and "σουλιου" meet. Latin labels are only
-- upper-cased. Applied to production as version 20261018205200.
alter table public.water_network_assets
  add column if not exists street_key text generated always as (
    upper(translate(coalesce(street, ''), 'άέήίόύώϊϋΐΰΆΈΉΊΌΎΏς', 'αεηιουωιυιυΑΕΗΙΟΥΩσ'))
  ) stored;
create index if not exists water_network_assets_street_key_idx on public.water_network_assets (street_key);
