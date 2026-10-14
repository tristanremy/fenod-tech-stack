---
title: "Effect Lane"
description: "Opt-in standards for backend code written with Effect 4 on Cloudflare. Own products only."
verified: 2026-10
---

The Effect lane exists for one reason: **move review into the types.** In plain TypeScript a signature hides thrown errors, imported dependencies, and casts, so checking agent code means reading bodies. In Effect, `Effect<Success, Error, Requirements>` shows what can fail and what the code needs, and the compiler rejects an unhandled failure or a missing dependency. The reviewer reads signatures, schemas, and error translation instead of every line.

Status: **pilot**, see [plan 011](../plans/011-effect-lane-pilot.md). The Stack Contract still wins everywhere this lane is not switched on.

Adapted from Dillon Mulroy's [`cf-workflow-pool`](https://github.com/dmmulroy/cf-workflow-pool) standards, which is also the reference implementation for patterns (`packages/wf-pool`).

## When

Use it for:

- own products (not client deliverables)
- backend services with external APIs, retries, timeouts, queues, Workflows, multi-step pipelines, or AI calls
- projects that adopted Alchemy v2 through its gate ([Cloudflare tooling](cloudflare-tooling.md)); Alchemy v2 is itself built on Effect

Do not use it for:

- Fenod client work. A client must be able to hire a regular TypeScript freelancer later.
- UI code. React components, routes, and TanStack Query stay in the default lane.
- one-Worker CRUD with nothing that fails in interesting ways

## Opt in

The project `STACK.md` contains this line:

```md
Lane: effect (backend services under src/server/ only; UI stays default lane)
```

Agents load this page only when that line exists. Everything not covered here follows the Stack Contract.

## Versions

Effect 4 (4.0.x) is a recent major with large API changes from Effect 3, and Alchemy v2 is beta; both differ from training data. Pin exact versions (no `^`). **Before writing code against `effect` or `alchemy`, read the installed source and types under `node_modules/effect` and `node_modules/alchemy`.** When unsure how something is done, look in `packages/wf-pool` of the reference repo before inventing a pattern.

## 1. Parse once, at the boundary

Unknown data: request bodies, webhook payloads, queue messages, env, KV/R2 JSON, D1 JSON text columns, AI model output. Decode it once, in the adapter that receives it, into the strongest type. Inner code only receives parsed domain values.

```ts
import { Effect, Schema } from "effect";

export const BookingId = Schema.String.pipe(Schema.brand("BookingId"));
export type BookingId = typeof BookingId.Type;

export const CreateBookingCommand = Schema.Struct({
  guestName: Schema.String,
  date: Schema.String,
});

// private to the adapter
const decodeCreateBookingCommand = Schema.decodeUnknownEffect(CreateBookingCommand);

const command = yield* decodeCreateBookingCommand(body);
return yield* bookings.createBooking(command);
```

- IDs are branded schemas. Never a bare `string` for an ID after parsing.
- Drizzle column types are trusted as typed. Decode JSON text columns and text enums with a schema.
- Never re-parse a value that is already parsed. Never round-trip through JSON to change a type.

## 2. No casts, no `any`, no `!`

Enforced by lint (see below). Review blockers:

- `as unknown as T`, `as any as T`, any `as` that is not `as const`
- `any`, non-null `!`
- a known value widened to `unknown`, `object`, or `Record<string, unknown>`
- a hand-written type that copies a type the library already exports

A library internal may keep one assertion when TypeScript cannot express a proven invariant. It sits on one expression, close to the value's origin, with these lines directly above it:

```ts
// SAFETY: <where the value comes from and which invariant makes it a T>
// Verified by: <test name that fails if the invariant breaks>
// oxlint-disable-next-line typescript/consistent-type-assertions
```

Missing any of the three lines blocks the review.

## 3. Optional values are `Option`

Inside the application, optional means `Option.Option<A>`, never `null`, `undefined`, or `?:`. Decode nullable input with `Schema.OptionFromNullOr` at the boundary. Encode back only when an external contract needs `null`.

## 4. Errors are tagged, translated by tag

Read [errors.md](errors.md) first. Each failure is a `Schema.TaggedError` with typed fields:

```ts
export const BookingStoreFailureReason = Schema.Literals(["NotFound", "PersistenceFailed"]);

/** Booking storage failed. `PersistenceFailed` is safe to retry; `NotFound` is not. */
export class BookingStoreFailed extends Schema.TaggedError<BookingStoreFailed>()(
  "BookingStoreFailed",
  {
    bookingId: BookingId,
    reason: BookingStoreFailureReason,
    message: Schema.String,
  },
) {}
```

Translate at each boundary with `Effect.catchTags`, one entry per tag. Pass through an error that is already correct by failing with it again. No catch-all and no broad `Effect.mapError` over several tags: an unhandled tag must stay in the error type until someone decides its translation. Wrap promise APIs (Drizzle, fetch, SDKs) with `Effect.tryPromise({ try, catch })` and return a tagged error from `catch`.

## 5. Services and Layers

One file per capability, named for it (`booking-store.ts`). In this order:

1. `IBookingStore`: the interface callers see
2. `BookingStore`: `Context.Service` class
3. `makeBookingStore`: constructor that `yield*`s its dependencies
4. `bookingStoreLayerWithoutDependencies`: `Layer.effect(BookingStore, makeBookingStore)`
5. `bookingStoreLayer`: production dependencies provided
6. `bookingStoreTestLayer`: honest test dependencies provided

```ts
export interface IBookingStore {
  readonly findBooking: (id: BookingId) => Effect.Effect<Booking, BookingStoreFailed>;
}

export class BookingStore extends Context.Service<BookingStore, IBookingStore>()(
  "@app/BookingStore",
) {}
```

- Only `*.test.*` files import a `make<X>` function. Everything else imports the Layer and `yield*`s the service.
- Dependencies stay in the Layer requirement channel until the composition root provides them. No passing services as plain function arguments.
- The Stack Contract says no repository layer around Drizzle. In this lane a `<Thing>Store` service around Drizzle **is** expected: it is the Layer seam that gives honest test Layers and typed persistence errors.
- No `Tag` in names. Every exported symbol carries the capability name.

## 6. Code style

- Business logic: `Effect.fn("BookingService.createBooking")(function* (...) { ... })`. The name becomes the trace span.
- Cross-cutting policy (retry, timeout, span, error translation, Layer provision): `.pipe(...)` or the extra arguments of `Effect.fn`.
- More than one dependent `flatMap` / `andThen`: rewrite as a generator.
- Imports: `import { Effect, Layer, Schema } from "effect"`. Unstable modules from their narrow entry (`effect/unstable/http`). Never `import * as Effect from "effect/Effect"`.

## 7. Cloudflare specifics

- Composition root: the Alchemy v2 Worker `.make()` (see the reference README), or one entry file that provides every Layer and runs the program per request.
- Durable Objects only on a Stack Contract trigger. Treat each as its own HTTP service with an Effect `HttpApi`, keyed by its canonical branded ID. Build stubs and clients inside the current invocation, never cached across requests.
- HTTP routes are versioned from `/v1`. The `HttpApi` contract is the source of truth for OpenAPI; never hand-edit generated specs.
- Every Worker keeps Workers Observability. `Effect.fn` spans plus `requestId` on logs are the debugging signal.

## 8. Tests

- Vitest, through the service interface, with the `TestLayer`. Test Layers behave like production (in-memory store, not a mock that returns `undefined`).
- No tests that only restate a schema. Test transformations, edge cases that regressed, and boundary behavior seen by callers.

## 9. JSDoc

Every export gets JSDoc stating the sharpest fact the signature does not show: failure meaning, side effects, invariants, retry safety. Expected typed errors go in the prose or `@returns`, not `@throws`.

## Lint

The starter's `oxlint.config.ts` already rejects casts, `any` and `!` in every lane, with installed shadcn source under `src/components/ui/**` exempt. Keep those rules when opting in.

When the repo runs type-aware Oxlint, also turn on `typescript/no-unsafe-type-assertion` and `typescript/no-unnecessary-type-assertion`. The `make<X>` import rule has no lint rule yet; review checks it.

## Done

Same ship gate as the Stack Contract (`pnpm lint && pnpm typecheck && pnpm test`), then a PR with the review packet from [review-guide.md](review-guide.md). Before declaring done, re-read this page and check the diff against sections 1 to 5.
