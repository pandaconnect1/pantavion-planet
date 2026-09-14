# Supabase Connected Recovery — 2026-09-14

## Canonical project
- project ref: `cxhulvwkagzufbjsdwwu`
- status observed: `ACTIVE_HEALTHY`
- region: `eu-west-1`
- PostgreSQL major: 17
- default branch: `main`
- branch status observed: `FUNCTIONS_DEPLOYED` / preview project `ACTIVE_HEALTHY`

## Migration ledger
The connected production project returned 64 applied migrations, in order:
1. `20260812205302_profiles_secure_baseline`
2. `20260812205420_human_communication_core`
3. `20260812205431_personal_media_core`
4. `20260812205439_social_flagship_core`
5. `20260812210107_production_security_hardening`
6. `20260812210515_social_ui_capabilities`
7. `20260812210533_social_media_hydration`
8. `20260812211417_contact_discovery_tokens`
9. `20260812211628_communication_runtime_core`
10. `20260812212902_realtime_chat_social_publication`
11. `20260813082338_create_media_news_listings_core`
12. `20260813082408_grant_public_listing_read_to_anon`
13. `20260813171740_secure_identity_registration_core`
14. `20260813172301_restrict_identity_profile_rpc_to_authenticated`
15. `20260813172532_restrict_identity_trigger_functions`
16. `20260813181512_founder_profile_governance`
17. `20260813183008_trust_safety_profile_controls`
18. `20260813183617_trust_safety_hardening`
19. `20260813184024_trust_safety_internal_listing_helper`
20. `20260813184312_trust_safety_api_boundary`
21. `20260813184645_trust_safety_policy_helpers`
22. `20260813221114_owner_aal2_access_gate`
23. `20260813221741_audit_trust_safety_profile_search`
24. `20260813222121_identity_security_launch_gate`
25. `20260813222316_identity_contacts_age_assurance_and_admin_stats`
26. `20260813222543_lock_trust_safety_search_audit`
27. `20260813222636_identity_security_advisor_hardening`
28. `20260813223002_relationship_messaging_boundary_hardening`
29. `20260813223229_social_identity_command_boundary_hardening`
30. `20260813223528_protected_profiles_privacy_publication_enforcement`
31. `20260813223700_profile_review_protected_decision_hardening`
32. `20260814045750_social_command_boundary_hardening`
33. `20260814045914_minor_privacy_contact_messaging_enforcement`
34. `20260814050442_chat_recipient_privacy_helper`
35. `20260814050449_chat_direct_conversation_privacy_gate`
36. `20260814050455_chat_message_privacy_gate`
37. `20260814054715_people_multi_contact_points_foundation`
38. `20260814055445_people_contact_matching_runtime`
39. `20260814055628_people_contact_discovery_command_boundary`
40. `20260814060732_people_contact_import_command_boundary`
41. `20260814063300_people_nearby_location_evolution`
42. `20260815171533_recover_social_communities_notifications`
43. `20260815171620_harden_social_communities_notifications`
44. `20260822191122_add_interpreter_two_device_sessions`
45. `20260822191159_harden_interpreter_two_device_exposure`
46. `20260822191314_index_interpreter_pairing_attempt_session`
47. `20260822191505_add_interpreter_session_leave`
48. `20260822194957_create_durable_execution_runtime`
49. `20260822195320_add_identity_registration_completion_rpc`
50. `20260824134053_create_secure_scheduled_worker`
51. `20260824184042_create_personal_ai_runtime_v1`
52. `20260824185447_harden_personal_ai_runtime_v1`
53. `20260825022839_harden_personal_ai_memory_supersession_v2`
54. `20260825162513_harden_social_block_visibility_and_media_posts`
55. `20260826133946_owner_decision_control_center`
56. `20260826134022_owner_decision_queue_server_only`
57. `20260827203215_enforce_message_translation_idempotency`
58. `20260827212334_harden_sensitive_control_table_privileges`
59. `20260828062237_durable_execution_lease_fencing`
60. `20260828082934_durable_translation_fenced_persistence`
61. `20260829073502_expand_personal_media_artifact_limit_1_5g`
62. `20260829135042_create_founder_canonical_state_and_execution_intents`
63. `20260830192403_enable_pantavion_internal_scheduler_extensions`
64. `20260830192828_create_pantavion_internal_scheduler_redundancy`

## Active Edge Functions
One active function was returned:
- `pantavion-map-b-one-time-upload`, version 5, SHA-256 evidence `7736651047a730803ba0eb6c3553486a9f7369aacbec1abf6357b2493a863703`

Its complete source was copied into this preservation branch at:
`docs/recovery/supabase-edge-functions/pantavion-map-b-one-time-upload/index.ts`

## Installed database extensions observed
`pgcrypto`, `pg_stat_statements`, `supabase_vault`, `pg_net`, `pg_graphql`, `uuid-ossp`, `pg_cron`, `plpgsql`.

## Direct production row-count truth sampled before preservation
Direct SQL checks returned: `profiles=0`, `messages=0`, `conversations=0`, `contacts=0`, `social_posts=0`, `communities=0`, `personal_ai_profiles=0`, `personal_ai_memories=0`, `profile_age_assurance=0`, `durable_executions=0`, `auth.users=0`, `storage.objects=0`, while `pantavion_founder_execution_intents=17`.

These counts describe stored rows at the time of the check; they do not mean the schema/migrations/runtime structure is absent.

## Security boundary
No database password, service-role key, access token, Vault secret, private row payload, authentication credential, or other secret value is stored in this public GitHub repository. Secrets must be backed up only into an appropriate private secret manager or secure offline owner-controlled store.