# Repository Guidelines

## Project Structure & Module Organization
Keep runtime code in `apps/`, using `apps/api/src` for the Node API and `apps/admin` for the dashboard UI. Shared wallet builders, branding utilities, and Supabase clients belong in `packages/` with workspace-aware imports. Generated imagery lives under `assets/branding`, `assets/stamps`, and `assets/posters` (git-ignored). Tests should mirror source layout via `__tests__` folders. Product docs (`PRD_TapAndStamp_v0.1.md`, `TDD_TapAndStamp_MVP_v0.1.md`) remain at the repo root and must change when scope or architecture shifts.

## Build, Test, and Development Commands
Use pnpm for all workflows:
- `pnpm install` — install dependencies (Node 18+ required).
- `pnpm dev` — launch API hot reload and the dashboard dev server.
- `pnpm test` — run the Jest suite (unit + integration).
- `pnpm lint` — execute ESLint and Prettier; fix before committing.
- `pnpm build` — emit production bundles and validate type safety.

## Coding Style & Naming Conventions
Follow TypeScript strict mode with 2-space indentation and Prettier trailing commas. Use kebab-case for files (`stamp-service.ts`), PascalCase for React components, and SCREAMING_SNAKE_CASE for env vars. Store domain models in `*.model.ts` files and expose factories rather than mutable singletons. Run `pnpm lint --fix` before a PR; never commit generated assets or `.env*`.

## Testing Guidelines
Write Jest unit tests beside the code (`feature/__tests__/feature.test.ts`) and cover cooldowns, reward rollover, and redemption resets. Integration tests should spin up Supabase containers via scripts in `scripts/`. Target >80% coverage on core business logic and snapshot critical wallet payloads. Use `pnpm test --watch` during feature work and keep mock data in `fixtures/`.

## Commit & Pull Request Guidelines
Use imperative, sentence-case commit subjects (e.g., `Add stamp cooldown guard`) and keep changes scoped. PRs must include a concise summary, impacted-area checklist, linked issues (`Closes #42`), UI screenshots when relevant, and callouts for new migrations or secrets. Confirm lint and tests pass locally before requesting review.

## Security & Configuration Tips
Store credentials in `.env.local` and sync shared secrets through the team vault, never via Git. Rotate Apple PassKit and Google service account keys quarterly and confirm Supabase row-level security (RLS) is enabled before deploys. Document new environment variables in `README.md` and supply safe defaults in `env.example`.
