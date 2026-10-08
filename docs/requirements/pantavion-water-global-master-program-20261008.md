# PANTAVION WATER — Ολοκληρωμένο Master Πρόγραμμα
**Έκδοση:** 2026-10-08 / v1.0
**Ιδιοκτήτης εντολής:** Founder Pantavion
**Κάλυψη:** Δήμος και επαρχία Λεμεσού → Κύπρος → διεθνής τεχνολογική παρακολούθηση.
**Κατάσταση:** ΑΠΑΙΤΗΣΕΙΣ + ΤΕΚΜΗΡΙΩΜΕΝΟΣ ΕΛΕΓΧΟΣ. ΔΕΝ ισοδυναμεί με implementation / deployment / live verification.

## Α. Δόγμα και κανόνες ασφαλείας
1. Όλα περνούν από τον κεντρικό Pantavion Orchestrator: ingestion, records, work orders, approvals, auditing, scheduling, knowledge, reports και AI. Οι προμηθευτές είναι αντικαταστάσιμοι adapters.
2. ZERO DELETE: διατήρηση αυθεντικού Master Map A, πρωτότυπων DWG/KMZ/PDF και εκδόσεων, B/C/D/E, χρηστών, εγκρίσεων, μετρήσεων και ιστορικών αλλαγών. Τα road/base layers ΔΕΝ τροποποιούν τα αυθεντικά pipes/valves.
3. Χωριστά: canonical water network, street/location registry, εργασίες/επισκευές, telemetry, hydraulic scenarios, source evidence. Όχι conflation.
4. Καμία αυτόνομη εντολή σε PRV, αντλία, SCADA ή βάνα: μόνο υποβοήθηση από μοντέλο και εξουσιοδοτημένη ανθρώπινη εκτίμηση/έγκριση. Ουδέποτε πρόταση πραγματικής απομόνωσης χωρίς επιβεβαιωμένη τοπολογία + επιτόπιο έλεγχο.
5. Τα αβέβαια αποτελέσματα εμφανίζουν UNKNOWN / UNVERIFIED, έκδοση δεδομένων και confidence. Ούτε AI ούτε χάρτης υπόσχεται GNSS ακρίβεια 15 cm χωρίς εξοπλισμό, κατάλληλο γεωδαιτικό datum/RTK και επαλήθευση.
6. Ασφάλεια προσωπικών δεδομένων/κρίσιμης υποδομής: private layers, least privilege, founder/admin governance, encryption, retention, audit, immutable backups, network segmentation και restoration drills.
7. Το DONE απαιτεί IMPLEMENTED → AUTOMATED TESTS PASS → DEPLOYED → REAL USER JOURNEY VERIFIED LIVE → RECOVERY TESTED. Κανένα πρότυπο/κώδικας/CI smoke test μόνο του δεν αποτελεί DONE.

## Β. Read-only production baseline (2026-10-08)
- Supabase ACTIVE_HEALTHY `cxhulvwkagzufbjsdwwu`: `pantavion_cyprus_streets` 508 οδοί: 164 με district/municipality `Lemesos`, 344 `Lefkosia`; 0 με non-null geometry; 0 με non-null center; 0 με linked place_id. 508 postal-name `VERIFIED`, **όχι γεωγραφικά επαληθευμένες**.
- `pantavion_cyprus_addresses`: 0. `pantavion_cyprus_places`: 9 (3 locality candidates: Αγία Φύλα, Καντού, Παλώδια — PENDING_REVIEW; λοιπά districts).
- `pantavion_cyprus_registry_ingestion_state`: DLS roads/admin/addresses READY αλλά 0 seen; Cyprus Post partial imports. Χωριά και όρια δεν έχουν εισαχθεί σε πλήρη επίσημη ιεραρχία.
- GitHub `core/water/cyprus-street-registry-store.ts` χρησιμοποιεί `EmptyCyprusStreetRegistryStore`, το API `app/api/professional/infrastructure/water/streets/route.ts` δεν διαβάζει από actual registry. `core/water/cyprus-dls-road-search-adapter.ts` εκτελεί session-only query, όχι επίμονη canonical geometry.
- Αυθεντικό δίκτυο: protected lock `docs/requirements/pantavion-water-network-kernel-lock-v1.md`: 122857 αρχικά features, 120552 renderable, 2305 preserved non-renderable. DB έχει `water_gis_features` 122857, `water_network_edges` περίπου 120552, `water_network_nodes` 0: η τοπολογία δεν έχει αποδειχθεί πλήρης.
- Υπάρχει κώδικας `water-isolation-service.ts`, `water-postgis-topology-provider.ts`, `water-epanet-model-export.ts`, `water-hydraulic-http-engine-adapter.ts`, `services/water-engineering-worker/worker.py`, `water-technology-registry.ts`, και smoke CI. Δεν έχουν επαληθευτεί όλα end-to-end παραγωγικά.
- Render services: `pantavion-planet` main Free, `pantavion-water-engineering-worker` main Free, `pantavion-auth-staging` dedicated branch Free. Main `d8c4afd079c7a413200edd47c03295968017743b` live deployment 2026-10-07 14:18Z; engineering worker live report 2026-10-01 14:21Z on earlier commit, compatibility/uptime/health still unchecked.

## Γ. Functional specification — Pantavion Water, όλα τα υποσυστήματα
### P0 / λειτουργική ασφάλεια
1. Χάρτης Α: αυθεντικό δίκτυο, γρήγορη φόρτωση zoom/pan, χωρίς 300m hard limit, bounds-based vector-tile/feature loading, αναζήτηση ελληνικά/αγγλικά/Latin/Greeklish, GPS, εργασία χωρίς σύνδεση με scoped offline cached map.
2. Founder/admin αδιάκοπη εξουσιοδοτημένη πρόσβαση, κανονικοί εργαζόμενοι/τεχνίτες/επιστάτες/επιθεωρητές, αναγνώριση εγκεκριμένης συσκευής, password reset και verification με πραγματική email delivery. Fail closed για μη εξουσιοδοτημένους χωρίς founder bypass του audit.
3. Fault work order: φωτογραφία/βίντεο/σημείο, προτεραιότητα, βλάβη, τοποθεσία, πρόσβαση συνεργείου, 2-person team, ανάθεση, εργολάβος/εκσκαφέας, χρόνοι εργασιών, έγκριση, έλεγχος, reopen, ιστορικό.
4. Εκσκαφή: μήκος/πλάτος/βάθος, επιφάνεια (άσφαλτος/χώμα/πλακόστρωτο), αυτόματα m³ με σαφή μονάδα και στρογγυλοποίηση, προϋπολογισμός, φθορές και αποκατάσταση.
5. Υλικά: τύπος αγωγού, διάμετρος mm/in, ποσότητες, fittings, δικλείδες, επιστροφή/αποθήκη, παραλαβή; αντικατάσταση υδρομέτρου με παλιό/νέο serial, παλιές/νέες ενδείξεις, φωτογραφίες, υπογραφές και audit.
6. Ενιαία GIS evidence library: DWG/DXF/KMZ/KML/GeoJSON/PDF/εικόνες, φωτογραφίες geotag, κτηματολογικά στοιχεία όπου επιτρέπεται, versioning και source provenance ανά asset και περιοχή. Τυχόν νέα σύνδεση/βάνα/αγωγός πρώτα σε προτεινόμενο overlay με ιδρυτική έγκριση.

### P1 / Spatial, network engineering & operations
7. ΟΛΟΚΛΗΡΗ επαρχία Λεμεσού (πόλη, 4 νέοι δήμοι/δημοτικά διαμερίσματα, κοινότητες, χωριά, συνοικίες, ενορίες), χωρίς τεχνητό cap 88/90 — επίσημο CYSTAT 2026 + DLS polygons και audit coverage. Μετά όλες οι άλλες επαρχίες.
8. Επίσημες οδοί με πραγματικά LINESTRING/MULTILINESTRING, ακριβή labels/el-en/aliases και street IDs, γεωγραφική περιοχή, ταχυδρομικό κώδικα, πραγματικά address points όπου τεκμηριώνονται. Unnamed tracks και νέοι δρόμοι ως διαφορετικές κατηγορίες. Δεδομένα από Cyprus Post και DLS μόνο σύμφωνα με άδειες/permissions.
9. Συνεχής εισαγωγή change feed / daily eligible checks, εβδομαδιαία full reconciliation, backoff, checkpoint, no data loss, monitoring stale runs, human approval για field proposals, μετά index/vector-cache refresh ανά Map A/B/C/D/E. Οχι αυτόματη μετονομασία ή overwrite verified geometry.
10. Network connectivity: nodes-junctions/edges, fitted valve positions/diameter/material/elevations, isolation trace, direction and alternate supply, affected service connections and meters, pressure zones/DMAs. Until graph complete show "NOT VERIFIED: NO OPERATIONAL ISOLATION RECOMMENDATION."
11. Map B/DWG source proof, Map C terrain/elevation/engineering; Map D managerial/elevation/pressure; Map E duplicate/reference where approved. Canonical source functions independently from visual layouts; no arbitrary renames.
12. Υδραυλικά μοντέλα EPANET 2.2/WNTR: pressure, energy/head losses, water age/quality, reservoirs, pumps, PRV settings, real sensor calibration; validate elevations roughness pipe age/demand curves; scenario outputs versioned, NEVER treated as measured facts.
13. Asset management: lifetime, repairs, age/material, inspection condition, failure risk, contractors, preventive maintenance schedules, approved asset improvement plans, criticality and capital budgets.
14. Monitoring & IoT: pressure/flow/tank level/quality/smart meters + clock accuracy, ingestion checks, sensor calibration, anomaly detection, trusted data, adapter to OGC SensorThings API; SCADA read-only pilot and secure OT segmentation first.
15. Leakage NRW: DMA water balance, minimum night flow, leak analytics, acoustic sensors/loggers and targeted field confirmation, priority queues, pressure management, smart AMI/AMR; track monetary and water recovery, with independent audits.
16. Water quality & incidents: lab samples, chain of custody, residual chlorine, microbiological alerts, turbidity, public health authority protocols, simulation quarantine, field sampling approvals, emergency communication.
17. Digital field surveys: GNSS RTK for sub-meter / ~15cm precision where validated; signal quality, confidence radius, height datum and photo evidence. Radar/GPR/satellite/thermal/drone only as candidate research; never claim exact buried asset location.
18. Customer/citizen workflows: accessible fault submissions, secure sanitized outage statuses, approved message recipients, new connections applications, building/service meters and deterministic billing interfaces where authorized. Private pipe GIS never public.
19. Business modules: workforce roster, leave/on-call, planned maintenance, dispatch escalation, inventory and procurement, regulated tender records, supplier performance, duty of care, local legal compliance, financial project reporting.

## Δ. Διεθνή πρότυπα και λειτουργικά παραδείγματα — 7 ήπειροι
Οι παρακάτω είναι τεκμηριωμένες **ιδέες/λειτουργικές πρακτικές** και όχι ισχυρισμός συνεργασίας ή δικαίωμα αντιγραφής proprietary λογισμικού.
- **Ευρώπη — Πορτογαλία, EPAL/WONE:** district metered areas, continuous pressure & flow analysis και leak crew prioritisation. EPAL αναφέρει μη τιμολογούμενο νερό 23,5% (2005) → 8% (2015). https://www.epal.pt/EPAL/en/menu/products-and-services/wone
- **Ασία — Σιγκαπούρη, PUB:** smart meters και acoustic leak loggers με ανάλυση παλμών, επιβεβαίωση και επέμβαση. Το PUB αναφέρει 1500 permanent leak sensors. https://www.pub.gov.sg/Resources/News-Room/PressReleases/2025/02/Keeping-Singapore-potable-water-pipe-network-in-good-order
- **Αφρική — Κέιπ Τάουν:** pressure management zones, District Metered Areas, προληπτική ανίχνευση, ανανέωση μετρητών και προστασία περιόδων ξηρασίας. https://web1.capetown.gov.za/web1/newsandnotices/Home/Release/Long-term-Water-Conservation-and-Water-Demand-Management-WC-WDM-Strategy-2025
- **Βόρεια Αμερική — ΗΠΑ/EPA:** EPANET 2.2 open model for pipe pressures, pumps, tanks, water age and contamination simulations; risk and cybersecurity guidance. https://www.epa.gov/water-research/epanet
- **Νότια Αμερική — Χιλή / Aguas Andinas:** 24/7 central control, acoustic, satellite *screening* and tracer gas complemented by field verification. https://www.mop.gob.cl/ministro-moreno-ante-grave-situacion-hidrica-tenemos-que-sumar-todos-los-esfuerzos-para-hacer-el-mejor-uso-del-agua-disponible/
- **Ωκεανία — Sydney Water:** multi-provider acoustic loggers, leak probability triage, manual on-site confirmation, repaired leakage feedback loop. https://www.awa.asn.au/resources/latest-news/business/assets-and-operations/enhancing-sydney-waters-leak-prevention-through-acoustic-monitoring
- **Ανταρκτική — Australian Antarctic Program:** aboveground heat-traced reticulated utilities, reverse osmosis/seasonal storage and resilience under isolated/low-resource conditions. https://www.antarctica.gov.au/antarctic-operations/stations-and-field-locations/amenities-and-operations/site-services/
- **Διαλειτουργικότητα:** OGC SensorThings open sensors+observations model https://www.ogc.org/standards/sensorthings/ ; public-domain EPA EPANET. Εξετάζεται και ISO 55001 για asset governance, IEC 62443 for OT, ISO 27001 cybersecurity όπου κατάλληλο/αδειοδοτημένο.

## Ε. Αρχιτεκτονική «Pantavion owns everything»
Source adapters → Staging & provenance → Quality gates & licensed-use checks → Founder/authorized approvals → PostgreSQL/PostGIS canonical data → Feature & vector tile service + search → Protected user map views A–E and work orders.
Separately: Telemetry gateway (MQTT/OPC-UA adapters via secured DMZ) → time-series storage → anomalies → actionable human-reviewed incidents.
Separately: network graph validation → scenario export → isolated EPANET/WNTR worker → versioned derived results and confidence/caveats → engineering approval.
All three flow through Pantavion Orchestrator (schedules, durable queues, idempotency, retry, audit, role/entitlement checks, anomaly alerts). Independent provider adapters must be replaceable with contract tests.

## ΣΤ. Μόνιμη λειτουργία και πραγματική ανθεκτικότητα
- Pantavion native scheduled tasks (not a request requiring ChatGPT to stay active): daily allowed source updates, event-based intake, weekly global reconciliation, monthly innovation/standards review; alerts for stale checks/errors and unauthorized changes. Idempotent resume from last cursor.
- Production resilience target to be approved with budget: minimum two application instances with load balancing, health checking, independent backup of immutable masters/media/database, 3-2-1 backup protection with a separately secured location, PITR where supported, scheduled restore drills, documented RPO/RTO/SLO, full monitoring, rollback and disaster recovery.
- Under offline conditions: **encrypted, expiring, authorized per-user/device offline cache**, bounded to permitted zone/data; queue reports with local IDs and merge conflicts, resync when connected. Do not cache full water master on public device or promise real-time data without connection.
- No zero-downtime guarantee from a single Free instance or from a cached map. Migration to paid/HA infra needs cost assessment and explicit owner approval; no provider switching without permission.

## Ζ. Κενά: άμεσο επιχειρησιακό backlog και acceptance gates
**G0 — protect & observe**:
1. Export/verify snapshots of Master A, map source hashes, DB backup state, artifact storage, restore proof.
2. Check actual Pantavion URL, Render main commit, health endpoints, live auth, device and user access, baseline GIS tiles and fault workflow. Freeze the known-good network while fixing basemap.
3. Inspect graph `water_network_nodes` (0) and edges as potential *invalid topology*. Run validation; do not expose valve-close advice before trace complete.
**G1 — daily workers**:
4. Replace empty street registry store with properly authenticated DB-backed implementation; resolve data licensing; import official road lines and all Limassol village admin codes; verify geometry/name/postcode, navigation and real pan/zoom.
5. Build reliable safe Map A field work form: fault, crew, excavation, materials, meters, approvals, photos, history and offline queue. Confirm work order persists and permissions.
6. GPS geodetic QA and no invented 15cm capability; invalid name/number failures must surface unverified state.
**G2 — engineering**:
7. Hydraulically-valid source data, EPANET/WNTR smoke+live test, real sensor calibration, network topology, engineering review.
8. SCADA/telemetry/read-only flows with isolate network and security; water loss DMA leak pilot.
**G3 — scale**:
9. Backup replica & failover pilot; RPO/RTO restore drill, canary regression A–E, performance by device/network, automatic service alerts.
10. Monthly all-continent water tech review with evidence/provenance, licensing, cost/ROI, founder decisions and additive implementation under tests.

## Η. Acceptance KPIs (targets, NOT achieved)
- Communities/district polygons: exact 2026 CYSTAT/DLS total coverage.
- Named streets: source-documented counts per community, geometry %; NEVER state 100% without complete authoritative denominator.
- Street search: verified el/en/Greeklish queries and road navigation; address number false positives = 0 in acceptance set.
- Map A: original pipes+valves match protected baseline hashes, user moves beyond prior 300m radius and returns correct viewport-loaded data.
- Isolation: 100% blocked until topological source graph passes required safety rules; verified isolation scenarios only with human approval.
- Worker jobs: all field forms persist, attach evidence, sync once, audit each correction, role checks and signed approval.
- Backup: successful full restore and repeatable controlled failover tests; vendor outage scenario with documented remaining functionality.
- Exact current operator dashboards needed: source last check, ingestion status, spatial completeness, traces failing, maps working, worker job failures, release verification.

## Θ. Execution order and governance
RECOVER → CLASSIFY → PROTECT MASTER → LINK AUTH/ROLES → IMPORT LICENSED GEO DATA → VALIDATE CONNECTIVITY → IMPLEMENT FIELD WORKFLOWS → QA & TEST → DEPLOY ONLY WHEN AUTHORIZED → VERIFY LIVE → CONTINUOUS MONITOR & IMPROVE.
Record per item: task owner, code/test artifact, source/provenance, migration/rollback, data protection, release commit, production URL, live evidence, defect tracking. No vague DONE.
Related GitHub issues: #600 (first 17 localities) / #601 (permanent Limassol-wide road watch).

**IMPORTANT:** Writing this program in the branch is durable requirements capture. Deployment, database changes, ongoing source polling and scheduled real research will only exist after separate implementation/testing.