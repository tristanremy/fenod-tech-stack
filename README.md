# Fenod stack

Agent-first defaults for Fenod apps. **No docs site.** Law is markdown. Proof is `examples/smoke`.

## Agents

Read [AGENTS.md](AGENTS.md), then [docs/stack-contract.md](docs/stack-contract.md).

Machine dump: [llms.txt](llms.txt) / [llms-full.txt](llms-full.txt) (`pnpm llms:build`).

## Humans (rare)

Clone smoke, follow `examples/smoke/STACK.md`. Do not add a handbook.

## Check

```bash
pnpm check          # regenerate + verify llms.txt
cd examples/smoke && pnpm ship
```
