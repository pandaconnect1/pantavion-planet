# Pantavion Water — Global Completion Masterplan
**Issued:** 2026-10-08 · **Owner:** Pantavion Founder · **Scope:** full Limassol District, then all Cyprus; international reusable water utility platform · **Status:** AUDITED AND SPECIFIED; NOT VERIFIED LIVE.

## Non-negotiable operating principles
- PANTAVION_FIRST: Pantavion controls canonical data, rules, permissions, versioning, long-term knowledge and workflows; outside GIS, telemetry, AI and hydraulic engines are replaceable adapters.
- ZERO_DELETE: preserve all raw Map A/B/C/D/E, KML, KMZ, DWG, historical streets, versions, field evidence and original sources, with immutable hash and separate derived layers. Never silently overwrite authentic network geometry.
- SAFE_WATER: advisory/simulation first. NO remote SCADA command, automatic pressure change, pump/valve actuation or unsafe closure recommendation from incomplete topology. Qualified human approval, two-person safety checks, validated valve states, field SOP and fail-closed permissions required.
- FOUNDER_APPROVAL: new/modified official road maps, street and network records from field contributions require founder/admin-controlled review, audit, publish and rollback. Never silently promote external data.
- DATA_NOT_GUESSED: each road, valve, pressure, altitude, address number, tank, pipe diameter, property, GPS accuracy and safety prediction carries source, date, quality, uncertainty and coordinates when real. MISSING stays missing.
- SECURITY: private maps, device-bound approved users, role-based maps, backups encrypted, RLS, immutable audit, no secrets in GitHub, anti-lockout founder access with secure break-glass process—not a security bypass.
- LIVE means IMPLEMENTED → INTEGRATED → TESTED → DEPLOYED → PRODUCTION VERIFIED with evidence; contracts/blueprints/tests alone do not qualify.

## Verified baseline (2026-10-08, Supabase production read-only audit)
- `water_gis_features`: 122,857 Map A features including 120,552 pipe objects; `water_map_a_full_status` records 122,857 placemarks, no reported altered original geometry/coordinates.
- `water_network_edges`: 120,552 edge rows; **0 have BOTH from_node_id and to_node_id**; `water_network_nodes`: 0 rows. Import records 11 invalid geometries, topology pending. **Hydraulic isolation and exact valve traces cannot be declared authoritative yet**.
- `pantavion_cyprus_streets`: 508 postal-evidence verified *names* (164 district Lemesos, 344 district Lefkosia), **zero** stored line geometries, centers or linked localities. `pantavion_cyprus_places`: 9; `pantavion_cyprus_addresses`: zero.
- Source `core/water/cyprus-street-registry-store.ts` returns an empty list irrespective of 508 database rows; this is an integration break to repair with secure live-backed read and coverage checks.
- The Render `pantavion-planet` main deployment at commit d8c4afd was live (2026-10-07); `pantavion-water-engineering-worker` deployment live at commit 8db2ef0 (2026-10-01). Both provisioned Free. This does **not** prove HTTP uptime, complete UI, production simulations, automatic restart, backups, RTO or successful fault navigation.
- Code includes WNTR/EPANET worker, model exporter, engineering evidence and governance contracts, OGC SensorThings adapter and tests. Reuse/complete instead of duplicating.

## Modules and definition of done
| ID | Priority | Module | Done only when |
|---|---|---|---|
| W00 | P0 | Data preservation and disaster recovery | raw sources hashed; off-provider encrypted tested backups; PITR where available; documented restore drill; RPO/RTO agreed; two-zone failover design tested |
| W01 | P0 | Identity/roles/mobile entry | founder/admin & approved workers access verified across devices, login/reset/verification, offline revocation behavior, secure approvals |
| W02 | P0 | Protected Map A, B, C, D, E | approved user's map and native water overlays load reliably; street navigation pans all geographic extents; 2–3 km cap removed or transparently scoped; 15cm claims only with qualified GNSS evidence |
| W03 | P0 | Cyprus road/place registry | all current Limassol administrative codes & villages, real DLS/legally permitted street line geometry and full place-to-road hierarchy; multi-language street/number search; daily delta job and rollback; detailed issue #600/#601 |
| W04 | P0 | Topology and isolation safety | valid junctions for all model-relevant lines, verified connection exceptions, surveyed valves, trace confidence; professional validation before any valve closure guidance |
| W05 | P0 | Incident/work order lifecycle | fault→triage→crew assignment→navigate→excavate→parts→times→photos→repair→testing→restoration→approval→closure, fully tested on Xiaomi/Android offline |
| W06 | P0 | Offline-first field operation | encrypted per-user bounded offline maps/assignments, durable queues, conflict-safe idempotent sync, expiry/revocation and on-device secret protection |
| W07 | P1 | Network asset inventory / CMMS | valves, pipes, meters, PRVs, hydrants, pumps, tanks, age/material/diameter/condition, genealogy, service & failure history; inspection scheduling |
| W08 | P1 | Hydraulic digital twin | real data→GIS topology→EPANET 2.2/WNTR scenario solver→field calibration pressure/flow/demand/elevation; uncertainty and missing-evidence blockers exposed |
| W09 | P1 | Leakage and NRW | DMAs, IWA-standard mass balance, night flows, leak events, acoustic logger integration, repair validation, volumes and € savings with explicit assumptions |
| W10 | P1 | Telemetry/SCADA/IoT read-only | site-specific secure adapter to OGC SensorThings/MQTT/OPC UA/Modbus via segmented gateway as licensed, timestamp/timezone/calibration quality, alarming, stale-data warnings |
| W11 | P1 | Water quality / water safety | chlorine, turbidity, microbiology lab records, sample chain-of-custody, risk plan, boil advisory approvals, event thresholds set by competent utility/public authority |
| W12 | P1 | Smart-meter / customer service | replacement old/new serial/readings/photos/coordinates, AMI consumption, leak and tamper events, consumption analysis, complaints/outage alerts, billing integration after data reconciliation |
| W13 | P1 | Hydraulic zones, pump & energy | elevation, tanks, PRV/pressure zone modeling, calibrated energy costs, pump scheduling recommendations, demand scenarios; **no unattended actuation** |
| W14 | P1 | Materials / contractors / excavation | width/depth/length and surface type; m3 volume, parts/diameters/quantities, labor hours, procurement, contractor safety and sign-off, inspection traceability |
| W15 | P1 | Security, observability, governance | SLO dashboards, automated API/UI/map checks, backup results, vulnerability & dependency scans, private network + OT segregation, audit and alerts |
| W16 | P2 | Predictive renewal & priority | condition/failure probabilities with defensible history, consequence & criticality, explainability, capital replacement candidates, no unsupported probabilities |
| W17 | P2 | AI evidence research & learning | global source registry, citation/rights/version checking, researcher→human review→implementation issue→test→deploy loop, hallucination rejection |
| W18 | P2 | Weather/climate/emergencies | drought, wildfires, emergency tank deliveries, critical facilities, seismic and resilience response and distribution scenarios |
| W19 | P2 | Additional smart data | remote sensing and satellite leak candidate validation; GNSS RTK RTN surveys when 15cm operational accuracy required; drone/camera assisted asset inspection subject to law |

## International evidence from seven continents
**These are transferable examples, not claims that Pantavion currently implements them.** Adapt workflows and published concepts, NOT proprietary code, maps, private datasets, branded UI or copyrighted manuals.

1. **Asia — Singapore PUB:** smart metering with customer portal, high consumption and leak notifications; concept: AMI adapter, leak alerting and customer visibility. https://www.pub.gov.sg/Public/KeyInitiatives/Smart-Water-Meter
2. **Europe — Netherlands Vitens:** sensor-driven supply, leak detection, open data and predictive analytics; concept: interoperable telemetry and quality evidence. https://www.vitens.nl/Over-Vitens/Maatschappij/Waterbedrijf-van-de-toekomst
3. **North America — New York DEP (USA):** digital work orders/CMMS & acoustic surveys; independent 2025 audit identifies deficient *coverage* of planned inspections; concept: expose surveyed% and missed DMA coverage, not false success. https://comptroller.nyc.gov/reports/audit-of-the-new-york-city-department-of-environmental-protections-leak-detection-program/
4. **South America — IDB / Brazil AEGEA case:** water utility digital twin integrating GIS, SCADA, hydraulic models, customer data; concept: digital twin only after calibrated utility ground truth. https://publications.iadb.org/en/digital-journey-water-and-sanitation-utilities-latin-america-and-caribbean-what-stake-and-how-begin
5. **Africa — Cape Town:** proactive leak detection, pressure management, meter renewal and conservation strategy; concept: NRW pressure zone modules and conservation reporting. https://web1.capetown.gov.za/web1/newsandnotices/Home/Release/Long-term-Water-Conservation-and-Water-Demand-Management-WC-WDM-Strategy-2025
6. **Oceania — Sydney Water:** large scale smart metering, hourly reading and customer leak alerts; concept: staged AMI integration and anomaly monitoring. https://www.sydneywater.com.au/accounts-billing/reading-your-meter/about-your-meter/smart-meters.html
7. **Antarctica — Princess Elisabeth Research Station:** water supply from melted snow with sophisticated water recycling; concept: resilience, energy-water nexus, reuse monitoring (not an urban drinking-water network blueprint). https://www.antarcticstation.org/station/water_treatment

Additional reference frameworks: EPA EPANET https://www.epa.gov/water-research/epanet ; OGC SensorThings https://www.ogc.org/standards/sensorthings/ ; WHO water safety planning https://www.who.int/publications/i/item/9789240067691 (commercial rights check); AWWA cyber security https://www.awwa.org/resource/cybersecurity-guidance/ ; EPA asset inventory https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100OAJD.TXT .

## Pantavion-owned permanent change lifecycle
1. Schedule resilient internal workers (separate from the ChatGPT research reminder); official sources are polled at permitted cadence; use ETag/source revision/delta pagination, stable checkpoint and exponential retries; stale feed produces alerts.
2. Ingest into immutable source snapshots with provenance/license/source timestamp/hash and geometry normalization; compare by code + location + geometry; quarantine ambiguous/no-rights data.
3. Human/authorized rules verify roads and pressure/field reports. Approve; version; publish to canonical spatial DB and bounded offline indexes/maps; refresh cached vector tiles and search; invalidation confirmed by synthetic device.
4. Cross-map propagation A/B/C/D/E must not touch water master or weaken map access; any failure automatically reverts view/index publication while preserving evidence.
5. Alert admin when freshness SLA exceeded (default proposed: daily check, weekly full recon; actual cadence depends on sources). Delivery guarantees require a paid or otherwise proven resilient hosting setup—not current Render Free.
6. Maintain dashboard with coverage of all Limassol localities (authoritative contemporary CYSTAT/DLS definitions), geocoded roads / named roads, accurate GPS evidence, active queues, open fault age, topology%, downtime, backups/restore, pending official approvals, water loss (measured), anomaly false positives, global research reviews.

## Sequence (strict)
**P0-A:** preserve/backup + prove exact live build/health; **P0-B:** secure users/devices and map visibility; **P0-C:** complete roads, places and navigation; **P0-D:** build and validate topology, valves and isolation quality; **P0-E:** live field work-order workflow, offline device tests; **P1:** meter / CMMS / DMA / calibrated hydrology / telemetry / water quality; **P2:** predictive analytics and innovations with evidence.

**Go/no-go:** No 'complete' status before integration tests, authorized sourcing and licensing, end-to-end mobile test, deployed URL, reproducible evidence & founder approval. Zero deletions, no hidden secrets, no public water network export.
