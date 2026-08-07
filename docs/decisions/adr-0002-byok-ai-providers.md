# ADR-0002: bring-your-own-key (byok) ai providers

- **status:** accepted
- **date:** 2026-08-07
- **supersedes:** n/a (extends adr-0001)

## context

adr-0001 kept ai calls behind `provider-adapters` with a mock default. product direction since:
end users bring their **own api key** and pick the **model** they want. this changes who pays
(§7.5 budget caps become per-user, since users pay for their own tokens), and it means model
selection is a per-request, per-user concern, not a hardcoded server constant.

open questions from requirements.md §19 that this partially answers:
- §19.2 (which ai vendor) — becomes "every vendor we register an adapter for"
- §19.3 (billing) — no subscription needed: users pay their own key; the product can later
  add server-provisioned models as a paid tier

## decision

- `ai-contracts` gains `aiProviderSelectionSchema` (`{ vendor, model }`) and the ask request
  body is `context + optional provider`.
- `provider-adapters` gains a **registry**: `AiVendorAdapter { vendor, availableModels,
  create(selection, apiKey) }`, a `createAiProvider` factory, and `resolveAiProvider` —
  the single resolver. today it reads env (`SC_AI_VENDOR`/`SC_AI_MODEL`/`SC_AI_API_KEY`);
  in the accounts phase it reads the user's stored (encrypted) provider config and returns
  the same shape, so application code never changes.
- request priority: explicit byok selection → server env config → mock (always runnable,
  always free).
- **fail loudly, never silently mock**: a configured vendor without an adapter or key throws
  `ProviderNotConfiguredError`; the ask route returns a typed 500 envelope and the ui shows
  the degraded-mode card (§7.6). a user who asked for gpt must not receive canned text.
- `availableModels` drives the future byok settings screen (vendor → model picker).

## consequences

- adding a real vendor = one adapter module + registry entry (+ sdk dep). no app changes.
- user api keys: stored server-side encrypted at rest (accounts phase), never returned to the
  client (only vendor + model names). server-side key rotation per §13.
- mock stays the default so the repo runs without secrets and tests stay deterministic.
