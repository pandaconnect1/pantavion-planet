revoke execute on function public.pantavion_complete_own_profile() from anon;
revoke execute on function public.pantavion_complete_own_profile() from public;
grant execute on function public.pantavion_complete_own_profile() to authenticated;
