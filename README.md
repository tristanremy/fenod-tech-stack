# Fenod stack

Agent-first defaults for Fenod apps. **No docs site.** Law is markdown. Proof is `examples/smoke`.

## Agents

Start with [AGENTS.md](AGENTS.md), then use the compact [agent-context.json](agent-context.json) or [llms.txt](llms.txt) to route by task. Read [llms-full.txt](llms-full.txt) only when the route needs deeper context.

Agent operations: [docs/agent-factory.md](docs/agent-factory.md). The law is [docs/stack-contract.md](docs/stack-contract.md). Regenerate context with `pnpm llms:build`.

## Humans (rare)

Clone smoke, follow `examples/smoke/STACK.md`. Do not add a handbook.

## Check

```bash
pnpm check          # regenerate + verify context, routes, and contract rules
pnpm check:context  # parse the compact machine-readable index
cd examples/smoke && pnpm ship
```

For the reference app, higher-risk changes also run `pnpm cf-types && pnpm build`.
