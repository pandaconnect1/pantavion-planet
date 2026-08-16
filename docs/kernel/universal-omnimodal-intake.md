# Pantavion Universal Omnimodal Intake

Status: real local/runtime intake foundation.

Purpose:

- Accept and store original bytes.
- Create SHA256 manifest.
- Classify format/category.
- Quarantine or block sensitive files.
- Mark unsupported/new formats as requires_adapter.
- Store DWG/DXF/CAD originals read-only and untouched.
- Write audit.
- Provide API and local script intake.

Supported foundation categories:

- text
- audio
- video
- images
- PDF
- Office files
- CAD: DWG/DXF
- GIS/maps: KML/KMZ/GeoJSON
- archive
- unknown future market formats

DWG/CAD rule:

```text
Original CAD/DWG source is preserved as bytes.
No conversion is treated as original truth.
No layer/color/text/arrow/label removal.
No GeoJSON/Leaflet/Mapbox replacement as original.
Viewer/parser requires explicit governed adapter.


