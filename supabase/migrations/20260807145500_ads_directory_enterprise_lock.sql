-- Pantavion Ads: dedicated-directory serving + standard/enterprise commercial tracks.

alter table public.pantavion_advertisers
  add column if not exists advertiser_track text not null default 'standard';

alter table public.pantavion_advertisers
  drop constraint if exists pantavion_advertisers_advertiser_track_check;
alter table public.pantavion_advertisers
  add constraint pantavion_advertisers_advertiser_track_check
  check (advertiser_track in ('standard','enterprise'));

alter table public.pantavion_ad_requests
  add column if not exists commercial_track text not null default 'standard',
  add column if not exists scope_type text not null default 'country',
  add column if not exists target_continents text[] not null default '{}',
  add column if not exists agreement_type text not null default 'standard_terms',
  add column if not exists legal_review_status text not null default 'not_required';

alter table public.pantavion_ad_requests
  drop constraint if exists pantavion_ad_requests_commercial_track_check;
alter table public.pantavion_ad_requests
  add constraint pantavion_ad_requests_commercial_track_check
  check (commercial_track in ('standard','enterprise'));

alter table public.pantavion_ad_requests
  drop constraint if exists pantavion_ad_requests_scope_type_check;
alter table public.pantavion_ad_requests
  add constraint pantavion_ad_requests_scope_type_check
  check (scope_type in ('country','multi_country','continent','multi_continent','global'));

alter table public.pantavion_ad_requests
  drop constraint if exists pantavion_ad_requests_agreement_type_check;
alter table public.pantavion_ad_requests
  add constraint pantavion_ad_requests_agreement_type_check
  check (agreement_type in ('standard_terms','enterprise_msa_io'));

alter table public.pantavion_ad_requests
  drop constraint if exists pantavion_ad_requests_legal_review_status_check;
alter table public.pantavion_ad_requests
  add constraint pantavion_ad_requests_legal_review_status_check
  check (legal_review_status in ('not_required','pending','approved','changes_requested'));

-- Campaigns may only be served inside the dedicated Pantavion Ads directory.
alter table public.pantavion_ad_placements
  drop constraint if exists pantavion_ad_placements_surface_check;
update public.pantavion_ad_placements set surface = 'ads_directory' where surface <> 'ads_directory';
alter table public.pantavion_ad_placements
  add constraint pantavion_ad_placements_surface_check
  check (surface = 'ads_directory');

-- Sales requests are also normalized to the same dedicated surface.
update public.pantavion_ad_requests set requested_surfaces = array['ads_directory']::text[];

-- Existing rate cards remain reusable but become directory-only.
alter table public.pantavion_ad_rate_cards
  drop constraint if exists pantavion_ad_rate_cards_surface_check;
update public.pantavion_ad_rate_cards set surface = 'ads_directory' where surface <> 'ads_directory';
alter table public.pantavion_ad_rate_cards
  add constraint pantavion_ad_rate_cards_surface_check
  check (surface = 'ads_directory');
