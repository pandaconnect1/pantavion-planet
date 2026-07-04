# Pantavion Product Builder Mission Queue

This patch makes `/pantavion/builder` real enough to stop being a dead/static route.

## Runtime

- `/pantavion/builder`
- `/api/pantavion/product-builder/missions`
- `data/pantavion-product-builder/missions.json`
- `components/pantavion/PantavionProductBuilderClient.tsx`

## What is real

- The page opens.
- Missions are loaded from API/state.
- Buttons call POST actions.
- Status, selected mission and audit tail persist to local JSON state.
- Z3/Z4 missions require founder approval before controlled execution.

## Safety

No deploy, no force push, no secrets, no DWG/source-truth mutation, no destructive repo actions.
