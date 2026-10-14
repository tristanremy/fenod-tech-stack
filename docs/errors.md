---
title: "Error Design"
description: "How Fenod code names, carries, translates, and shows failures. Applies to every lane."
verified: 2026-10
---

Errors are part of the product interface and of observability. A good error lets a person or an agent understand what happened, decide what to do next, and find the matching trace, without leaking internals.

Adapted from Dillon Mulroy's [`cf-workflow-pool/docs/errors.md`](https://github.com/dmmulroy/cf-workflow-pool/blob/main/docs/errors.md). Applies to the default lane (Start server functions, Hono + ORPC) and to the opt-in [Effect lane](effect-lane.md).

## Messages

Every error message does three things:

1. **Says what failed.** Name the operation and the most specific safe reason known. Never `Something went wrong` when the cause is classified.
2. **Says what to do next.** One of: fix the input and retry; retry the same operation (only when that is safe); check or reconcile the named resource when the outcome is unknown; contact support with the `requestId`.
3. **Only reassures when it can prove it.** Say "nothing was charged" only if the failed operation could not have charged. Across non-atomic steps, say the outcome is unknown and point to the resource to check.

Tone is calm and direct. No jokes, no blame, no stack traces, no SQL, no vendor names, no internal service names in public messages.

```text
Good: Booking bk_… was not found. Check the booking link and try again.
Bad:  Something went wrong.
Bad:  D1_ERROR: no such row in bookings
```

## Language

- `code` and server-side `message` are English: stable, searchable in the source, readable by agents and API consumers.
- The UI never shows a raw server `message` to end users. It maps `code` to French copy (or the client's locale). Unknown codes fall back to one generic French message that includes the `requestId`.

## Retry

`retryable` is true only when repeating the **same logical operation** cannot create a second one: idempotent by design, or protected by an idempotency key. If the operation may have partly happened, `retryable` is false and the message says what to check.

## Context carried by an error

Typed fields, not prose to parse:

- stable code (or Effect `_tag`)
- operation that failed
- safe domain IDs (`bookingId`, `invoiceId`)
- classified `reason` as a literal union
- field violations and accepted constraints for input errors
- `retryable`
- `requestId` at public boundaries

Details are typed per code. No free-form `Record<string, unknown>` that lets a code and its details disagree.

## Public envelope

Every public failure has the same shape:

```json
{
  "code": "BookingNotFound",
  "message": "Booking bk_123 was not found. Check the booking link and try again.",
  "details": { "bookingId": "bk_123" },
  "requestId": "8c1f2a9e4b7d6c3a",
  "retryable": false
}
```

Over ORPC the error JSON is `{ defined, code, status, message, data }`. Put `details`, `requestId` and `retryable` inside `data`, typed per code.

## requestId

One per request. Use the `cf-ray` header when present, else `crypto.randomUUID()`. Put it on every structured log line (Workers Observability), on Sentry events when Sentry is enabled, and in every public error.

## HTTP status

Pick the status from what the caller sees, not from what broke inside:

| Status | Meaning |
|---|---|
| 400 | caller can fix the request data |
| 401 | not authenticated |
| 403 | authenticated, not allowed |
| 404 | valid ID, unknown resource |
| 409 | current state conflicts with the operation |
| 429 | rate limited; include when to retry |
| 500 | internal invariant or non-transient internal failure |
| 503 | a dependency is temporarily unavailable |

## Never in public output

Credentials, tokens, JWT claims, session data, raw request bodies, SQL, stack traces, vendor response bodies, schema parse issues that echo input. Redaction keeps the operation and the requested ID.

## Translate explicitly

Every **expected** failure gets a deliberate decision: code, status, message, details, `retryable`. A new failure type must force that decision instead of falling into a generic bucket.

**Default lane**

- Start server functions (the default): return a typed outcome for expected failures, `{ ok: true; value: T } | { ok: false; reason: <literal union> }`, as `ItemOutcome` in `examples/smoke/src/server/items.ts`. Throw only for defects.
- ORPC, only when the app has an API boundary: declare expected failures with `.errors({ BookingNotFound: { status: 404, data: z.object({...}) } })` and throw `errors.BookingNotFound({ message, data })`. Clients branch with `isDefinedError`.
- One outermost handler (Hono `onError`, ORPC interceptor) turns **unexpected** throws into `500 InternalError` with a `requestId` and logs the cause. That handler never maps an unknown throw to a specific domain code.

**Effect lane**

Each failure is a `Schema.TaggedError`. Translate with `Effect.catchTag` / `Effect.catchTags`, listing each tag. No catch-all: an unhandled tag stays in the error type until someone decides how to translate it. See [effect-lane.md](effect-lane.md).

Before writing against ORPC or Effect error APIs, read the installed types in `node_modules`. Both move faster than training data.

## Review checklist

1. Does it name the operation and the most specific safe reason?
2. Does it carry typed context instead of prose?
3. Does it tell the caller how to fix, retry, check, or escalate?
4. Are reassurance and `retryable` provably true?
5. Is the tone calm, without blame or internal jargon?
6. Can the code or message be found with one search in the source?
7. Does the public error carry a `requestId` that matches a log line?
8. Are secrets, private causes, and raw external data kept out?
9. Was every boundary translated on purpose, with no generic catch-all for expected failures?
