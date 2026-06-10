# 004 — Document the TypeScript 7 / tsgo API constraint (Strada tooling incompatibility)

| | |
|---|---|
| Status | DONE |
| Priority | 4 |
| Effort | S |
| Risk | Low |
| Written against | commit `4f918dc` |
| Depends on | nothing (parallel to 001) |

## Why this matters

The stack uses tsgo for type checking (tooling.md Default Stack table; `"typecheck": "tsgo --noEmit"` pattern). That usage is correct: TypeScript 7's type-checking is near-complete and reliable for validating builds. What no page says: **TS 7 (Corsa) does not support the legacy programmatic API (Strada)** — tools consuming the TS API (some linters, codemods, IDE tooling) won't work against it. Microsoft's workaround: run `typescript` (6.x) side-by-side with the native preview; a stable Corsa API only arrives with TS 7.1. Without this, an agent may "clean up" a repo by removing the `typescript` dependency because "tsgo replaces it", silently breaking API-dependent tooling.

`grep -rn "Strada\|Corsa\|native-preview\|side-by-side" src/content/docs/tooling.md` → empty at 4f918dc.

## Steps

1. **`src/content/docs/tooling.md`:** under the VoidZero Direction section, add `### tsgo and TypeScript 7` (~10 lines): tsgo = TS 7 (native, Go), use it for typecheck scripts and CI gates; TS 7 has no Strada API — keep `typescript` installed side-by-side for API-consuming tooling; removing it is not a cleanup. **Check at execution time** whether TS 7.0 stable has shipped under the `typescript` package name (beta via `@typescript/native-preview@beta` as of April 2026; stable planned under `typescript` with a `@typescript/typescript6` compat package) and write the install line that matches reality. Bump `verified:`.
2. **Tooling Rules for Agents** (same page): add "Do not remove the `typescript` package when tsgo is present; intentionally side-by-side until the Corsa API stabilizes (TS 7.1+)."
3. **`src/content/docs/gotchas.md`:** add `## tsgo Does Not Replace the typescript Package` with the same trap in 3 lines — gotchas.md is the page agents read first (per the README AI entry points), so the trap must live there too.
4. **React Doctor check:** determine from public docs whether React Doctor consumes the TS API. If incompatible with tsgo, one sentence in testing.md noting it runs against the 6.x install. If undeterminable: write "compatibility with the TS7 API unverified" — do not guess.
5. **`skills/fenod-quality/SKILL.md`:** append the step-2 rule to the verification ladder section.
6. **French alignment** for tooling.md (107-line fr page) and fr/gotchas.md: mirror or drift-note per `/freshness/`.
7. **Run `pnpm check`.**

## Out of scope

- No version bumps; note that this repo's own `package.json` uses `typescript: latest` for `astro check` — leave it.
- Do not rewrite the VoidZero adoption tables.

## Done criteria

- `pnpm check` passes; `grep -c "side-by-side" src/content/docs/tooling.md` ≥ 1; gotchas entry exists.
- The subsection matches the actual TS 7 release status at execution time.

## Escape hatches

- If TS 7.1 with a stable API has shipped at execution time, soften the side-by-side warning to "only for tools not yet migrated" — verify against Microsoft's blog before softening.

## Maintenance note

Temporary by design — revisit when TS 7.1 ships a stable API.
