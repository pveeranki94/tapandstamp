# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tap & Stamp is an app-less loyalty system for independent cafés using branded Apple Wallet and Google Wallet passes. Customers scan QR codes to join and collect stamps; no app download or login required. The system generates branded wallet passes that update in real-time when customers scan "stamp" QR codes at the café counter.

**Key concepts:**
- **Join Flow**: Customer scans QR → adds branded pass to Apple/Google Wallet with 0/N stamps
- **Stamp Flow**: Customer scans at counter → pass updates with new stamp count (cooldown enforced)
- **Reward & Redeem**: When stamp_count reaches reward_goal, pass indicates "reward available"; staff can reset
- **Branding**: Each merchant has custom logo, colors, and stamp rendering; branding_version invalidates cached assets

## Architecture

This is a **pnpm monorepo** with workspace-based package management:

- **`apps/api`** — Express-based Node.js API serving join/stamp/redeem endpoints, PassKit web service, and admin routes
- **`apps/admin`** — Next.js 14 dashboard for merchant branding wizard, poster generation, and stats
- **`packages/core`** — Shared reward logic, TypeScript types, and environment utilities
- **`packages/db`** — Database schema migrations and query helpers (Postgres via Supabase)
- **`packages/imaging`** — Stamp strip image renderer (Sharp or Canvas) that generates 0..N PNGs per merchant branding
- **`packages/pass-apple`** — Apple PassKit builder: assembles .pkpass bundles, signs manifests, handles APNs push updates
- **`packages/pass-google`** — Google Wallet Objects: creates LoyaltyClass/LoyaltyObject, generates JWT Save links, PATCH updates

**Data Model** (see `packages/db/migrations/0001_init.sql`):
- `merchants`: slug, name, reward_goal, branding (JSONB), join_qr_url, stamp_qr_url
- `members`: merchant_id, device_type (apple/google/web), wallet_id, stamp_count, reward_available, last_stamp_at
- `visits`: audit trail of each stamp event (merchant_id, member_id, stamped_at)
- `passes`: per-platform pass state metadata

**Key flows:**
1. **Join**: `GET /add/:merchantSlug` → device detection → return `.pkpass` (Apple) or redirect to Google Wallet Save link
2. **Stamp**: `GET /stamp/:memberId` → cooldown check → increment stamp_count → APNs push (Apple) or PATCH LoyaltyObject (Google) → return updated state
3. **Redeem**: `POST /redeem/:memberId` → verify reward_available → reset to 0 → push/patch update

## Common Commands

```bash
# Install dependencies (requires Node 20+, pnpm 9+)
pnpm install

# Development - runs all app dev servers in parallel
pnpm dev

# Run specific app only
pnpm dev --filter ./apps/api
pnpm dev --filter ./apps/admin

# Build everything (packages first, then apps)
pnpm build

# Type checking across all packages
pnpm typecheck

# Lint all TypeScript/React code
pnpm lint
pnpm lint --fix

# Run tests
pnpm test
pnpm coverage

# Run tests in watch mode (useful during development)
pnpm test --watch

# Run tests for a specific package
pnpm --filter @tapandstamp/core test
```

## Development Workflow

**Working with packages:**
- Changes to `packages/*` are auto-reloaded by apps in dev mode via workspace protocol (`workspace:*`)
- Always build packages before building apps in production: `pnpm -r --filter './packages/*' build`

**Database migrations:**
- Schema lives in `packages/db/migrations/0001_init.sql`
- Apply via Supabase CLI or `packages/db/src/apply.ts` helper
- When modifying schema, update TypeScript types in `packages/core/src/types.ts`

**Testing strategy:**
- Unit tests beside source: `src/feature/__tests__/feature.test.ts`
- Cover cooldown logic, reward rollover, redemption resets in `packages/core`
- Snapshot wallet payloads in `packages/pass-apple` and `packages/pass-google`
- Target >80% coverage on business logic; see `jest.config.js` in each package

**Environment variables:**
- Never commit `.env` or `.env.local` files
- Use `apps/api/env/.env.example` as template
- Required secrets: Apple PassKit cert (.p12), APNs auth key (.p8), Google service account JSON
- Store in platform secrets manager (Vercel, Render, etc.) in production

## Code Style

- **TypeScript strict mode** with ES2022 target
- **Indentation:** 2 spaces, Prettier enforced (trailing commas, single quotes where applicable)
- **File naming:** kebab-case (`stamp-service.ts`), PascalCase for React components
- **Imports:** Use `.js` extensions in ESM imports even for `.ts` files (NodeNext resolution)
- **Constants:** SCREAMING_SNAKE_CASE for env vars; camelCase for domain constants
- Run `pnpm lint --fix` before commits; CI will fail on lint errors

## Project-Specific Patterns

**Branding assets:**
- Logo upload → normalize to required sizes (logo.png, icon.png for PassKit)
- Generate 0..N stamp strip images: `stamps/<merchantSlug>/v<brandingVersion>_<X>of<N>.png`
- Bump `branding_version` on merchant branding updates to invalidate CDN cache

**Stamp cooldown:**
- Enforce 5-minute minimum between stamps: `now - last_stamp_at < 5min` → reject with 429
- Prevent fraud via rate limiting (per IP and per member_id)

**Apple PassKit web service:**
- Required endpoints in `apps/api/src/passkit/`:
  - `POST /passkit/v1/devices/:deviceId/registrations/:passTypeId/:serial` (register push token)
  - `GET /passkit/v1/passes/:passTypeId/:serial` (return updated pass.json + assets)
  - `DELETE .../registrations/...` (unregister)
- On stamp/redeem: APNs push → iOS requests updated pass → server returns new `pass.json` with updated `strip.png`

**Google Wallet Objects:**
- One `LoyaltyClass` per merchant (defines branding)
- One `LoyaltyObject` per member (holds `loyaltyPoints.balance` = stamp_count, barcode = member.id)
- Update via `PATCH` to Google Wallet API with new balance and `imageModulesData[0].mainImage.uri`

## Reference Documentation

- **PRD**: `PRD_TapAndStamp_v0.1.md` — product vision, use cases, MVP scope
- **TDD**: `TDD_TapAndStamp_MVP_v0.1.md` — technical design, data model, API endpoints, implementation phases
- **AGENTS.md**: `AGENTS.md` — repository coding guidelines and conventions (prefer editing over creating files, module organization, testing requirements)

When in doubt about scope or requirements, consult these docs first. When modifying core architecture or data schema, update the relevant doc alongside code changes.
