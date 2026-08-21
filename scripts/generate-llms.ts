import { readFile, writeFile } from 'node:fs/promises';

const coreDefaults =
  'Node 24, pnpm, TanStack Start on Cloudflare Workers, Astro for marketing/content sites only, Start server functions first then Hono+ORPC when needed, Drizzle 0.4x+D1, Better Auth, Tailwind v4+shadcn/ui, Wrangler, Infisical+Worker secrets, Oxlint+Oxfmt, tsgo, Vitest, Playwright.';

const docs = [
  ['Agent entry', 'AGENTS.md'],
  ['Stack Contract', 'docs/stack-contract.md'],
  ['Agent Operating Contract', 'docs/agent-operating-contract.md'],
  ['Gotchas', 'docs/gotchas.md'],
  ['Recipes', 'docs/recipes.md'],
  ['Security Model', 'docs/security-model.md'],
  ['Agent Factory', 'docs/agent-factory.md'],
] as const;

const routes = [
  { task: 'new app / architecture / stack choice', read: ['docs/stack-contract.md', 'skills/fenod-stack/SKILL.md', 'examples/smoke/STACK.md'] },
  { task: 'deploy / Cloudflare / secrets / D1 migration', read: ['docs/agent-operating-contract.md', 'docs/security-model.md', 'skills/fenod-cloudflare-deploy/SKILL.md'] },
  { task: 'AI feature / coding agent / eval / sandbox', read: ['docs/agent-factory.md', 'docs/security-model.md'] },
  { task: 'auth / permissions / sensitive data', read: ['docs/security-model.md', 'docs/agent-operating-contract.md', 'examples/smoke/src/lib/auth.ts'] },
  { task: 'test / lint / typecheck / refactor', read: ['skills/fenod-quality/SKILL.md', 'examples/smoke/package.json'] },
  { task: 'UI / shadcn component or block', read: ['docs/recipes.md', 'skills/fenod-stack/SKILL.md', 'examples/smoke/components.json'] },
  { task: 'TanStack Start / D1 reference', read: ['examples/smoke/STACK.md', 'examples/smoke/package.json'] },
] as const;

const llms = `# Fenod Stack\n\n> Agent-first Cloudflare TypeScript stack. Stack Contract is law. Proof: examples/smoke.\n\n## Read first\n\n${docs.map(([title, path]) => `- ${title}: ${path}`).join('\n')}\n\n## Route by task\n\n${routes.map(({ task, read }) => `- **${task}** → ${read.join(', ')}`).join('\n')}\n\n## Core defaults\n\n${coreDefaults}\n\n## Verification\n\n\`pnpm lint && pnpm typecheck && pnpm test\` (add build/browser checks for higher risk).\n`;

const context = {
  version: 1,
  readFirst: ['AGENTS.md', 'docs/stack-contract.md', 'docs/agent-operating-contract.md'],
  routes,
  defaults: coreDefaults,
  verification: ['pnpm lint', 'pnpm typecheck', 'pnpm test'],
  forbidden: ['npm', 'yarn', 'new Pages projects', 'Redis', 'production deploys from agent sessions', 'real secrets in Git'],
};

await writeFile('llms.txt', llms);
await writeFile('agent-context.json', `${JSON.stringify(context, null, 2)}\n`);

let full = `${llms}\n\n---\n\n# Full selected context\n`;
for (const [title, path] of docs) {
  const content = await readFile(path, 'utf8');
  full += `\n\n---\n\n# ${title}\n\n${content}`;
}
await writeFile('llms-full.txt', full);
console.log('generated llms.txt, agent-context.json, and llms-full.txt');
