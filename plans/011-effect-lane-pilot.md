# 011 - Pilot: Effect lane for own-product backends

| | |
|---|---|
| Status | PROPOSED |
| Effort | M (timeboxed: 2 weeks of normal product work) |
| Risk | Medium (Effect 4 is a recent major; Alchemy v2 is beta) |
| Written against | `8f0a5af` |
| Depends on | nothing; needs one own-product backend service outside this repo |

## Why this matters

The maintainer no longer writes code; agents do, and review is the bottleneck. Effect puts failures and dependencies into the type of every function, and the compiler rejects unhandled failures and missing dependencies. The thesis: in Effect, a reviewer can trust agent code from signatures, schemas and error translation, and read far fewer bodies. Dillon Mulroy reports this with recent models on Effect codebases ([`cf-workflow-pool`](https://github.com/dmmulroy/cf-workflow-pool)). That is an anecdote from a greenfield, Effect-fluent setup. The pilot measures it on Fenod work.

The Stack Contract keeps Effect out of the default stack. This pilot tests it only in a narrow, opt-in lane; client work stays out of scope whatever the result.

## Scope

- **In:** one own-product backend service with external APIs, retries, and async steps (Queues or Workflows). Built in the Effect lane per `docs/effect-lane.md`. UI stays in the default lane.
- **Out:** client deliverables, UI, migrating existing services, Durable Objects unless the service already needs one.
- **Baseline:** a comparable default-lane service built in the same period, same agents, same review packet.

## Protocol

1. Opt the project in with `Lane: effect` in its `STACK.md`. Pin exact `effect` and `alchemy` versions; record them in the findings.
2. Agents build the service with `docs/effect-lane.md`, `docs/errors.md`, and the review packet from `docs/review-guide.md`.
3. For every PR in both lanes, record:
   - maintainer minutes spent reviewing
   - whether reading bodies was needed beyond the always-read list (yes / no)
   - CI-red rounds before green
   - defects found after merge, within the timebox
   - agent errors caused by Effect API drift (wrong API from training data)
4. **Timebox: 2 weeks.** If agents keep producing non-compiling Effect after the `node_modules` rule is in place, that is the finding: stop and write it up.

## Decision rule

- **Adopt** the lane for own-product backends if median review time drops by 30% or more and post-merge defects do not rise.
- **Stop** otherwise. Keep `docs/errors.md` and `docs/review-guide.md` either way: they are lane-agnostic.
- Client work stays default lane whatever the result.

## Deliverable

`plans/findings/011-effect-lane-pilot.md` with the numbers above, pinned versions, the three worst agent mistakes, and the verdict. Then update this plan's Status and the README table.

## Gates

- `pnpm check` passes with the new docs routed in `llms.txt` and `agent-context.json`.
- Findings file exists before Status moves to DONE.
