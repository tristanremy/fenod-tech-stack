# 005 — Spike: TanStack DB as the offline-first default (replace hand-rolled IndexedDB sync)

| | |
|---|---|
| Status | DONE |
| Priority | 5 (highest learning value, lowest urgency) |
| Effort | M (timeboxed: 1 day max) |
| Risk | Medium (young library — that's what the spike measures) |
| Written against | commit `4f918dc` |
| Depends on | nothing in this repo; needs a scratch TanStack Start project outside it |

## Why this matters

`src/content/docs/offline-first-guide.md` (~814 lines) documents a hand-rolled offline stack: PWA + IndexedDB + custom sync. TanStack DB has since shipped: a client-side reactive database on differential dataflow that plugs into existing `useQuery` calls, with (as of 0.6) SQLite-backed persistence, hierarchical includes, and reactive effects. If it holds up, it replaces most of the guide's custom plumbing with a maintained library from the ecosystem the stack already bets on — relevant to wedding/booking and capture-type apps where offline matters.

**Spike, not adoption.** Output = a written verdict, not production code.

## Spike protocol

1. Scaffold a scratch app outside this repo: `pnpm create @tanstack/start@latest tsdb-spike --add-ons tanstack-query`. Pin versions; record them in the findings.
2. Smallest honest test case: list + detail over one entity (`guests`: id, name, status) backed by TanStack DB collections, synced against a trivial Hono endpoint on a local Worker (in-memory array — the spike tests the client layer, not D1).
3. Answer five questions explicitly:
   - Offline mutation → reconnect → sync without custom conflict code? Default conflict behavior?
   - Does persistence survive a full offline page reload?
   - Client bundle delta vs the same app without TanStack DB (`pnpm build`)?
   - Does it coexist with plain TanStack Query, or want to own everything?
   - Stability signals: version, 3-month changelog churn, open persistence issues.
4. **Timebox: 1 day.** If the basic sync loop fails after half a day of honest effort, that IS the finding — stop and write it up.

## Deliverable

`plans/findings/005-tanstack-db-spike.md`: versions, five answers, one verdict line:

- **Adopt** → follow-up plan: rewrite offline-first-guide.md around TanStack DB (Guide Shape, fr alignment, `verified:` bump), add it to stack-contract.md and `skills/fenod-stack/SKILL.md`. Adoption changes happen in that follow-up, never in the spike.
- **Wait** → record blockers + a re-check trigger ("revisit at 1.0" / "when issue #NNN closes").
- **Reject** → record why; add to "considered and rejected" in `plans/README.md`.

Whatever the verdict, add one line at the top of offline-first-guide.md recording it ("TanStack DB evaluated <date>: <verdict>") so future agents don't re-propose the evaluation, and bump its `verified:`.

## Hard boundaries

- No repo changes except: findings doc, the one-line verdict note in offline-first-guide.md, plan index status. The scratch app is disposable and lives outside the repo.
- No migration of any real project.
- Only the five questions; no dataflow-internals benchmarking.

## Done criteria

- Findings doc exists, five answers + one verdict; actual time noted, ≤ 1 day.
- `pnpm check` passes after the verdict-note edit.

## Escape hatches

- If TanStack DB doesn't cover server sync at all yet at execution time: answer question 1 "not supported", skip dependents, verdict **Wait** with that trigger.
