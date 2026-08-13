import { mkdir, readFile, writeFile } from 'node:fs/promises';

const baseUrl = 'https://stack.fenod.fr';

/** Keep in lockstep with stack-contract.md — this is the agent machine surface. */
const coreDefaults =
  'Node 24, pnpm, TanStack Start on Cloudflare Workers, Astro/Starlight for content, Start server functions first then Hono+ORPC when needed, Drizzle 0.4x+D1, Better Auth, Tailwind v4+shadcn/ui, TanStack AI+AI Gateway, Wrangler deploy, Infisical+Worker secrets, Oxlint+Oxfmt, tsgo, Vitest, Playwright.';

const docs = [
  ['AI Index', 'ai-index'],
  ['Stack Contract', 'stack-contract'],
  ['Agent Operating Contract', 'agent-operating-contract'],
  ['Gotchas', 'gotchas'],
  ['Recipes', 'recipes'],
  ['Security Model', 'security-model'],
  ['Cloudflare API Tokens', 'cloudflare-api-tokens'],
  ['AI Providers', 'ai-providers'],
  ['Tooling', 'tooling'],
  ['Deployment', 'deployment'],
  ['Email', 'email'],
] as const;

await mkdir('public', { recursive: true });

const llms = `# Fenod Stack

> Cloudflare-first TypeScript stack handbook for humans and AI agents. Stack Contract is law.

Docs: ${baseUrl}

## Read first

${docs
  .slice(0, 6)
  .map(([title, slug]) => `- [${title}](${baseUrl}/${slug}/)`)
  .join('\n')}

## Core defaults

${coreDefaults}

## Also useful

${docs
  .slice(6)
  .map(([title, slug]) => `- [${title}](${baseUrl}/${slug}/)`)
  .join('\n')}
`;

await writeFile('public/llms.txt', llms);

let full = `${llms}\n\n---\n\n# Full selected context\n`;
for (const [title, slug] of docs) {
  const content = await readFile(`src/content/docs/${slug}.md`, 'utf8');
  full += `\n\n---\n\n# ${title}\n\n${content}`;
}

await writeFile('public/llms-full.txt', full);
console.log('generated public/llms.txt and public/llms-full.txt');
