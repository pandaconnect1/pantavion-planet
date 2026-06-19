# Pantavion Runtime Safety and Capability Broker Foundation

## Locked rule

Pantavion must not expose static functions, fake features, placeholder-only routes, dead buttons, or UI-only capabilities.

Every visible capability must have one of these:

1. real route
2. real logic
3. real state/data flow
4. real provider/data source when needed
5. clear disabled/beta/internal status when not implemented

## Executable gate

Run:

```bash
npm run safety:pantavion
