# Pantavion Safe Patch Loop

Patch 13 adds the first bounded loop for controlled Pantavion code generation.

## Scripts

- npm run agent:loop
- npm run agent:loop:dry
- npm run audit:agent-loop

## Loop

1. agent:supervisor
2. agent:safe-patch
3. audit:safe-patch
4. audit:capability-registry
5. tsc
6. build
7. local loop report

## Safety

The loop does not commit, push, deploy, force-push, touch secrets, or bypass founder approval.
Sensitive actions remain blocked by policy and approval gates.
