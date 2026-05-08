# Pantavion Professional Infrastructure / Water Network — Master Production Requirement

## 0. Founder Control And Activation Lock

This document defines the complete production requirement for Pantavion Professional Infrastructure / Water Network.

Nothing in this document activates the module by itself.

No real infrastructure data, no real KMZ/KML/GIS/CAD/DWG/DXF file, no consumer data, no staff data, no contractor data, no accounting data, no telemetry data, no utility data, and no operational map layer may be exposed, deployed, imported, published, exported, or made available without explicit founder authorization.

Allowed activation commands must be direct and clear, such as:

- ΞΕΚΙΝΑ
- ΒΑΛΤΟ ΜΕΣΑ
- ΠΕΡΑΣΕ ΤΟ ΣΤΟ PANTAVION
- ACTIVATE THE INFRASTRUCTURE MODULE

Until then, this file is a locked production requirement.

GitHub stores code and requirements.
Private protected storage stores real infrastructure files.
Pantavion shows the protected processed map through authenticated access.

---

# 1. Core Identity

Module name:

Pantavion Professional Infrastructure

First production domain:

Water Network / Ύδρευση

Purpose:

A protected professional infrastructure operations system for real water-network organizations, field crews, supervisors, engineers, designers, warehouse, accounting, contractors, telemetry, management, and director oversight.

This is not a public social feature.
This is not a static map.
This is not a generic admin panel.
This is not a simple file viewer.
This is not a boring dashboard-first module.

It is a protected, map-first, mobile-first, production-grade GIS/CAD-style operational system.

The map is the center.
The real water network is the product.
All jobs, reports, workers, materials, contractors, accounting, telemetry, plans, approvals, and analytics connect back to real infrastructure assets.

---

# 2. Phase 1 Production Priority

Phase 1 must focus on the most important operational goal:

An authorized worker, technician, supervisor, or engineer must be able to open Pantavion from mobile, tablet, or PC, find the required point, and immediately see the real water network, pipes, valves, service connections, central mains, meters where available, fittings, and related technical evidence.

Phase 1 must not be distracted by advanced accounting, full warehouse, full telemetry, advanced AI analytics, or multi-utility expansion before the live protected map works.

Phase 1 must include:

- protected login
- role-based map access
- private real network import
- private storage of original real files
- protected conversion into optimized map layers
- mobile-friendly map viewer
- tablet-friendly map viewer
- desktop-friendly map viewer
- search by official address
- search by incomplete address
- search by road
- search by area
- search by coordinates
- search by asset ID
- search by valve ID
- search by pipe ID
- search by service connection ID
- search by meter ID where available
- search by Pantavion Technical Address
- GPS/current location
- GSM/cell approximate location fallback
- manual map selection
- Take Me There workflow
- layer controls
- asset details on tap/click
- basic technical evidence window
- no raw KMZ/KML/GIS download for normal users
- audit log for access and sensitive actions
- basic offline/weak-signal support

Phase 1 acceptance criteria:

1. The real protected network can be imported privately.
2. The original file remains private and locked.
3. The processed map opens in Pantavion.
4. The map opens first after authorized entry.
5. The map works on mobile, tablet, and desktop.
6. A user can search and locate a point.
7. A user can view pipes, valves, mains, service connections, meters where available, and related assets.
8. A user can tap/click an asset and view details.
9. Missing/unregistered address scenarios work through technical address and asset search.
10. Normal users cannot download raw KMZ/KML/GIS files.
11. Basic offline/weak-signal behavior exists.
12. Access and sensitive actions are audit logged.

---

# 3. Real Network Is Essential

The module has no practical value without the real water-network map and real infrastructure data.

Real KMZ/KML/GIS/CAD-derived files are essential.

The restriction is not against using real files.
The restriction is against unsafe exposure.

Forbidden:

- public GitHub storage of real network files
- public frontend bundle
- `/public` folder
- unrestricted browser access
- permanent public download URL
- uncontrolled sharing
- unauthorized export
- raw file access for normal users

Required real network flow:

1. explicit founder authorization
2. private upload of real KMZ/KML/GIS/CAD-derived file
3. protected private storage
4. checksum and source registration
5. quarantine and validation
6. geometry and layer extraction
7. conversion into optimized protected map layers
8. mobile/tablet/PC friendly rendering
9. role-based access
10. audit logging
11. original file preserved as locked read-only source
12. official version history
13. comparison with Pantavion edits when new official files arrive

---

# 4. Private Upload Instead Of GitHub

Real water-network files must be used through private upload/private storage, not GitHub.

Development flow:

- authorized local files may be placed in a git-ignored folder:
  private-infrastructure/water-network/original/
- this folder must never be committed
- local scripts may read it only for authorized development/testing

Production flow:

- real files are uploaded through protected Pantavion admin/import page
- example route:
  /professional/infrastructure/water/import
- requires authenticated user, authorized role, audit log, validation, private storage, version registration

Allowed protected storage models may include:

- private object storage bucket
- private database-backed storage
- private server storage
- encrypted storage provider
- organization-controlled secure storage

Storage must support:

- private access
- role-based permission checks
- signed temporary access where needed
- encryption in transit
- encryption at rest where possible
- audit logs
- file/object versioning
- backup and recovery
- access revocation

Normal users see the map, not the raw original file.

---

# 5. Map-First Doctrine

After authorized access, the first screen must be the live protected water-network map.

First screen must show:

- real protected base map
- official water network
- pipes
- central mains
- valves
- service connections
- meters where available
- fittings where available
- user location
- search
- layers
- asset details
- assigned point/job where applicable
- sync/offline status
- technical evidence access

Not first:

- boring dashboard
- static cards
- hidden map
- generic admin panel
- raw file viewer
- fake buttons

The system must feel alive, visual, operational, fast, and professional.

---

# 6. Lightweight Cross-Device Map

The water-network map must open quickly and reliably on:

- Android phones
- iPhones
- Android tablets
- iPads
- laptops
- desktop PCs
- modern browsers
- installable PWA mode where appropriate

The system must not load huge raw KMZ/KML/CAD/DWG/DXF/GIS files directly into the mobile frontend.

Large official files must be processed privately into optimized protected layers.

The map should support:

- progressive loading
- visible-area loading
- zoom-based detail
- layer toggles
- low-data mode
- spatial indexes
- vector tiles or protected tile services where appropriate
- simplified GeoJSON only for small controlled areas
- server-side preprocessing
- controlled mobile memory use

At low zoom show:

- main network
- central mains
- major areas
- important fault zones

At high zoom show:

- valves
- service connections
- meters
- fittings
- pipe labels
- diameters
- depths
- technical evidence
- job markers
- photos where authorized

---

# 7. Offline Mobile And GSM/Cell Location

The system must support real field conditions.

It must work when internet is weak, unstable, or unavailable.

Offline mode should support:

- cached assigned jobs
- cached permitted map areas
- cached relevant water-network layers where legally and technically allowed
- fault registration
- job updates
- photo capture
- material registration
- worker hours
- excavation measurements
- notes
- local timestamps
- local device location where available
- pending sync
- conflict handling after reconnection

Sync states:

- local only
- pending sync
- synced
- sync conflict
- approved

No offline record may silently overwrite official data after reconnection.

Location sources:

- GPS
- assisted GPS
- GSM / cell tower location
- Wi-Fi positioning
- browser/device geolocation API
- manual map selection
- coordinate entry

The system must record location source and accuracy where possible:

- GPS ±5m
- Assisted ±30m
- GSM/Cell ±200m
- Manual
- Unknown

GSM/cell location is approximate unless confirmed.

Official technical placement must not rely only on low-accuracy GSM where precise placement is required.

Final official location should be confirmed by:

- GPS with acceptable accuracy
- technician manual placement
- snapping to existing network geometry
- approved survey/GIS/CAD source
- supervisor approval
- field verification
- imported official plan

Offline cached infrastructure data must respect permissions, expiry, encryption where possible, logout protection, device loss risk, remote revoke, and no unrestricted export.

---

# 8. Protected Access For Colleagues

Authorized colleagues access the system through Pantavion, not through raw KMZ/KML/GIS files.

Access method:

- Pantavion login
- approved account
- role-based permission
- optional PIN / 2FA / step-up verification
- approved organization/team
- approved device where required
- audit log

Normal experience:

protected login
→ role check
→ protected map viewer
→ permitted layers and tools only

Default users must not:

- download original KMZ/KML
- download CAD/GIS source files
- access private storage directly
- open permanent raw URLs
- export full network datasets
- copy full infrastructure package
- share unrestricted links
- bypass Pantavion viewer

No system can fully stop someone photographing a screen with another device, so protection must combine:

- least-privilege access
- no raw file exposure
- watermarking
- audit logs
- export restrictions
- legal terms
- access revocation
- incident investigation

---

# 9. Anti-Copy And Defensive Security

Pantavion must protect against copying, leaks, scraping, brute force, suspicious exports, and unauthorized access.

Repository protection:

- no real KMZ/KML/CAD/DWG/DXF/GIS files in public repo
- no real infrastructure data in frontend bundle
- no raw files in `/public`
- no permanent public URLs
- demo data must be fake/anonymized/reduced

Application security:

- authentication
- RBAC
- tenant/organization separation where needed
- audit logs
- rate limits
- secure headers
- session/device checks
- download restrictions
- export permissions
- admin approval for sensitive exports
- IP/device/session blocking where appropriate
- step-up authentication for suspicious actions

If suspicious activity occurs, the system may:

- block account
- revoke sessions
- revoke tokens
- force password reset
- require 2FA
- block/rate-limit IP/device/session
- disable exports
- quarantine suspicious changes
- alert founder/admin/security
- preserve forensic logs
- create incident report
- require manual review before restoring access

Forbidden:

- malware
- spyware
- ransomware
- trojans
- worms
- hack-back
- destructive counterattack
- revenge software

Only lawful defense: block, log, alert, revoke, preserve evidence.

Exports/reports should support:

- visible watermark where suitable
- invisible fingerprint where feasible
- user ID metadata
- organization metadata
- timestamp
- reason for export
- export log
- download log
- expiring links
- revocable links

---

# 10. Roles

Production roles may include:

- Founder/Admin
- Director
- Executive Engineer
- Technical Engineer
- Designer / Drafting
- Chief Supervisor / Αρχιεπιστάτης
- Assistant Chief Supervisor / Βοηθός Αρχιεπιστάτη
- Supervisor / Επιστάτης
- Technician / Τεχνίτης
- Field Worker / Εργάτης
- Helper / Βοηθός
- Warehouse Officer
- Accounting
- Contractor
- Excavator Driver
- Viewer

Each role sees only what is needed.

Field Worker:

- assigned jobs
- permitted nearby map
- simple field instructions
- selected asset info
- start/end work
- photos
- notes
- offline/sync

Cannot:

- edit official network
- approve contractor quantities
- approve accounting
- export raw data

Technician:

- nearby network
- technical evidence
- fault/repair details
- materials used
- excavation dimensions
- proposed field corrections
- completion evidence

Supervisor:

- team jobs
- assign work
- verify evidence
- verify photos
- verify materials
- verify excavation dimensions
- verify contractor attendance
- verify worker hours
- approve field completion
- request correction
- route to designer/engineer/warehouse/accounting

Chief Supervisor:

- all field crews under responsibility
- approve significant field completions
- approve contractor field quantities before accounting
- approve worker hours before payroll/accounting export
- validate daily summaries
- escalate to engineer/director

Designer/Drafting:

- view assigned as-built updates
- open technical evidence
- view scans/photos/plans
- create candidate geometry
- update drafting records
- upload drawings
- register as-built details
- link plans to assets/jobs
- prepare official network candidates
- send for engineer approval

Technical Engineer:

- approve technical corrections
- review designer/as-built updates
- review conflicts
- validate geometry/attributes
- approve official technical records
- request field verification

Executive Engineer:

- oversee major projects
- approve extensions/replacements
- approve new development network intake
- approve official import candidates
- review conflict reports
- escalate to director

Warehouse:

- view material requests
- issue/return materials
- update stock after approval
- flag low stock
- link material usage to job/report

Accounting:

- review ready-for-accounting jobs
- compare invoices with approved quantities
- flag discrepancies
- mark invoice pending/approved/rejected
- request missing evidence
- export approved reports

Director:

- dashboard
- costs
- repeated faults
- workforce
- contractors
- material shortages
- major approvals
- strategic decisions

Founder/Admin:

- module activation
- access approval
- role assignment
- imports/exports
- security
- audit
- production rollout

---

# 11. Production Workflow

Every operational event must move through clear stages.

Possible statuses:

- New Report
- Technical Triage
- Assigned
- In Progress
- Waiting for Materials
- Waiting for Contractor
- Waiting for Excavation
- Waiting for Technical Review
- Waiting for Designer / As-Built Update
- Waiting for Supervisor Approval
- Waiting for Chief Supervisor Approval
- Waiting for Engineer Approval
- Ready for Accounting
- Accounting Review
- Director Review
- Closed
- Archived
- Official Network Update Candidate
- Officialized
- Rejected
- Needs Review

No major job, official network change, contractor payment, stock deduction, sensitive export, or accounting approval should bypass required workflow.

Typical flow:

Report/Fault
→ Technical Triage
→ Assignment
→ Field Work
→ Photos/Evidence
→ Materials
→ Excavation/Measurements
→ Supervisor Review
→ Chief Supervisor Review if required
→ Designer if network/as-built changed
→ Engineer if official technical change required
→ Warehouse if stock affected
→ Accounting if cost affected
→ Director if threshold/strategic
→ Closed/Archived/Officialized

---

# 12. Approval And Digital Responsibility

Approval is not a simple unchecked OK button.

Every approval must store:

- approving user
- approving role
- timestamp
- related job/report/asset
- previous status
- new status
- approval type
- approval comment
- evidence reviewed
- device/session reference where appropriate
- PIN/2FA confirmation where required
- audit log entry

Approval actions:

- Approve
- Reject
- Request Correction
- Escalate
- Send to Designer
- Send to Engineer
- Send to Warehouse
- Send to Accounting
- Send to Director
- Mark Ready for Accounting
- Mark Ready for Technical Review
- Mark Ready for Official Network Candidate
- Return to Field Crew
- Close
- Archive

Supervisor approval checks:

- map location
- before/during/after photos
- materials
- excavation dimensions
- surface restoration
- worker hours
- contractor presence
- excavator driver
- field notes
- missing evidence warnings

Correction request must include:

- missing item
- required action
- responsible team/user
- deadline where applicable
- comment
- returned status
- audit entry

Approval chain must be visible:

Technician submitted
→ Supervisor approved
→ Chief Supervisor approved
→ Designer updated as-built
→ Engineer approved technical change
→ Accounting reviewed cost
→ Director approved large payment
→ Closed/Archived

Delegation must be explicit, time-limited, role-limited, audit-logged, and revocable.

---

# 13. Department Routing

Route to Warehouse when:

- materials requested
- materials used
- materials returned
- stock deduction needed
- low stock detected
- material cost attached to job

Warehouse receives:

- job ID
- report ID
- material list
- quantities
- crew
- date
- approval status
- return status

Route to Accounting when:

- required evidence exists
- supervisor approval exists
- chief supervisor approval exists where required
- materials confirmed
- contractor quantities confirmed
- excavation/restoration quantities confirmed
- cost records ready

Accounting receives:

- approved cost package
- photo/evidence references
- quantities
- contractor data
- worker hours where authorized
- material usage
- invoice references
- approval chain

Route to Designer/Drafting when:

- new pipe installed
- service connection added
- valve added/replaced
- meter position changed
- network replaced
- geometry correction needed
- as-built update needed
- old plan/scan attached
- new development plan processed

Designer receives:

- job ID
- report ID
- map location
- field photos
- measurements
- depth
- fittings
- source notes
- scan/plan attachments
- required update type

Route to Engineer when:

- official geometry may change
- conflict exists
- depth/location uncertain
- major replacement occurred
- new development imported
- safety/public-service indication risk exists

Route to Director when:

- cost exceeds threshold
- recurring issue exists
- large contractor invoice exists
- serious replacement proposed
- repeated consumer complaints occur
- major import/version requires oversight
- policy decision needed

---

# 14. Official Network Versions And Reconciliation

The system must separate:

1. Official Network
2. New Official Import Candidate
3. Pantavion Local Edits
4. Pending Edits
5. Approved Edits
6. Officialized Edits
7. Conflicts
8. Archived Versions

The original official file remains locked/read-only.

When a new official file arrives:

1. upload to private quarantine
2. checksum and metadata
3. identify source/designer/date/project/file type
4. validate format
5. extract layers/geometries
6. detect coordinate system where possible
7. normalize geometry
8. validate topology where possible
9. compare current official network
10. compare Pantavion local edits
11. detect matches
12. detect new official assets
13. detect removed official assets
14. detect geometry differences
15. detect attribute differences
16. officialize matching Pantavion edits
17. preserve unmatched Pantavion edits
18. flag conflicts
19. produce import report
20. require approval
21. promote candidate to official only after approval
22. preserve previous versions

No local edit is deleted automatically.

Conflict actions:

- accept official
- keep Pantavion edit
- merge
- reject local edit
- request field verification
- request designer clarification

---

# 15. Supported Technical Inputs

The system should support controlled input of:

- KMZ
- KML
- GeoJSON
- Shapefile
- GeoPackage
- CAD-derived exports
- DWG through safe conversion workflow
- DXF through safe conversion workflow
- PDF plans
- Excel reports
- CSV reports
- scanned drawings
- photographed drawings
- field photos
- technician submissions
- as-built updates
- survey data where authorized

No technical file becomes official automatically.

---

# 16. Water Network Assets

Supported assets:

- pipes
- central mains
- valves
- stopcocks
- service connections
- water meters
- meter boxes
- fittings
- tees
- bends
- reducers
- couplings
- repair clamps
- chambers
- hydrants where applicable
- pressure zones where applicable
- affected areas
- repair points
- abandoned assets
- replaced network sections

Every asset must support:

- Pantavion asset ID
- official ID where available
- geometry
- coordinates
- layer
- type
- material
- diameter
- depth where available
- status
- source file
- source version
- created by
- approved by
- timestamps
- connected assets
- change history
- notes
- photos where allowed
- related jobs
- related reports
- related materials
- related costs

Example IDs:

- PIPE-000001
- MAIN-000001
- VAL-000001
- CONN-000001
- MTR-000001
- FIT-000001
- JOB-000001
- REP-000001
- MAT-000001

---

# 17. Precision Search, Address Gaps And Technical Address

The system must not depend only on official public addresses.

It must support:

- official address
- incomplete address
- road
- area
- unofficial road
- temporary road ID
- development area
- village/municipality
- coordinates
- asset ID
- pipe ID
- valve ID
- service connection ID
- meter ID
- report number
- job number
- Pantavion Technical Address ID

For unregistered roads, new developments, village expansions, plots, and missing street numbers, the system must use Pantavion Technical Address.

Pantavion Technical Address may include:

- technical location ID
- coordinates
- water-network asset ID
- pipe ID
- valve ID
- service connection ID
- meter ID
- development area
- plot/parcel reference where legally allowed
- road segment status
- technician-confirmed location
- source plan reference
- official version reference

The absence of an official address must not stop field work, reports, asset placement, job evidence, material registration, accounting review, or management oversight.

Road statuses:

- official
- unofficial
- pending official registration
- planned
- under construction
- private development road
- field-confirmed
- imported from technical plan
- archived/replaced

When official address later exists, it is added while preserving technical history.

---

# 18. Designer As-Built, Plotting And Technical Evidence Window

The system must support precise designer/as-built plotting records.

It must store and show:

- exact pipe location
- service connection location
- valve location
- central main location
- pipe depth
- service connection depth
- distance from road edge
- distance from pavement
- fittings installed
- tees
- bends
- reducers
- couplings
- repair clamps
- stopcocks
- meter boxes
- chambers
- transition points
- replaced sections
- abandoned sections
- old network position
- new network position

Each plotting record links to:

- asset ID
- job ID
- report number
- official version
- road
- area
- technical address
- coordinates
- source file
- designer/technician
- approving user
- date
- authorization number where available
- photos
- scan
- CAD/GIS file
- field note

Every asset/report/job should open a Technical Evidence Window with:

- as-built drawing
- scanned plan
- field sketch
- CAD/GIS-derived detail
- plotting measurements
- depth
- service connection details
- fittings
- installation photos
- repair photos
- authorization number
- employee who registered
- employee who approved
- installation date
- repair date
- road/area
- official version
- previous versions
- warnings

The map shows where the network is.
The evidence window shows why the system believes it is there.

---

# 19. Scanner, Photo, OCR And Georeferencing

The system may process:

- scanned drawings
- photographed drawings
- printed plans
- field sketches
- CAD exports
- GIS exports
- PDF plans
- as-built plans
- installation photos
- repair photos
- survey information where authorized

AI/OCR may assist with:

- road names
- asset labels
- dimensions
- depths
- pipe diameters
- materials
- fittings
- service connection numbers
- meter references
- authorization numbers
- dates
- employee names
- drawing references

Extracted information remains AI/scanner-assisted until confirmed.

No scanned/photo-read information becomes official without validation and approval.

Georeferencing may use:

- coordinates
- control points
- road intersections
- existing assets
- valves
- meter locations
- service connections
- official CAD/GIS reference
- technician placement
- supervisor approval

Alignment statuses:

- georeferenced
- partially georeferenced
- manually aligned
- field-confirmed
- approximate
- needs review
- rejected

---

# 20. Field Indication Mode

Field indication mode must show:

- selected asset
- exact or best-known location
- depth where available
- pipe direction
- service connection direction
- nearest valve
- nearest fitting
- installed components
- old vs new network
- confidence level
- source
- last verification date
- approximate/unconfirmed warning

A simple worker must understand:

- where the pipe is
- where the service connection is
- how deep it is
- which direction it goes
- what fitting exists
- what risk exists
- whether confirmed or approximate

Confidence levels:

- high
- medium
- low
- unknown

---

# 21. Fault And Report Registry

Every fault/report becomes a structured digital record.

Categories:

- pipe leak
- burst pipe
- low pressure
- high pressure
- no water
- cloudy water
- water quality complaint
- consumer complaint
- service connection problem
- water meter replacement
- meter reading issue
- meter box issue
- valve repair
- valve replacement
- stopcock repair
- hydrometer raccord repair
- new connection
- disconnection
- reconnection
- excavation
- backfill
- asphalt restoration
- concrete restoration
- inspection only
- emergency repair
- planned maintenance
- contractor job
- internal crew job
- network extension
- new installation
- network replacement
- central main replacement
- as-built update

Every report stores:

- report number
- date/time
- road/area
- map location
- related asset
- consumer reference where legally allowed
- assigned team
- responsible supervisor
- status
- priority
- materials
- photos
- measurements
- cost
- accounting status
- approval status

---

# 22. Job Evidence

Every field job must support structured evidence.

Photo categories:

- before work
- excavation opened
- exposed pipe/valve/connection
- materials used
- repair in progress
- before backfill
- final surface restoration
- after completion

Each photo stores:

- user
- timestamp
- GPS where available
- job ID
- asset ID
- photo type
- notes
- approval status

Missing required evidence marks job as:

Incomplete Evidence

---

# 23. Materials, Warehouse And Stock

Material registration may use:

- photo evidence
- barcode scan
- QR scan
- warehouse item code
- manual technician confirmation
- supervisor approval

AI may suggest materials but final stock/cost/accounting actions require human confirmation.

Tracked items:

- pipes
- valves
- fittings
- meters
- meter boxes
- couplings
- reducers
- repair clamps
- asphalt
- concrete
- backfill
- tools
- equipment
- vehicles
- spare parts

Material record:

- item
- warehouse code
- quantity used
- quantity returned
- diameter
- type
- supplier
- unit cost
- job
- report
- asset
- photo evidence
- technician confirmation
- approval status

Stock deduction requires confirmation when affecting cost/inventory.

---

# 24. Excavation, Contractor And Cost Control

Excavation inputs:

- length
- width
- depth
- surface type
- restoration area
- excavation volume
- unit cost
- total cost

Rules:

- excavation volume = length * width * depth
- surface restoration area = length * width

Surface types:

- asphalt
- concrete
- paving slabs
- tiles
- soil
- gravel
- mixed
- other

Photo-only measurements are estimates unless verified.

Every excavation job supports:

- contractor company
- responsible contractor person
- excavator driver
- machine ID
- vehicle plate where applicable
- start/end time
- excavation dimensions
- restoration type
- unit cost
- total cost
- invoice reference
- photo evidence
- supervisor approval
- accounting review

If invoice quantity differs from recorded quantity, flag:

Needs Review

---

# 25. Workers, Staff, Hours And Leave

The system must support:

- employee name
- role
- specialty
- team/crew
- assigned area
- active/inactive
- daily assignment
- work performed
- hours worked
- overtime
- leave
- sick leave
- absence
- supervisor approval
- job participation
- photo submissions
- field notes

Management/accounting must know:

- who worked
- where
- what they did
- when
- what evidence supports it

Employee data is role-protected.

---

# 26. Accounting And Cost Control

Accounting is operational cost support, not certified tax/accounting replacement unless later connected to approved provider.

Accounting reviews:

- job number
- report number
- road/area
- date/time
- contractor
- excavator driver
- workers
- hours
- materials used
- excavation quantity
- final surface type
- labor cost
- material cost
- contractor cost
- restoration cost
- total cost
- photos
- approval status
- invoice status

Reports:

- cost by job
- cost by road
- cost by area
- cost by contractor
- cost by asset
- cost by network section
- cost by month
- cost by fault type
- material usage
- contractor comparison
- warehouse consumption

---

# 27. Consumer Problems, Water Quality And Notifications

Consumer records are privacy-protected.

May include:

- consumer reference number
- service connection ID
- meter ID
- road/area
- complaint type
- complaint history
- related reports
- assigned officer
- resolution status
- communication history where legally allowed
- access restrictions

Reports may include:

- low pressure
- high pressure
- no water
- cloudy water
- water quality complaint
- planned interruption
- emergency interruption
- affected area
- estimated restoration time
- notification status

Notifications where legally allowed:

- affected road/area
- interruption type
- estimated restoration
- safety message
- completion message
- history

---

# 28. Permits And Surface Restoration

Excavation pre-file:

- permit
- road/area
- planned date/time
- supervisor
- contractor
- excavator driver
- traffic/road safety notes
- before photos
- nearby infrastructure risks
- approval before start
- emergency contact where required

Restoration tracking:

- area
- surface type
- restoration contractor
- restoration date
- restoration cost
- before/after photo
- supervisor approval
- accounting status

High-risk excavation cannot close officially without evidence and approval.

---

# 29. QR And Barcode

Support QR/barcode for:

- valves
- pipes
- meters
- service connections
- fittings
- materials
- tools
- vehicles
- job files

Scanning opens:

- asset record
- job history
- photos
- maintenance history
- linked reports
- material usage
- cost history where authorized

---

# 30. Lifecycle, Criticality And Preventive Maintenance

Lifecycle states:

- proposed
- planned
- installed
- active
- repaired
- replaced
- abandoned
- retired
- archived

Each lifecycle change stores:

- date
- user
- source
- reason
- job/report/photos/materials
- approval status
- previous value
- new value

Criticality:

- low
- medium
- high
- critical

Based on:

- consumers served
- critical buildings
- repeated failures
- pipe age
- material risk
- repair history
- cost history
- pressure zone
- operational importance

Preventive maintenance covers:

- old pipes
- repeated faults
- valves requiring inspection
- meters requiring replacement
- pressure problem areas
- high-cost sections
- inspections
- recurring complaints
- repeated excavation
- replacement cheaper than repair

---

# 31. Suppliers, Offers And Contracts

Track:

- suppliers
- prices
- contractor rates
- offers
- contracts
- expiry dates
- invoice references
- price comparisons
- approved supplier list
- contact persons
- payment terms where allowed
- historical prices

---

# 32. Historical Search, Statistics And Analytics

The system must preserve institutional memory.

Search completed work by:

- road
- area
- village/municipality
- report number
- job number
- date range
- fault type
- asset
- pipe
- valve
- service connection
- meter
- central main
- contractor
- excavator driver
- employee
- technician
- supervisor
- chief supervisor
- material
- excavation type
- restoration type
- cost range
- accounting status
- approval status

Analytics by road/area:

- number of faults
- repeated faults
- repairs
- service connection problems
- meter replacements
- valve repairs
- pipe breaks
- excavations
- material cost
- contractor cost
- labor cost
- restoration cost
- total cost
- average repair time
- last fault date
- most common fault type
- most used materials
- preventive maintenance suggestions

Analytics by valve/zone:

- connected pipes
- connections
- meters where available
- affected roads/areas
- historical faults
- repeated locations
- maintenance date
- material usage
- criticality
- risk

Employee/crew analytics:

- jobs assigned/completed
- participation
- hours/overtime where allowed
- areas worked
- fault types handled
- photos submitted
- materials recorded
- jobs returned for missing evidence
- daily/monthly summaries

Contractor analytics:

- jobs
- excavation volume
- restoration area
- invoice vs approved quantity
- discrepancies
- total cost
- missing evidence
- accounting status

Map analytics:

- heatmap repeated faults
- high-fault roads
- high-cost areas
- valves linked to frequent incidents
- repeated excavation zones
- old network requiring attention

Sensitive analytics are role-protected and audited.

---

# 33. Utility Intelligence, Telemetry And Multi-Utility Safety

The water network must be an intelligent operational layer, not static lines.

Support:

- pressure zones
- pressure readings
- telemetry points
- historical faults
- hidden leak indicators
- excavation history
- asset criticality
- risk zones
- future authorized utility layers

Pressure data may include:

- high/low/normal pressure areas
- pressure readings
- pressure complaints
- pressure-related fault history
- risk indicators

Telemetry integration may include:

- pressure sensors
- flow meters
- district metered areas
- reservoir/tank levels where applicable
- pump status where applicable
- valve status where available
- consumption anomalies
- night flow
- hidden leak indicators
- alarms
- sensor health

Telemetry import methods:

- API
- scheduled import
- CSV/Excel
- database connection
- manual upload
- provider connection

Hidden leak indicators:

- abnormal night flow
- pressure drop
- wet area reports
- repeated complaints
- unexplained consumption
- repeated repairs
- sensor alarms
- acoustic survey references
- field investigation

Hidden leak statuses:

- suspected
- under investigation
- confirmed
- repaired
- false alarm
- needs monitoring

Future utility placeholders:

- sewerage
- electricity
- telecommunications
- irrigation
- stormwater/drainage
- gas where applicable
- street lighting
- public works
- other

Other utility data only appears when authorized. The system must never guess or invent other utility positions.

Pre-excavation utility conflict check should show authorized known nearby:

- water pipe
- service connection
- valve
- main
- meter
- sewer
- electricity
- telecom
- irrigation
- drainage
- depth
- offset
- confidence
- source
- last update

Warn when data is missing, approximate, unknown, or unauthorized.

---

# 34. Pantavion AI Role

Pantavion AI must be active across the module, but must not silently replace authorized human approval.

AI roles:

- observe
- compare
- classify
- extract
- summarize
- detect anomalies
- detect recurring faults
- check evidence
- suggest routing
- support cost review
- support material recognition
- interpret telemetry
- analyze pressure/risk
- detect hidden leak suspicion
- assist plan reading
- support historical search
- prepare director summaries
- suggest preventive maintenance

AI in imports:

- compare versions
- detect new/removed/changed assets
- match local edits to official updates
- identify conflicts
- summarize import differences

AI in field photos:

- classify photo type
- detect missing evidence
- group before/during/after
- identify visible materials
- read labels where allowed
- detect excavation/restoration evidence

AI in accounting:

- compare invoice quantities to field measurements
- detect missing approvals/photos
- detect suspicious cost differences
- detect repeated contractor discrepancies

AI in warehouse:

- suggest materials
- detect unusual usage
- forecast stock shortages
- summarize usage

AI in designer/as-built:

- read plans
- extract dimensions/depths/diameters
- suggest georeferencing points
- link plans to assets

AI in telemetry:

- pressure anomaly
- hidden leak suspicion
- night-flow anomaly
- recurring complaint correlation

AI in search:

- answer natural-language historical queries and link to source records

AI must not independently:

- approve official network changes
- delete official records
- approve payments
- close accounting
- expose raw files
- grant access
- export sensitive data
- override permissions
- convert approximate data into confirmed official data

AI suggests. Authorized humans approve.

Every sensitive AI suggestion must be traceable.

---

# 35. Director Dashboard

Director dashboard shows:

- daily faults
- open faults
- completed faults
- urgent faults
- excavation cost
- monthly cost
- material shortages
- contractor activity
- worker activity
- jobs awaiting approval
- jobs ready for accounting
- incomplete evidence
- recurring problem areas
- consumer complaint trends
- network upgrade status
- pending technical plans
- official version status
- conflicts between official files and Pantavion edits
- cost by road
- cost by area
- cost by contractor
- cost by network section
- top roads by faults
- highest-cost areas
- replacement recommendations

---

# 36. Legal, Ownership And Confidentiality

The module must require professional legal controls before production use.

Rules:

- network data belongs to the authorized organization/customer
- Pantavion provides platform/service
- Pantavion must not sell or reuse customer infrastructure data without authorization
- users receive access rights, not ownership/copy rights
- unauthorized copying, resale, scraping, export, or sharing is prohibited
- confidentiality obligations required for sensitive infrastructure data
- consumer/personal data protected by privacy rules
- employee data protected by role and lawful use
- third-party utility data used only with authorization
- AI does not train on customer infrastructure data unless explicitly authorized

Pantavion must distinguish:

- confirmed technical facts
- estimates
- AI-assisted suggestions
- unverified scans/photos
- approximate locations
- pending records
- official records

---

# 37. Backup, Recovery And Audit

The system must preserve:

- original official files
- every official version
- Pantavion edits
- photos
- plans/scans
- telemetry imports where needed
- audit logs
- approvals
- accounting evidence
- material history
- user access history

Must support:

- backup retention
- rollback
- version comparison
- recovery from mistaken import
- recovery from corruption
- incident investigation

Audit records must answer:

- who did it?
- what changed?
- when?
- from what device/session?
- what evidence existed?
- who approved?
- what status changed?
- what data was exported?
- who viewed sensitive data?

---

# 38. Future Expansion Beyond Water

Water is first.

Architecture should later support:

- sewerage
- roads
- street lighting
- public works
- municipal assets
- facilities
- drainage
- irrigation
- public safety assets
- other operational networks

Same doctrine applies:

- protected access
- map-first
- asset lifecycle
- field evidence
- versioning
- staff
- contractors
- warehouse
- accounting
- director oversight
- audit history

---

# 39. Final Production Principle

Pantavion Professional Infrastructure must reduce waste, prevent overcharging, improve warehouse control, verify contractor work, document field activity, protect the organization, protect the founder, and provide accurate evidence-based operational records.

The first production success is the live protected real water-network map.

Nothing else is more important than workers, technicians, supervisors, and engineers being able to open the map quickly, find the point, and see the real network safely on any common device.

No contractor payment, stock deduction, accounting closure, official network update, sensitive export, or production activation should rely on undocumented work when photo evidence, measurements, approval, and audit history are required.

The module must be:

- real
- production-focused
- map-first
- secure
- private
- hard to copy
- hard to steal
- versioned
- auditable
- evidence-based
- mobile-friendly
- field-ready
- offline-capable
- AI-assisted
- human-approved
- director-ready
- accounting-aware
- contractor-aware
- warehouse-aware
- telemetry-ready
- multi-utility-ready
- controlled by founder authorization
