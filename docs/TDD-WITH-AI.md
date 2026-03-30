# TDD with AI

[Disponible en francais](./fr/TDD-WITH-AI.md)

AI makes it easier to produce code quickly. TDD makes that speed trustworthy.

## Why TDD Matters More with AI

- AI is good at producing plausible code, not guaranteed-correct code.
- A failing test turns vague intent into an executable contract.
- Small red/green/refactor loops keep AI from wandering into broad rewrites.
- Refactoring becomes safer because behavior is pinned before the model starts reorganizing code.

## Where It Pays Off First

| Area | TDD fit | Why |
|------|---------|-----|
| Services and business rules | High | Logic is compact, deterministic, and easy to verify |
| Routers, loaders, and actions | High | Public contracts matter more than internal implementation |
| Validation, parsing, and mappers | High | Edge cases are easy to miss without examples |
| Critical UI flows | Medium | Focus on user behavior, not component internals |
| Pure presentational UI | Low | Manual review is often cheaper than over-testing styling |

## Recommended Loop

### 1. Write one failing test

Start from the behavior you want, not from the implementation you expect.

### 2. Ask AI for the smallest change that makes it pass

Do not ask for a cleanup, optimization, and architecture rewrite in the same step.

### 3. Run the narrowest useful check

Run the targeted test first. Then widen the verification surface if the change touches more than one layer.

### 4. Refactor while green

Once the behavior is protected, use AI to simplify names, extract duplication, or align with existing patterns.

### 5. Add the next case

Grow coverage by behavior: edge cases, error paths, auth rules, null states, and retries.

## Prompt Ladder

### Red

```text
Add one failing test that describes this behavior.
Keep the test focused on the public contract.
Do not change the implementation yet.
```

### Green

```text
Make the smallest code change that makes the new test pass.
Avoid unrelated refactors and preserve existing behavior.
Run the targeted test after the edit.
```

### Refactor

```text
Refactor for clarity without changing behavior.
Keep all tests green and preserve the current API.
```

## Fenod Default Testing Shape

- Use Vitest for services, utilities, validation, and slice-level business logic.
- Add integration tests around routers, loaders, and actions where contracts matter.
- Keep Playwright for thin, critical end-to-end paths.
- Avoid relying on snapshots as the primary source of confidence.

For concrete setup and examples, see the [Testing Guide](./TESTING.md).

## Common Failure Modes with AI

- writing tests after the implementation and calling it TDD
- asking for a broad rewrite instead of the next tiny step
- accepting assertions that merely mirror the current implementation
- relying on snapshots when behavior assertions would be clearer
- skipping human review of the first failing test

## Definition of Done

- behavior was expressed in a test before or during implementation
- targeted tests passed after the change
- the final code is simpler than the path used to reach green
- the test protects a user-facing or contract-level behavior

## Related Guides

- [Testing Guide](./TESTING.md)
- [AI Development Workflow](./AI-DEVELOPMENT-WORKFLOW.md)
- [Code Patterns](./CODE-PATTERNS.md)
