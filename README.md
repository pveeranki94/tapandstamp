# Tap & Stamp Monorepo

A pnpm workspaces setup for the Tap & Stamp MVP, covering the API, admin shell, and shared libraries.

## Getting Started

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm coverage
```

### Local Development

```bash
pnpm dev           # run all app dev servers
pnpm dev --filter ./apps/api
pnpm build         # build packages then apps
```

### Workspace Summary

- `apps/api` — Express API placeholder routes
- `apps/admin` — Next.js admin shell
- `packages/*` — shared utilities, data access, imaging, and pass contracts
- `assets/` — reserved folders for generated brand and poster assets

CI runs type checking, linting, tests, and coverage on every push.
