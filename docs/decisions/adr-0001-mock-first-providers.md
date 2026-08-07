# ADR-0001: mock-first providers, real vendors deferred

- **status:** accepted
- **date:** 2026-08-07
- **supersedes:** n/a

## context

requirements.md §7.7 requires all ai calls to route through `packages/provider-adapters`
(interface `ask(context) -> ValidatedResponse`), and §4 requires the same for metadata. §17
instructs the agent to use mocked metadata before real providers. §19 lists open questions that
cannot be resolved by an agent: which metadata provider (and whether its tos permits caching +
ai generation per §12), which ai model vendor (and whether a fallback vendor exists for §7.6).

## decision

- Phase 1–2 ship `MetadataProvider` and `AiProvider` **interfaces** plus **in-memory mock
  implementations** only. No vendor sdk is added to the repo.
- The spoiler-boundary retrieval filter (`packages/shared-utils/spoiler-boundary.ts`) is real
  logic, not a mock — it is the core trust control and is developed against adversarial tests
  first (§14, §17).
- Application code never imports a vendor sdk; it only depends on the provider interfaces.

## consequences

- Swapping in a real vendor later touches only `provider-adapters` + env config. ✓
- The mock ai provider must never be a security control: it validates against the same zod
  contract the real one will (§7.4). ✓
- Open: metadata provider tos review (risk register: high), fallback vendor for degraded mode.
