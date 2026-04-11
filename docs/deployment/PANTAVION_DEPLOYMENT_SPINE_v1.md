# Pantavion Deployment Spine v1

## Goal
Automatic flow:

VS Code -> GitHub -> GitHub Actions -> Vercel -> AWS

## What this workflow does
- On push / PR:
  - install
  - lint (if present)
  - typecheck (if present)
  - test (if present)
  - build
- On pull request:
  - deploys Vercel preview
- On push to main/master:
  - deploys Vercel production
  - optionally triggers AWS sync/invalidation

## Required GitHub Secrets

### Vercel
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

### AWS (optional)
- AWS_ROLE_TO_ASSUME
- AWS_REGION
- AWS_S3_BUCKET
- AWS_CLOUDFRONT_DISTRIBUTION_ID

## Recommended branch policy
- develop = working branch
- main = production branch

## Safe rule
Do not allow destructive DB migrations automatically unless separately approved.

## Notes
This is the deployment spine.
If the app build is still red, GitHub Actions will stop before deployment, which is correct behavior.
