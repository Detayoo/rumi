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

## amendments (2026-08-07, first real adapters)

- **on-the-wire key for the pre-accounts phase**: the ask request body may carry an
  `apiKey` for a real vendor. it is used for that request only, is never stored or logged,
  and is removed when accounts land (server resolves from the user's encrypted settings).
- **real adapters shipped**: `openai`, `anthropic`, `google` — one file each in
  `provider-adapters/src/adapters/`, sharing the prompt/parse layer (`prompts.ts`):
  structural system/context/question separation (§7.5 injection resistance), json-object
  contract (§7.4), retry-once-with-stricter-instruction on parse failure, and the server
  stamps `spoilerLevelUsed` (the model never claims the boundary).
- **client-safe export split**: the barrel (`.`) is server-only (SDKs). `./models` (curated
  model lists for the picker) and `./mock` (metadata mock, no node builtins) are the
  client-safe subpaths — a client import of the barrel is a build error, not a leak.
- **cost note**: with byok, the end user's key is charged for their own tokens; the product
  pays only for env-configured defaults. §7.5 caps stay as abuse controls.
