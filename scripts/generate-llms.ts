import { mkdir, readFile, writeFile } from 'node:fs/promises';

const baseUrl = 'https://stack.fenod.fr';
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
  ['Email', 'email'],
];

await mkdir('public', { recursive: true });

const llms = `# Fenod Stack\n\n> Cloudflare-first TypeScript stack handbook for humans and AI agents.\n\nDocs: ${baseUrl}\n\n## Read first\n\n${docs.map(([title, slug]) => `- [${title}](${baseUrl}/${slug}/)`).join('\n')}\n\n## Core defaults\n\nNode 22, pnpm, TanStack Start, Hono, ORPC, Drizzle, D1, Better Auth, Tailwind v4, shadcn/ui, TanStack AI, Cloudflare Workers/Pages, Alchemy, Infisical, Ultracite, tsgo, Vitest, Playwright.\n`;

await writeFile('public/llms.txt', llms);

let full = `${llms}\n\n---\n\n# Full selected context\n`;
for (const [title, slug] of docs) {
  const content = await readFile(`src/content/docs/${slug}.md`, 'utf8');
  full += `\n\n---\n\n# ${title}\n\n${content}`;
}

await writeFile('public/llms-full.txt', full);
console.log('generated public/llms.txt and public/llms-full.txt');
