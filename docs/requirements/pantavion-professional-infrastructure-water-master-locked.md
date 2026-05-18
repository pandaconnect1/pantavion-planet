# Pantavion Professional Infrastructure — Water Network Master Locked Requirement

## 0. Founder Authorization Lock

This document defines a protected future Pantavion professional infrastructure module.

Nothing in this document activates the module.

No real water-network map, KMZ, KML, CAD, DWG, DXF, GIS file, consumer data, staff data, contractor data, accounting data, technical plan, scanned plan, photo evidence, or infrastructure dataset may be imported, committed, exposed, deployed, activated, published, connected, or made visible without explicit founder authorization.

Accepted founder activation commands include only clear instructions such as:

- 
-  
-    PANTAVION
- ACTIVATE THE INFRASTRUCTURE MODULE

Until then, this remains a locked protected future module only.

---

# 1. Core Product Identity

Module:

Pantavion Professional Infrastructure

First domain:

Water Network / Ύδρευση

Purpose:

A protected professional infrastructure operations system for organizations that manage water networks, maps, technical assets, network upgrades, field teams, repairs, excavations, contractors, warehouse materials, consumer reports, costs, accounting support, and director-level oversight.

This is not a public feature.
This is not a social feature.
This is not a generic admin panel.
This is not a static file viewer.
This is not a boring dashboard-first module.

It is a protected, map-first, GIS/CAD-style operational system.

The map is the center.
The water network is the product.
All reports, jobs, workers, materials, contractors, accounting, and management connect back to real infrastructure assets.

---

# 2. Map-First Doctrine

After authorized access, the first user experience must be the live protected water-network map.

First screen:

- live water-network map
- official network layers
- local Pantavion edits
- pending / approved / officialized changes
- search
- location tools
- layer controls
- fault registration
- technical evidence access
- assigned jobs
- sync/offline status

Not first:

- generic tables
- boring admin dashboard
- static cards
- hidden map
- fake buttons
- public demo network

The system must feel alive, visual, operational, fast, and professional.

---

# 3. Access Control

The module must be locked behind controlled access.

Required controls:

- request access
- founder/admin approval
- organization-level permissions
- user-level permissions
- role-based access control
- optional extra password / PIN / 2FA
- least-privilege permissions
- session protection
- audit log
- access expiry where required
- no anonymous access
- no public infrastructure map
- no public sharing

Roles may include:

- Viewer
- Field Worker
- Technician
- Engineer
- Supervisor
- Warehouse Officer
- Accountant
- Director
- Admin
- Founder

Users must only see the data and tools they are authorized to use.

---

# 4. Anti-Copy, Anti-Theft and Defensive Security Doctrine

No system can guarantee that data can never be copied once a malicious authorized person can see it. Pantavion must therefore use layered protection.

## Repository Protection

- No real KMZ/KML/CAD/DWG/DXF/GIS water-network file may be committed to a public repository.
- No real infrastructure dataset may be bundled into the frontend.
- No raw sensitive network file may be placed in `/public`.
- No direct permanent public URL may expose infrastructure data.
- Demo data must be synthetic, fake, anonymized, or heavily reduced.

## Private Storage

Real infrastructure files must be stored only in protected private storage with:

- encryption at rest
- encryption in transit
- private buckets/containers
- signed temporary URLs
- access expiry
- object versioning
- backup retention
- checksum verification
- file fingerprinting
- malware/safety scanning where appropriate
- import quarantine before approval

## Application Security

The application must support:

- authentication
- role-based access control
- organization/tenant separation where needed
- audit logs
- rate limits
- session/device risk checks
- secure headers
- download restrictions
- export permissions
- admin approval for sensitive exports
- IP/device/session blocking where appropriate
- account lockout or step-up authentication for suspicious activity

## Defensive Intrusion Response

If unauthorized access, scraping, brute force, suspicious export, or attempted data theft is detected, the system may:

- block the account
- revoke sessions
- revoke tokens
- force password reset
- require 2FA / step-up verification
- block or rate-limit IP/device/session
- disable exports
- quarantine suspicious changes
- alert founder/admin/security
- preserve forensic logs
- create incident report
- require manual review before restoring access

The system must not send malware, destructive code, ransomware, spyware, worms, trojans, or retaliatory payloads to any person or device.

No hack-back.
No revenge software.
No malicious counterattack.

Only lawful defensive protection, blocking, logging, alerting, revocation, and evidence preservation are allowed.

## Watermarking and Traceability

Exported files, reports, PDFs, screenshots, generated map packages, and sensitive downloads should support traceability:

- visible watermark where suitable
- invisible export fingerprint where feasible
- user ID in export metadata
- organization ID in export metadata
- timestamp
- reason for export
- export log
- download log
- expiry for shared links
- revocable access links

## Legal and Commercial Protection

The module must be protected by:

- platform terms
- professional module terms
- confidentiality obligations
- customer/organization contract where applicable
- no unauthorized copying clause
- no resale clause
- no reverse engineering clause where legally enforceable
- license restrictions
- data processing terms
- export/use restrictions
- liability limits
- breach reporting rules
- audit cooperation rules

## AI/Data Protection

Real infrastructure data must not be sent to third-party AI providers for training.

If AI processing is later used, it must follow:

- no training on customer data unless explicitly authorized
- provider data-processing review
- minimum necessary data transfer
- redaction where possible
- private processing where possible
- human approval before official changes

---

# 5. Official Network, Versions and Local Edits

The system must separate:

1. Official Network
2. New Official Import Candidate
3. Pantavion Local Edits
4. Pending Edits
5. Approved Edits
6. Officialized Edits
7. Conflicts
8. Archived Versions

The official network is the current approved reference.

Pantavion local edits are never deleted automatically.

The original and every official version must remain traceable.

Each official file/version must store:

- source
- date
- uploader
- approving user
- checksum
- version number
- file type
- import report
- approval status
- rollback availability

---

# 6. Controlled Map and Network Migration Pipeline

When a designer, engineer, authority, or authorized technical party gives a new network file, the system must not replace the live network blindly.

Required pipeline:

1. Upload new file to private quarantine.
2. Store checksum and metadata.
3. Identify source, designer, date, project, and file type.
4. Validate file format.
5. Extract layers and geometries.
6. Detect coordinate system where possible.
7. Normalize geometry.
8. Validate topology where possible.
9. Compare with current official network.
10. Compare with Pantavion local edits.
11. Detect matching local edits.
12. Detect new official assets.
13. Detect removed official assets.
14. Detect geometry differences.
15. Detect attribute differences.
16. Officialize matching Pantavion edits.
17. Preserve unmatched Pantavion edits.
18. Flag conflicts for review.
19. Produce import report.
20. Require authorized approval.
21. Promote candidate to official only after approval.
22. Preserve all previous official versions.

No local edit is deleted automatically.

Conflict decisions may include:

- accept official
- keep Pantavion edit
- merge
- reject local edit
- request field verification
- request designer clarification

---

# 7. Supported Technical File Inputs

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

Every technical import must go through validation, comparison, approval, and version history.

---

# 8. Lightweight Cross-Device Map Requirement

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

Large official files must be privately processed into optimized protected map layers.

The user should experience a fast operational map, not a heavy technical file viewer.

The system should support:

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

At low zoom, show simplified information:

- main network
- central mains
- major areas
- important fault zones

At high zoom, show detailed information:

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

# 9. Offline Mobile, Tablet, Desktop and GSM/Cell Location

The primary field experience must be mobile-first.

The system must work when internet connection is weak, unstable, or unavailable.

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

No offline record should silently overwrite official data after reconnection.

Location sources may include:

- GPS
- assisted GPS
- GSM / cell tower location
- Wi-Fi positioning
- browser/device geolocation API
- manual map selection
- coordinate entry

The system must record location source and accuracy where possible.

Examples:

- GPS, accuracy ±5m
- Assisted, accuracy ±30m
- GSM / Cell, accuracy ±200m
- Manual
- Unknown

GSM/cell location is approximate unless confirmed.

Official technical placement must not rely only on low-accuracy GSM location when precise placement is required.

Final official location should be confirmed by one or more of:

- GPS with acceptable accuracy
- technician manual placement on the map
- snapping to existing network geometry
- approved survey/GIS/CAD source
- supervisor approval
- field verification
- imported official plan

Offline cached infrastructure data must respect:

- user permissions
- organization permissions
- data expiry
- encrypted local storage where possible
- logout protection
- device loss risk
- remote revoke where possible
- no unrestricted export

---

# 10. Water Network Assets

Supported asset types include:

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
- asset type
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

# 11. Precision Editing and Search

Editing must be technical, not vague.

The system must support:

- precise geometry
- snapping to existing network
- coordinate search
- address search
- asset ID search
- layer search
- pipe selection
- valve selection
- service connection selection
- central main selection
- measurement tools
- attribute editing
- change proposals
- approval workflow
- history

Search must support:

- official address
- incomplete address
- road
- area
- unofficial road
- temporary road ID
- development area
- coordinates
- asset ID
- pipe ID
- valve ID
- service connection ID
- meter ID
- report number
- job number
- Pantavion Technical Address ID
- contractor
- fault category
- consumer reference where legally allowed

If public address search fails, technical search must continue.

---

# 12. Unregistered Roads and Missing Street Numbers

The system must support areas where water network exists but public maps, road names, or street numbers are incomplete or missing.

Common cases:

- new development areas
- village expansions
- new plots
- pending roads
- unofficial roads
- private development roads
- areas where network was installed before public maps updated

The system must support:

1. Official Address
2. Pantavion Technical Address

Pantavion Technical Address may include:

- technical location ID
- coordinates
- water-network asset ID
- pipe ID
- valve ID
- service connection ID
- meter ID
- local development area
- plot / parcel reference where legally allowed
- road segment status
- technician-confirmed location
- source plan reference
- related official network version

The absence of an official address must not prevent:

- field work
- report registration
- asset placement
- job evidence
- material registration
- accounting review
- director oversight

Road segment statuses may include:

- official
- unofficial
- pending official registration
- planned
- under construction
- private development road
- field-confirmed
- imported from technical plan
- archived / replaced

When a pending road or street number becomes official, the system must update official address while preserving all previous technical history.

---

# 13. Designer As-Built Plotting and Technical Evidence Window

The system must support precise designer/as-built plotting records for both new and existing networks.

It must store and display:

- exact pipe location
- exact service connection location
- exact valve location
- exact central main location
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

Every plotting record should connect to:

- asset ID
- job ID
- report number
- official network version
- road
- area
- technical address
- coordinates
- source file
- designer/technician
- approving user
- date
- authorization number where available
- related photos
- related scan
- related CAD/GIS file
- related field note

Each asset, report, or job should open a separate Technical Evidence Window showing:

- as-built drawing
- scanned plan
- field sketch
- CAD/GIS-derived detail
- plotting measurements
- pipe depth
- service connection details
- fittings installed
- installation photos
- repair photos
- authorization number
- employee who registered the record
- employee who approved the record
- date of installation
- date of repair
- road / area
- related official version
- previous versions
- notes and warnings

The map shows the network.
The evidence window shows why the system believes the network is there.

---

# 14. Scanner, Photo, OCR and Georeferencing

The system may support attaching and processing:

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

AI/OCR may assist in identifying:

- road names
- asset labels
- dimensions
- depths
- pipe diameters
- material types
- fitting names
- service connection numbers
- meter references
- authorization numbers
- dates
- employee names
- drawing references

Extracted information must be marked as AI-assisted or scanner-assisted until confirmed.

No scanned/photo-read information becomes official without validation and approval.

When old drawings do not contain direct coordinates, the system should support georeferencing using:

- known coordinates
- control points
- road intersections
- existing assets
- known valves
- known meter locations
- known service connections
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

Approximate drawings must not be treated as final official geometry unless verified.

---

# 15. Field Indication Mode

Field indication mode should show:

- selected water asset
- exact or best-known location
- depth where available
- pipe direction
- service connection direction
- nearest valve
- nearest fitting
- installed components
- old vs new network where applicable
- confidence level
- source of information
- last verification date
- warning if approximate or unconfirmed

The system must be simple enough for a field worker to understand:

- where the pipe is
- where the service connection is
- how deep it is
- which direction it goes
- what fitting exists
- what risk exists
- whether the indication is confirmed or approximate

Confidence levels:

- high
- medium
- low
- unknown

---

# 16. Fault and Report Registry

Every fault or report must become a structured digital record.

Categories include:

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
- water meter reading issue
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

Every report should store:

- report number
- date
- time
- road
- area
- map location
- related asset
- consumer reference where legally allowed
- assigned team
- responsible supervisor
- job status
- priority
- materials used
- photos
- measurements
- cost
- accounting status
- approval status

---

# 17. Job Evidence

Every field job must support structured evidence.

Photo categories may include:

- before work
- excavation opened
- exposed pipe / valve / connection
- materials used
- repair in progress
- before backfill
- final surface restoration
- after completion

Each photo should store:

- user
- timestamp
- GPS where available
- related job ID
- related asset ID
- photo type
- notes
- approval status

If required evidence is missing, the job should be marked:

Incomplete Evidence

---

# 18. Photo-Assisted Materials and Warehouse

The system must support material registration from the field using:

- photo evidence
- barcode scan
- QR scan
- warehouse item code
- manual technician confirmation
- supervisor approval

AI may assist in recognizing materials, but final accounting, stock deduction, contractor payment, or official job closure must require authorized confirmation.

Tracked materials may include:

- pipes
- valves
- fittings
- meters
- meter boxes
- couplings
- reducers
- repair clamps
- asphalt material
- concrete material
- backfill material
- tools
- equipment
- vehicles
- spare parts

Material records should include:

- item
- warehouse code
- quantity used
- quantity returned
- diameter
- type
- supplier
- unit cost
- related job
- related report
- related asset
- photo evidence
- technician confirmation
- approval status

Stock deduction should require confirmation where it affects accounting, cost, or official inventory.

---

# 19. Excavation, Contractors and Cost Control

The system must support excavation measurement.

Inputs:

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
- mixed surface
- other

Photo-only measurements must be marked as estimates unless verified.

Every excavation job must support:

- contractor company
- responsible contractor person
- excavator driver name
- machine ID
- vehicle plate where applicable
- start time
- end time
- excavation dimensions
- surface restoration type
- unit cost
- total excavation cost
- invoice reference
- photo evidence
- supervisor approval
- accounting review

The system must compare contractor claims with recorded evidence.

If contractor invoice quantity differs from recorded quantity, the system must flag:

Needs Review

---

# 20. Workers, Staff, Hours and Leave

The module must support:

- employee name
- role
- specialty
- team / crew
- assigned area
- active / inactive status
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

Management and accounting must know:

- who worked
- where they worked
- what they did
- when they did it
- which evidence supports the job

---

# 21. Accounting and Cost Control

The accounting layer is operational accounting support, not a certified tax/accounting replacement unless later connected to an approved provider.

Accounting should review:

- job number
- fault report number
- road
- area
- date
- time
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
- material usage report
- contractor comparison report
- warehouse consumption report

---

# 22. Consumer Problems, Water Quality and Notifications

Consumer issue records must be protected by privacy rules.

They may include:

- consumer reference number
- service connection ID
- meter ID
- road
- area
- complaint type
- complaint history
- related fault reports
- assigned officer
- resolution status
- communication history where legally allowed
- privacy and access restrictions

The module must support reports for:

- low pressure
- high pressure
- no water
- cloudy water
- water quality complaint
- planned interruption
- emergency interruption
- affected area
- estimated restoration time
- consumer notification status

Where legally allowed, notifications may include:

- affected road
- affected area
- interruption type
- estimated restoration time
- safety message
- completion message
- notification history

Consumer data must remain protected by role-based access.

---

# 23. Permits and Surface Restoration

Every excavation job should support a pre-excavation file:

- excavation permit
- road / area
- planned date and time
- responsible supervisor
- contractor
- excavator driver
- traffic or road-safety notes
- photos before excavation
- nearby infrastructure risks
- approval before start
- emergency contact where required

Every excavation must track final restoration:

- restoration area
- surface type
- restoration contractor
- restoration date
- restoration cost
- before photo
- after photo
- supervisor approval
- accounting status

High-risk excavation should not be closed as official without required evidence and approval.

---

# 24. QR and Barcode Asset Identification

The system must support QR or barcode identification for:

- valves
- pipes
- water meters
- service connections
- fittings
- warehouse materials
- tools
- vehicles
- job files

Scanning a code should open:

- asset record
- job history
- photos
- maintenance history
- linked reports
- material usage
- cost history where authorized

---

# 25. Asset Lifecycle, Criticality and Preventive Maintenance

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

Every lifecycle change must store:

- date
- user
- source
- reason
- linked job
- linked report
- linked photos
- linked materials
- approval status
- previous value
- new value

Criticality levels:

- low
- medium
- high
- critical

Criticality may depend on:

- number of consumers served
- hospitals / schools / critical buildings affected
- repeated failures
- pipe age
- material risk
- repair history
- cost history
- operational importance
- pressure zone importance
- main network dependency

Preventive maintenance should cover:

- old pipes
- repeated fault areas
- valves requiring inspection
- meters requiring replacement
- pressure problem areas
- high-cost network sections
- scheduled inspections
- recurring consumer complaints
- repeated excavation areas
- network sections where replacement is cheaper than repeated repair

---

# 26. Suppliers, Offers and Contracts

The system should support procurement tracking:

- suppliers
- material prices
- contractor rates
- offers
- contracts
- contract expiry dates
- invoice references
- price comparison
- approved supplier list
- contact persons
- payment terms where allowed
- historical prices

---

# 27. Director Dashboard

The director dashboard must show:

- daily faults
- open faults
- completed faults
- urgent faults
- daily excavation cost
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
- official network version status
- conflicts between official files and Pantavion edits
- cost by road
- cost by area
- cost by contractor
- cost by network section

The director must see the real operational state without searching scattered files.

---

# 28. Legal Audit and Responsibility History

Every sensitive action must keep an audit trail.

Audit fields:

- user
- role
- action
- timestamp
- previous value
- new value
- related job
- related asset
- related photo
- related file
- related report
- approval status
- reason for change

This protects:

- organization
- workers
- supervisors
- accounting
- management
- founder
- customers
- technical records

---

# 29. Mobile Field App Doctrine

A worker or technician should be able to:

1. open assigned job
2. see fault on map
3. locate current position
4. open technical evidence
5. start work
6. capture required photos
7. record materials
8. record excavation dimensions
9. record workers / contractor / excavator driver
10. submit completion
11. send to supervisor approval
12. make the job available for accounting review
13. sync when internet returns

The mobile interface must be simple enough for real field pressure.

---

# 30. Future Expansion Beyond Water

Water network management is the first module.

The architecture should later support other infrastructure domains:

- sewerage
- roads
- street lighting
- public works
- municipal assets
- facilities
- drainage
- irrigation
- public safety assets
- other serious operational networks

The same doctrine applies:

- protected access
- map-first operation
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

# 31. Final Economic and Security Principle

Pantavion Professional Infrastructure must reduce waste, prevent overcharging, improve warehouse control, verify contractor work, document field activity, protect the organization, protect the founder, and give accounting and management accurate evidence-based records.

No contractor payment, material deduction, final accounting approval, official network update, or sensitive export should rely on undocumented work when photo evidence, measurements, approval, and audit history are required.

The module must be:

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
- director-ready
- accounting-aware
- contractor-aware
- warehouse-aware
- upgradeable
- protected by founder authorization

Nothing becomes active without explicit founder command.

---

# 32. Real KMZ/KML/GIS Import Clarification

Real infrastructure files are required for the module to be useful.

The Pantavion Professional Infrastructure module must be able to import and use real KMZ, KML, CAD-derived, GIS, and technical water-network files when explicit founder authorization is given.

The restriction is not against using real files.

The restriction is against exposing real files publicly, committing them to a public repository, bundling them in the frontend, or placing them in an unrestricted public download location.

## Correct Real File Flow

Real KMZ/KML/GIS files must follow this protected flow:

1. authorized private upload
2. private encrypted storage
3. quarantine before processing
4. checksum and file fingerprint
5. source and version registration
6. validation
7. layer extraction
8. geometry conversion
9. optimization for mobile map use
10. protected internal map layer generation
11. role-based map access
12. original file preserved as read-only source
13. audit log for every access, import, export, and approval

## Forbidden Real File Flow

Real infrastructure files must not be:

- committed to the public GitHub repository
- placed in the public frontend bundle
- placed in the `/public` folder
- exposed through permanent public URLs
- downloadable without permission
- copied into demo data
- sent to third-party AI providers for training
- made visible to unauthorized users

## Final Clarification

The real KMZ/KML/GIS water-network file is essential.

Pantavion must use the real file, but only through a protected private import pipeline.

The original file remains private and locked.

The user sees the processed protected map layers inside Pantavion according to permissions.

This protects the real network while still making the system fully useful in daily field operations.

---

# 33. Real Network Is Essential Rule

The Pantavion Professional Infrastructure / Water Network module has no practical value without the real water-network map and real infrastructure data.

The real KMZ/KML/GIS/CAD-derived water-network file is essential and must be supported.

The system must be designed to import, protect, process, display, version, compare, and update the real water network.

The restriction is not against using real network files.

The restriction is only against unsafe exposure, such as:

- public GitHub repository
- public frontend bundle
- public download URL
- unrestricted browser access
- unauthorized export
- uncontrolled sharing

## Required Real Network Flow

The correct flow is:

1. explicit founder authorization
2. private upload of real KMZ/KML/GIS/CAD file
3. protected private storage
4. checksum and source registration
5. quarantine and validation
6. geometry and layer extraction
7. conversion into optimized protected map layers
8. mobile/tablet/PC friendly map rendering
9. role-based access
10. audit logging
11. original file preserved as locked read-only source
12. official version history
13. comparison with Pantavion edits when new official files arrive

## Final Principle

Without the real map and real water network, the module is only a document.

With the real protected network, the module becomes a serious operational infrastructure system.

Therefore, real network import is mandatory for future activation, but it must happen only through a private protected pipeline and only after explicit founder authorization.

---

# 36. Production Role Workflow, Department Routing and Responsibility Matrix

The Pantavion Professional Infrastructure / Water Network module must be designed as a real production system with clear departmental workflows, role responsibilities, approval stages, and data routing.

This module is intended for real operational use, not only documentation or future theory.

The system must define what each role sees, what each role can edit, what each role can approve, and what information is routed to warehouse, accounting, designer/drafting, technical service, supervisors, engineers, management, and director.

---

## Production Workflow Doctrine

Every operational event must follow a structured workflow.

A report, fault, repair, excavation, replacement, new connection, network extension, or technical update must move through clear stages.

Possible stages include:

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

No major job, official network change, contractor payment, stock deduction, or accounting approval should bypass the required workflow.

---

## Report Creation

A report may originate from:

- consumer complaint
- field worker
- technician
- supervisor
- technical service
- engineer
- director
- planned maintenance
- new development
- new network plan
- emergency fault
- contractor report
- designer/as-built update

Every report must receive:

- report ID
- job ID where applicable
- date
- time
- map location
- road / area / technical address
- related asset where applicable
- priority
- category
- source
- status
- responsible department
- audit trail

---

## Technical Service Responsibilities

The technical service must be able to:

- view the water-network map
- view reports and faults
- triage new reports
- classify work type
- check nearby pipes, valves, meters, service connections and mains
- check as-built evidence
- check previous fault history
- assign work to crews
- request engineer review
- request designer/as-built update
- request warehouse materials
- request contractor involvement
- monitor open work
- review technical status
- prepare work for supervisor or engineer approval

The technical service should not receive unrestricted raw file export unless specifically authorized.

---

## Field Worker Role

A field worker may:

- see assigned jobs
- see permitted nearby map area
- see simple field instructions
- see selected asset information
- start job
- capture photos
- submit notes
- submit time started / time ended
- mark task progress
- work offline where allowed
- sync when connection returns

A field worker must not:

- edit official network geometry
- approve contractor quantities
- approve accounting cost
- export network data
- download raw files
- approve official network changes

---

## Assistant / Helper Role

A helper may:

- assist in job evidence collection
- capture additional photos
- submit notes
- record simple field observations
- participate in assigned jobs
- appear in job personnel records

A helper must not:

- close official work alone
- approve materials
- approve contractor work
- approve official network updates
- access accounting records unless authorized

---

## Technician Role

A technician may:

- view assigned and relevant jobs
- view nearby network
- view technical evidence
- record fault details
- record repair details
- record materials used
- record excavation dimensions
- record pipe/valve/meter/service connection observations
- submit completion evidence
- request warehouse materials
- request supervisor review
- propose field corrections
- work offline where allowed

A technician must not make official network changes without approval.

---

## Supervisor / πιστάτης Role

A supervisor may:

- view team jobs
- assign work to workers and technicians
- verify job evidence
- verify photos
- verify materials used
- verify excavation dimensions
- verify contractor attendance
- verify worker hours
- approve field completion
- reject incomplete evidence
- request correction
- escalate to chief supervisor
- route job to warehouse, accounting, designer, or engineer where needed

Supervisor approval is required before most field work becomes ready for accounting or technical officialization.

---

## Assistant Chief Supervisor / οηθός ρχιεπιστάτη Role

The assistant chief supervisor may:

- view multiple teams
- monitor daily production
- review supervisor approvals
- review unresolved issues
- review incomplete evidence
- coordinate between crews
- prepare work for chief supervisor
- flag repeated fault areas
- review contractor participation
- review high-priority or repeated jobs

This role supports coordination and quality control across teams.

---

## Chief Supervisor / ρχιεπιστάτης Role

The chief supervisor may:

- view all field crews under responsibility
- approve significant field completions
- approve contractor field quantities before accounting review
- approve worker hours before payroll/accounting export
- validate daily work summaries
- escalate to engineering or director
- return incomplete jobs to supervisors
- confirm that a job is operationally complete

Chief supervisor approval may be required before:

- Ready for Accounting
- Contractor Review
- Final Field Closure
- High-cost repair closure
- Major network repair closure

---

## Designer / Drafting Role

The designer/drafting user may:

- view technical map layers
- view assigned as-built updates
- view completed field jobs requiring drawing updates
- open technical evidence window
- view scans, photos, plans and plotting records
- create candidate geometry
- update drafting records
- upload or attach drawings
- register as-built details
- link plans to assets
- link plans to jobs
- prepare official network update candidates
- mark records as needs engineer approval

The designer may work with:

- exact pipe location
- service connection location
- valve location
- depth
- fittings
- tees
- bends
- reducers
- couplings
- old network
- new network
- replacement sections
- road/area references
- authorization number
- source plan

Designer output must not become official automatically unless that role is explicitly authorized and the workflow permits it.

Normally, designer updates require engineer or authorized technical approval.

---

## Technical Engineer Role

The technical engineer may:

- review technical corrections
- review designer/as-built updates
- review network conflicts
- approve candidate technical records
- validate geometry and attributes
- approve pipe/valve/service connection changes
- approve technical officialization
- reject inaccurate field or drawing records
- request field verification
- request designer clarification

Technical engineer approval may be required for official network changes.

---

## Executive Engineer Role

The executive engineer may:

- oversee major technical projects
- review network extensions
- approve large replacements
- approve new development network intake
- review official import candidates
- review conflict reports
- approve technical policy
- escalate to director where required

Executive engineer approval may be required for:

- new area development
- major network replacement
- central main update
- official network version promotion
- high-risk technical records

---

## Warehouse Officer Role

The warehouse officer may:

- view material requests
- issue materials
- record materials delivered
- record materials returned
- view stock levels
- update stock after approved use
- connect material usage to job ID and report ID
- flag low stock
- attach supplier information where allowed

The warehouse receives only the information required for stock and material control.

Warehouse should not:

- edit official network geometry
- approve accounting payments
- access full consumer details unless required and authorized
- export raw network files

---

## Accounting Role

Accounting may review only jobs that are ready for accounting or financially relevant.

Accounting may see:

- job ID
- report number
- road / area / technical address
- date and time
- assigned crew
- workers and hours where authorized
- contractor
- excavator driver
- machine/vehicle ID
- excavation dimensions
- surface restoration type
- materials used
- approved quantities
- photos required for evidence
- supervisor approval
- chief supervisor approval
- invoice reference
- cost breakdown
- accounting status

Accounting may:

- review costs
- compare contractor invoice with approved field quantities
- flag discrepancies
- mark invoice pending / approved / rejected
- export approved accounting reports
- request missing evidence
- return job to supervisor for correction

Accounting must not:

- change official network geometry
- alter technical evidence
- approve technical network updates
- access raw KMZ/KML/CAD/GIS files unless specifically authorized

---

## Director Role

The director may see high-level and approved operational information including:

- daily faults
- open faults
- urgent faults
- completed faults
- daily cost
- monthly cost
- worker activity
- contractor activity
- material shortages
- jobs waiting approval
- jobs ready for accounting
- incomplete evidence
- repeated fault areas
- network upgrade status
- official network version status
- pending technical plans
- conflicts between official files and Pantavion edits
- cost by road
- cost by area
- cost by contractor
- cost by network section

The director may approve or reject high-level decisions according to policy.

---

## Founder / Admin Role

Founder/Admin may:

- approve access
- remove access
- assign roles
- revoke sessions
- approve imports
- approve exports
- manage security rules
- review audit logs
- approve protected storage connection
- approve official activation of the module
- approve production rollout

Founder/Admin controls whether real infrastructure data is imported or activated.

---

## Department Routing Rules

### Route to Warehouse

A job routes to warehouse when:

- materials are requested
- materials are used
- materials are returned
- stock deduction is needed
- low stock is detected
- material cost must be attached to job

Warehouse receives:

- job ID
- report ID
- material list
- quantities
- crew
- date
- approval status
- return status

### Route to Accounting

A job routes to accounting only when:

- required evidence exists
- supervisor approval exists
- chief supervisor approval exists where required
- materials are confirmed
- contractor quantities are confirmed
- excavation/surface restoration quantities are confirmed
- cost records are ready

Accounting receives:

- approved cost package
- photos/evidence references
- quantities
- contractor data
- worker hours where authorized
- material usage
- invoice references
- approval chain

### Route to Designer / Drafting

A job routes to designer/drafting when:

- new pipe was installed
- service connection was added
- valve was added/replaced
- meter position changed
- network was replaced
- field geometry correction is needed
- as-built update is required
- old plan/scan must be attached
- new development plan must be processed

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

### Route to Engineer

A job routes to engineer when:

- official network geometry may change
- a conflict exists
- depth/location is uncertain
- major replacement occurred
- new development is being imported
- technical approval is required
- safety or public-service indication risk exists

### Route to Director

A job routes to director when:

- cost exceeds threshold
- major recurring issue exists
- large contractor invoice exists
- serious network replacement is proposed
- repeated consumer complaints occur
- major import/version update requires oversight
- policy decision is required

---

## Approval Gates

The system should support approval gates such as:

- Field Completion Approval
- Material Confirmation
- Warehouse Deduction Approval
- Supervisor Approval
- Chief Supervisor Approval
- Designer Drafting Completion
- Engineer Technical Approval
- Accounting Review
- Director Approval
- Official Network Promotion
- Export Approval
- Access Approval

No sensitive record should skip required gates.

---

## Final Production Rule

Pantavion Professional Infrastructure must operate as a real production system.

Every role must have clear responsibilities.

Every department must receive only the information needed for its work.

Every sensitive action must be approved, audited, and traceable.

The map remains the center, but production workflows define how real work moves from field to warehouse, accounting, designer, engineers, supervisors, director, and final archive.

---

# 37. Historical Search, Statistics, Analytics and Operational Intelligence Requirement

The Pantavion Professional Infrastructure / Water Network module must support historical search, operational statistics, analytics, and decision-support intelligence.

The system must not only register faults, jobs, materials, workers, contractors, and network changes. It must also help authorized users understand historical patterns, recurring problems, costs, workforce activity, contractor activity, and infrastructure risk.

---

## Historical Work Search

The system must allow authorized users to search past completed work by:

- road
- area
- village / municipality
- report number
- job number
- date range
- fault type
- asset ID
- pipe ID
- valve ID
- service connection ID
- meter ID
- central main
- contractor
- excavator driver
- employee
- technician
- supervisor
- chief supervisor
- material used
- excavation type
- surface restoration type
- cost range
- accounting status
- approval status

Search results should show:

- what work was done
- when it was done
- where it was done
- who worked on it
- who supervised it
- what materials were used
- what photos/evidence exist
- what the cost was
- whether the work affected the official network
- whether the job is closed, archived, disputed, or pending review

---

## Statistics by Road and Area

The system must support statistics by road, area, village, municipality, development zone, unofficial road, and Pantavion Technical Address area.

Statistics may include:

- number of faults
- number of repairs
- number of repeated faults
- number of service connection problems
- number of water meter replacements
- number of valve repairs
- number of pipe breaks
- number of excavations
- total material cost
- total contractor cost
- total labor cost
- total restoration cost
- total job cost
- average repair time
- last fault date
- most common fault type
- most used materials
- recurring locations
- suggested preventive maintenance areas

The system should help identify roads or areas where repeated repairs indicate that network replacement may be more economical than continued repair.

---

## Statistics by Valve, Central Main and Network Zone

The system must support statistics connected to valves, central mains, pressure zones, supply zones, and affected network areas.

For each central valve or network zone, the system should be able to show:

- connected pipes
- connected service connections
- connected meters where available
- affected roads
- affected areas
- number of historical faults
- repeated fault locations
- last maintenance date
- jobs connected to the zone
- contractor work connected to the zone
- material usage connected to the zone
- estimated operational importance
- criticality level
- risk level

This helps authorized staff understand which valve, main, or zone affects which area and where repeated failures occur.

---

## Employee and Crew Activity Statistics

The system must support authorized operational statistics by employee, technician, worker, helper, supervisor, crew, and team.

Possible statistics include:

- jobs assigned
- jobs completed
- jobs participated in
- hours worked
- overtime where allowed
- areas worked
- fault types handled
- photos submitted
- materials recorded
- jobs returned for missing evidence
- jobs approved by supervisor
- jobs awaiting review
- daily activity summary
- monthly activity summary

Employee statistics must be role-protected and used for operational management, work verification, planning, accounting support, and evidence history.

The system must not expose employee performance data to unauthorized users.

---

## Contractor and Excavation Statistics

The system must support statistics by contractor, excavator driver, machine, vehicle, and external crew.

Statistics may include:

- jobs performed
- excavation volume
- restoration area
- invoice quantity
- approved quantity
- differences between claimed and approved quantities
- total contractor cost
- cost by road
- cost by area
- cost by month
- repeated discrepancies
- missing photo evidence
- supervisor approval status
- accounting approval status

The system must help detect overcharging, repeated discrepancies, incomplete evidence, and unusual cost patterns.

---

## Material and Warehouse Analytics

The system must support material usage analytics.

Statistics may include:

- material used by road
- material used by area
- material used by fault type
- material used by employee/crew where authorized
- material used by contractor
- material used by month
- stock consumption trends
- low-stock warnings
- high-use materials
- returned materials
- missing material confirmation
- material cost trends

This helps warehouse and accounting understand what was used, where, by whom, and for which job.

---

## Recurring Fault Detection

The system should detect recurring faults by:

- same road
- same area
- same pipe
- same valve zone
- same service connection
- same meter
- same network section
- repeated material type
- repeated repair type
- repeated consumer complaints
- repeated contractor involvement

Recurring fault detection should help identify:

- old network needing replacement
- bad material sections
- problematic service connections
- pressure problems
- poor restoration areas
- repeated excavation zones
- areas needing engineering review

---

## Time-Based Analytics

The system must support time-based analysis such as:

- daily faults
- weekly faults
- monthly faults
- yearly faults
- seasonal fault trends
- repair time
- response time
- time from report to assignment
- time from assignment to field start
- time from field start to completion
- time from completion to supervisor approval
- time from approval to accounting review

This helps management understand operational speed and bottlenecks.

---

## Map-Based Analytics

Statistics should be visible on the map where appropriate.

Map analytics may include:

- heatmap of repeated faults
- roads with high fault count
- areas with high repair cost
- zones with repeated low pressure
- valves linked to frequent incidents
- network sections with repeated excavation
- old network requiring attention
- jobs by status
- contractor activity areas
- material usage by zone

The map remains the center of analysis.

---

## Archive and Evidence Retrieval

The system must make it easy to retrieve old completed work.

For each historical job, authorized users should be able to open:

- job summary
- report details
- map location
- related network asset
- workers
- supervisor
- contractor
- excavator driver
- materials
- excavation measurements
- cost
- photos
- as-built evidence
- designer updates
- accounting status
- approval chain
- audit trail

This is required so the organization can answer questions such as:

- when was this job done?
- who worked there?
- what exactly was repaired?
- what materials were used?
- what did it cost?
- who approved it?
- are there photos?
- was the network updated afterward?

---

## Director and Management Analytics

The director dashboard must include analytics such as:

- top roads by faults
- top areas by faults
- top network sections by cost
- repeated fault hotspots
- monthly cost by category
- contractor cost comparison
- staff workload summary
- material consumption summary
- jobs missing evidence
- jobs delayed in approval
- areas needing replacement
- preventive maintenance recommendations
- official network update impact

---

## Privacy, Fairness and Access Control

Analytics must respect permissions and privacy.

Employee, consumer, contractor, and sensitive infrastructure analytics must only be visible to authorized roles.

Statistics must not expose personal or consumer data unnecessarily.

Employee statistics should support operational management, safety, planning, accountability, and evidence history, not unauthorized surveillance or misuse.

Every access to sensitive analytics should be auditable.

---

## Final Rule

Pantavion Professional Infrastructure must preserve institutional memory.

Every completed job must remain searchable, measurable, and connected to the map, assets, staff, materials, contractors, photos, approvals, costs, and history.

The system must help the organization understand not only what is happening today, but what happened before, where problems repeat, who worked on them, what was done, and what should be improved next.

---

# 38. Utility Intelligence, Telemetry, Pressure, Hidden Leaks and Multi-Utility Excavation Safety Requirement

The Pantavion Professional Infrastructure / Water Network module must be designed so that the water network is not only a static overlay on a real map.

The network must become an intelligent operational layer that can connect geometry, assets, pressure information, telemetry, historical faults, hidden leak indicators, excavation risks, and future authorized utility layers.

---

## Intelligent Water Network Overlay

The water network may be displayed as a protected overlay on a real-world base map.

The system must support:

- official water-network geometry
- pipes
- valves
- central mains
- service connections
- meters
- fittings
- pressure zones
- telemetry points
- historical fault points
- hidden leak suspicion areas
- excavation history
- asset criticality
- risk zones
- future utility layers where authorized

The map must show not only where the network is, but what is known about the network.

---

## Pressure and Risk Awareness

The system must support pressure-related information where available.

Pressure data may include:

- pressure zone
- high pressure area
- low pressure area
- normal pressure area
- pressure readings from telemetry
- pressure complaints
- pressure-related fault history
- pressure-related risk indicators

High pressure areas may be used as risk indicators for possible future faults.

The system should be able to show:

- areas with repeated high pressure
- pipes in high pressure zones
- service connections affected by pressure
- roads with pressure-related faults
- network sections where pressure may contribute to repeated repairs

Pressure data must be source-labeled and timestamped.

---

## Telemetry Integration

The system must be designed to connect with telemetry systems where authorized.

Telemetry may include:

- pressure sensors
- flow meters
- district metered area data
- reservoir/tank levels where applicable
- pump status where applicable
- valve status where available
- consumption anomalies
- night flow data
- hidden leak indicators
- alarms
- sensor timestamps
- sensor health status

Telemetry data may be imported by:

- API integration
- scheduled data import
- CSV / Excel import
- database connection
- manual upload
- approved telemetry provider connection

Telemetry data must store:

- source
- timestamp
- sensor ID
- asset connection
- location
- value
- unit
- status
- reliability/confidence
- import method

Telemetry must not silently change official network geometry.

Telemetry informs risk, alarms, analytics, and investigation.

---

## Hidden Leak and Anomaly Detection

The system should support hidden leak intelligence where data exists.

Hidden leak indicators may include:

- abnormal night flow
- unexpected pressure drop
- repeated wet area reports
- repeated consumer complaints
- unexplained consumption
- repeated repairs in same zone
- sensor alarms
- acoustic survey references where available
- field investigation notes

The system may classify areas as:

- suspected hidden leak
- under investigation
- confirmed leak
- repaired
- false alarm
- needs monitoring

Hidden leak status should connect to:

- map location
- affected zone
- related assets
- telemetry evidence
- field reports
- photos
- jobs
- repair history
- cost
- approval status

---

## Multi-Utility Future Layer Placeholders

The system should be designed with future menu/layer placeholders for other utility networks.

Possible future authorized layers include:

- sewerage
- electricity
- telecommunications
- irrigation
- stormwater / drainage
- gas where applicable
- street lighting
- public works
- other municipal or infrastructure services

These layers must remain empty or disabled until authorized data is provided.

The system must not invent or guess other utility positions.

---

## Authorized Third-Party Utility Data

Other utility network data must only be shown when legally allowed and authorized.

Rules:

- no unauthorized third-party utility data
- no guessed electricity/telecom/sewer positions presented as fact
- each external utility layer must have source metadata
- each layer must show confidence/status
- access must be role-protected
- sensitive layers must be auditable
- export must be restricted
- outdated layers must be clearly marked

Possible layer statuses:

- not available
- authorized
- imported
- pending validation
- approximate
- confirmed
- outdated
- restricted
- disabled

---

## Pre-Excavation Utility Conflict Check

Before excavation, the system should support a utility conflict check.

When a user selects an excavation location, the system should show known nearby infrastructure where authorized.

The check may include:

- water pipe
- service connection
- valve
- central main
- meter
- sewer line if authorized
- electricity line if authorized
- telecommunications line if authorized
- irrigation line if authorized
- drainage line if authorized
- known depth
- known offset
- confidence level
- source document
- last update date
- warning messages

The system should clearly distinguish between:

- confirmed utility data
- approximate utility data
- unavailable utility data
- unauthorized utility data
- unknown utility data

The system must warn users when other utility data is missing or not verified.

---

## Excavation Safety Warning

When an excavation is planned, the system should be able to produce a safety indication such as:

- water infrastructure present
- high pressure zone
- central main nearby
- service connection nearby
- valve nearby
- repeated fault area
- hidden leak suspected
- other authorized utility nearby
- depth information available
- depth unknown
- location approximate
- field verification required

No excavation safety result should replace legal permits, official utility clearance, supervisor approval, or professional field verification.

---

## Multi-Layer Map Menu

The map menu should support expandable professional layers.

Example menu structure:

Water Network:
- official pipes
- valves
- service connections
- meters
- pressure zones
- telemetry
- hidden leak indicators
- faults
- jobs
- as-built evidence

Other Utilities:
- sewerage
- electricity
- telecommunications
- irrigation
- drainage
- street lighting
- other

Risk and Analytics:
- high pressure areas
- recurring fault roads
- hidden leak suspicion
- high-cost repair zones
- critical assets
- excavation conflict areas

Each layer must respect permissions and performance rules.

---

## Source, Depth and Confidence

Every utility indication should store or display where possible:

- source
- date
- asset ID
- depth
- offset / distance
- geometry
- accuracy
- confidence
- last verified date
- verified by
- authorization status

Depth and position must be clearly marked as confirmed, estimated, approximate, or unknown.

The system must not present approximate depth as confirmed depth.

---

## Analytics With Telemetry and Fault History

The system should combine telemetry, historical faults, pressure data, and job records to support analytics such as:

- roads with repeated pressure-related faults
- zones with suspected hidden leaks
- pipes with repeated repairs
- areas with high night flow
- high-cost network sections
- areas where replacement may be better than repeated repair
- valves/zones connected to repeated complaints
- pressure zones with repeated bursts
- telemetry alarms linked to actual jobs

This creates operational intelligence, not just record keeping.

---

## Final Rule

Pantavion Professional Infrastructure must be ready to grow from a water-network map into a full utility intelligence platform.

The water network remains the first protected operational layer.

Future authorized utility layers, telemetry, pressure, hidden leaks, excavation safety checks, and risk intelligence must connect back to the same map-first, permission-controlled, evidence-based system.

The system must help users understand not only where the water network is, but what risks, pressures, histories, telemetry signals, and nearby authorized utilities exist before work begins.

---

# 39. Pantavion AI Role in Professional Infrastructure Requirement

Pantavion Professional Infrastructure must include an active AI layer.

The AI layer must assist across the water-network map, official network versions, technical plans, faults, jobs, field photos, materials, warehouse, contractors, accounting, telemetry, analytics, staff workflows, and director oversight.

The AI must be designed as an assistant, analyst, verifier, classifier, router, warning system, and decision-support layer.

The AI must not silently replace authorized human approval for official technical, accounting, legal, personnel, export, access, or infrastructure decisions.

---

## AI Core Roles

The AI may support:

- observation
- comparison
- classification
- extraction
- summarization
- anomaly detection
- recurring fault detection
- evidence checking
- routing suggestions
- cost review support
- material recognition support
- telemetry interpretation
- pressure/risk analysis
- hidden leak suspicion
- technical plan reading support
- historical search
- director summaries
- preventive maintenance suggestions

---

## AI in Network Import and Version Comparison

When a new official network file is imported, AI may assist with:

- comparing old and new network versions
- detecting new assets
- detecting removed assets
- detecting changed geometry
- detecting changed attributes
- matching Pantavion local edits to official updates
- identifying conflicts
- summarizing import differences
- preparing technical review reports

AI must not promote a network candidate to official without authorized approval.

---

## AI in Field Photos and Evidence

AI may assist with field photos by:

- classifying photo type
- detecting missing required evidence
- grouping photos as before / during / after
- identifying visible materials where possible
- reading labels where allowed
- identifying excavation evidence
- identifying surface restoration evidence
- warning when evidence is incomplete

AI-assisted photo interpretation must be marked as AI-assisted until confirmed by an authorized user.

AI must not finalize stock deduction, accounting approval, contractor payment, or official job closure based only on unverified photo interpretation.

---

## AI in Materials and Warehouse

AI may assist warehouse and field users by:

- suggesting likely materials used
- comparing material requests with job type
- detecting unusual material usage
- identifying stock shortages
- suggesting reorder needs
- detecting materials recorded without required evidence
- summarizing material usage by road, area, crew, contractor, or fault type

Final material confirmation must remain under authorized human approval where it affects stock, cost, or accounting.

---

## AI in Contractor and Accounting Review

AI may support accounting and contractor review by:

- comparing contractor invoice quantities with field measurements
- comparing excavation volume with approved dimensions
- comparing surface restoration quantities
- detecting missing approvals
- detecting missing photos
- detecting suspicious cost differences
- detecting repeated contractor discrepancies
- preparing accounting review summaries

AI must not approve contractor payment or final accounting status without authorized accounting or management approval.

---

## AI in Staff and Workflow Support

AI may assist with:

- finding who worked on a past job
- summarizing daily crew activity
- identifying delayed jobs
- identifying jobs missing evidence
- identifying workload pressure
- routing jobs to supervisors, warehouse, designer, engineers, accounting, or director
- preparing operational summaries

Employee-related AI insights must be role-protected and used for operational management, planning, accountability, evidence history, and safety.

AI must not be used for unauthorized surveillance or unfair hidden evaluation.

---

## AI in Designer, As-Built and Technical Evidence

AI may assist designers and engineers by:

- reading scanned plans
- extracting road names
- extracting dimensions
- extracting pipe diameters
- extracting depths
- identifying fittings
- linking plans to map assets
- suggesting georeferencing control points
- identifying old vs new network evidence
- preparing as-built review notes

AI-extracted technical information must remain pending until validated and approved.

---

## AI in Telemetry, Pressure and Hidden Leak Intelligence

AI may assist with:

- pressure anomaly detection
- repeated high pressure zones
- night-flow anomaly detection
- hidden leak suspicion
- recurring complaint correlation
- sensor alarm summaries
- comparing telemetry with field faults
- suggesting investigation areas
- identifying zones where replacement may be better than repeated repair

AI must label uncertainty, source, timestamp, and confidence level.

---

## AI in Search and Historical Memory

AI must help authorized users find old work by natural language.

Examples:

- show all faults on this road
- show who worked here last year
- show all jobs near this valve
- show repeated faults in this area
- show all contractor excavations this month
- show jobs missing final restoration photos
- show all meter replacements in this zone
- show old as-built plans for this road

AI answers must link back to source records, map locations, reports, evidence, approvals, and audit history.

---

## AI in Director Oversight

AI may prepare director-level summaries such as:

- top roads by fault count
- highest-cost areas
- repeated fault zones
- contractor discrepancy summary
- material shortage forecast
- jobs waiting approval
- network sections needing replacement
- pressure/telemetry risk summary
- official network update impact
- monthly operational report

Director AI summaries must be traceable to underlying records.

---

## AI Safety and Human Approval Rule

AI must not independently:

- approve official network changes
- delete official records
- approve contractor payments
- approve accounting closure
- expose raw files
- grant user access
- export sensitive infrastructure data
- override role permissions
- change employee records without authorization
- convert approximate data into confirmed official data
- ignore required approval gates

AI may recommend. Authorized humans approve.

---

## AI Auditability

Every AI-assisted action that affects sensitive workflow must be traceable.

The system should record:

- AI suggestion
- source data used
- confidence level where available
- user who accepted/rejected it
- timestamp
- related job/report/asset
- final human decision

---

## Final AI Principle

Pantavion AI must make the infrastructure system smarter, faster, safer, and more economical.

AI helps the organization see patterns, prevent waste, detect risk, improve evidence, support field crews, assist designers, support accounting, and guide management.

The AI is active everywhere, but official truth remains controlled by permissions, evidence, approval workflow, and human responsibility.
