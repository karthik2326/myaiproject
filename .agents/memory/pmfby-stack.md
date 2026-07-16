---
name: PMFBY Platform Stack
description: Key architecture decisions and gotchas for the PMFBY Crop Insurance AI Platform
---

## Orval Codegen
- Orval 8.21.0 fails with "Failed to resolve input" when YAML contains inline flow mappings with `format: date` or `format: date-time` (e.g. `{ type: string, format: date }`) — the fix is to use full block-style schemas in the openapi.yaml.
- `format: date` and `format: date-time` must be quoted (`"date"`, `"date-time"`) or be in block style. Inline YAML flow mappings with bare `date` caused silent parse failure.

**Why:** Drizzle's `sql` template tag parameterizes ALL interpolated values. PostgreSQL rejects `$1` as an argument to `DATE_TRUNC` (it only accepts a string literal, not a parameter). Use `sql.raw()` with a whitelisted string for function-level arguments.

## Route Layout
- Routes mounted at `/api` prefix in `app.ts`, individual route files register their own sub-paths
- All route files export a default `Router` instance; aggregated in `src/routes/index.ts`

## DB Schema
- 9 tables: farmers, fields, claims, predictions, inspections, anomalies, weather_events, activity_events, data_collections
- Numeric fields (severity_pct, confidence_score, latitude, longitude, estimated_loss, etc.) stored as `numeric` in Postgres — must be `parseFloat()` before returning from API

## GitHub Push
- User wants to push to https://github.com/karthik2326/myaiproject.git
- Token was provided in original session but got compacted — ask user to re-share
- Use `git remote add origin https://<token>@github.com/karthik2326/myaiproject.git` then `git push -u origin main`
