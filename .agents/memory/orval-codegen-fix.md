---
name: Orval codegen type collision fix
description: How to prevent and fix the TS2308 name collision when orval generates both Zod validators and TypeScript interfaces with the same name
---

## The Problem

When an OpenAPI schema name in `components/schemas` matches what orval derives for a Zod validator (e.g., both named `RequestUploadUrlBody`), TypeScript raises:

```
TS2308: Module "./generated/api" has already exported a member named 'RequestUploadUrlBody'.
```

This happens because `lib/api-zod/src/index.ts` does `export * from './generated/api'` (Zod const) AND `export * from './generated/types'` (TS interface) for the same name.

## Root Cause Details

- orval regenerates `lib/api-zod/src/index.ts` on every run with `export *` for both generated dirs.
- The `types/` folder holds TS interfaces named after the schema in components/schemas.
- The `generated/api.ts` holds Zod const validators named after the operationId + role (body/response).
- When those names collide, `export *` from both causes TS2308.

## Fix Applied

**Naming convention:** When adding new storage/upload schemas to `components/schemas`, use names that DIFFER from what orval derives for the Zod validators:
- Orval derives Zod body name from operationId: `requestUploadUrl` → `RequestUploadUrlBody`
- So the schema in components was renamed to `StorageUploadInput` (TS type: `StorageUploadInput`, no clash)

**Post-codegen patch in `lib/api-spec/package.json`:**
```json
"codegen": "orval --config ./orval.config.ts && sed -i \"s/export \\* from '.\\/generated\\/types';/export type * from '.\\/generated\\/types';/\" ../../lib/api-zod/src/index.ts && pnpm -w run typecheck:libs"
```

This patches `lib/api-zod/src/index.ts` to use `export type *` for the types folder after every orval run, which allows value exports (Zod) and type exports (interfaces) to coexist with the same name.

**Why:** `export type *` re-exports only the type namespace, so a Zod `const RequestUploadUrlBody` (value) and an `interface RequestUploadUrlBody` (type) can share the same name without conflict.

## How To Apply

1. Choose schema names in `components/schemas` that are distinct from orval's derived Zod validator names.
2. Run `pnpm --filter @workspace/api-spec run codegen` — the sed patch runs automatically.
3. If running orval directly, follow with: `sed -i "s/export \* from '\.\/generated\/types';/export type * from '\.\/generated\/types';/" lib/api-zod/src/index.ts`
4. Never manually edit `lib/api-zod/src/index.ts` — orval overwrites it on every codegen run.
