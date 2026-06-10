# 005 — TanStack DB offline-first spike findings

| | |
|---|---|
| Date | 2026-06 |
| Actual time | ~45 minutes documentation/release research |
| Scope | Research spike only; no scratch app built |
| Verdict | Wait |

## Versions and sources checked

- TanStack DB 0.6 announcement: persistence, offline support, hierarchical data, row metadata, and reactive effects.
- TanStack DB persistence skill/docs: SQLite-backed adapters across browser, React Native, Expo, Node, Electron, Capacitor, Tauri, and Durable Objects.
- TanStack offline transactions skill/docs: persistent outbox, retry, leader election, connectivity detection.
- PowerSync collection docs: offline-ready persistence and real-time sync via PowerSync.

## Five answers

### 1. Offline mutation → reconnect → sync without custom conflict code?

Promising, but not accepted as the Fenod default yet. TanStack DB now has offline transaction primitives and adapters, but server sync depends on the chosen collection backend such as PowerSync, Electric, Query, or a custom endpoint. The default conflict behavior is not yet simple enough to replace this handbook's explicit sync guidance without a real app spike.

### 2. Does persistence survive a full offline page reload?

The 0.6 docs indicate yes when using the SQLite-backed persistence layer, including browser WA-SQLite/OPFS. This still needs a scratch app verification before becoming the default.

### 3. Client bundle delta vs same app without TanStack DB?

Not measured. The planned scratch app was not built in this pass. Treat bundle impact as unknown.

### 4. Does it coexist with TanStack Query?

Yes in principle. TanStack DB is designed to integrate with the existing TanStack ecosystem and can project normalized data into UI-shaped queries. However, it may want to own more of the client data layer than a simple TanStack Query cache, so adoption should be per offline-heavy app rather than global.

### 5. Stability signals

Positive: 0.6 added important production-shaped features: persistence, offline support, includes, effects, metadata. Risk remains because the library is young and the exact sync stack choice materially changes complexity.

## Verdict

**Wait.** Revisit when TanStack DB reaches 1.0 or after a real one-day scratch app proves browser persistence, offline mutation replay, conflict behavior, and bundle delta against a local Hono endpoint.

## Follow-up trigger

Create a new adoption plan if a Fenod project actually needs full offline-first behavior and can fund a one-day scratch implementation.
