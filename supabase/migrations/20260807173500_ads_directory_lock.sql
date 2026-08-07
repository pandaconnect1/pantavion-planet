-- Pantavion ads may be served only inside the dedicated Ads Directory.

alter table public.pantavion_advertisers
  add column if not exists account_tier text not null default 'standard';

alter table public.pantavion_advertisers
  drop constraint if exists pantavion_advertisers_account_tier_check;

alter table public.pantavion_advertisers
  add constraint pantavion_advertisers_account_tier_check
  check (account_tier in ('standard','enterprise'));

update public.pantavion_ad_placements
set surface = 'ads_directory';

alter table public.pantavion_ad_placements
  drop constraint if exists pantavion_ad_placements_surface_check;

alter table public.pantavion_ad_placements
  add constraint pantavion_ad_placements_surface_check
  check (surface = 'ads_directory');

update public.pantavion_ad_rate_cards
set surface = 'ads_directory';

alter table public.pantavion_ad_rate_cards
  drop constraint if exists pantavion_ad_rate_cards_surface_check;

alter table public.pantavion_ad_rate_cards
  add constraint pantavion_ad_rate_cards_surface_check
  check (surface = 'ads_directory');

update public.pantavion_ad_requests
set requested_surfaces = array['ads_directory']::text[];

alter table public.pantavion_ad_requests
  add column if not exists commercial_track text not null default 'standard';

alter table public.pantavion_ad_requests
  drop constraint if exists pantavion_ad_requests_commercial_track_check;

alter table public.pantavion_ad_requests
  add constraint pantavion_ad_requests_commercial_track_check
  check (commercial_track in ('standard','enterprise'));
