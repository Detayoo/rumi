# screen companion

Spoiler-aware AI companion for movies and TV. Pick a title and episode, set a spoiler boundary
(none → episode-only → season-only → full-series), ask questions. Answers are grounded in
retrieved metadata — never model memory — and validated against a zod schema before rendering.

## monorepo

```text
apps/web   next.js browser app + pwa target
apps/tv    static webos client (later phases)
packages/
  design-tokens    css custom properties + typed exports (browser.css / tv.css share names)
  ui               box-based component library (one primitive: Box)
  ai-contracts     request context + ai response contract (zod)
  validation       error envelope + pagination contracts
  shared-utils     spoiler-boundary retrieval filter + adversarial tests
  types            shared domain types
  api-client       typed client (envelope + pagination aware)
  provider-adapters  metadata + ai vendor interfaces (mock-first, see docs/decisions)
```

## commands

```text
pnpm install
pnpm dev          # web app
pnpm test         # vitest — includes adversarial spoiler-boundary tests
pnpm typecheck
pnpm build
```

## docs

- `docs/product-requirements.md` — product & engineering requirements v2 (source of truth)
- `docs/design-system.md` — design tokens + box component system
- `docs/decisions/` — architecture decision records

## status

phase 1 (browser foundation: tokens, ui package, web shell, spoiler-boundary core).
