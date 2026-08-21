import { readFile, writeFile } from 'node:fs/promises';

const coreDefaults =
  'Node 24, pnpm, TanStack Start on Cloudflare Workers, Astro for marketing/content sites only, Start server functions first then Hono+ORPC when needed, Drizzle 0.4x+D1, Better Auth, Tailwind v4+shadcn/ui, Wrangler deploy, Infisical+Worker secrets, Oxlint+Oxfmt, tsgo, Vitest, Playwright.';

const docs = [
  ['AGENTS', 'AGENTS.md'],
  ['Stack Contract', 'docs/stack-contract.md'],
  ['Agent Operating Contract', 'docs/agent-operating-contract.md'],
  ['Gotchas', 'docs/gotchas.md'],
  ['Recipes', 'docs/recipes.md'],
  ['Security Model', 'docs/security-model.md'],
  ['Agent Factory', 'docs/agent-factory.md'],
] as const;

const llms = `# Fenod Stack

> Agent-first Cloudflare TypeScript stack. Stack Contract is law. Proof: examples/smoke.

## Read first

${docs.map(([title, path]) => `- ${title}: ${path}`).join('\n')}

## Core defaults

${coreDefaults}
`;

await writeFile('llms.txt', llms);

let full = `${llms}\n\n---\n\n# Full selected context\n`;
for (const [title, path] of docs) {
  const content = await readFile(path, 'utf8');
  full += `\n\n---\n\n# ${title}\n\n${content}`;
}

await writeFile('llms-full.txt', full);
console.log('generated llms.txt and llms-full.txt');
