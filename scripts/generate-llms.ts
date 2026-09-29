import { access, readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const checkOnly = process.argv.includes('--check');

const coreDefaults =
  'Node 24, pnpm, TanStack Start on Cloudflare Workers, Astro for marketing/content sites only, Start server functions first then Hono+ORPC when needed, Drizzle 0.4x+D1, Better Auth, Tailwind v4+shadcn/ui, Wrangler, Infisical+Worker secrets, Oxlint+Oxfmt+@shadcn/lint, TypeScript 7 tsc, Vitest, Playwright.';

const docs = [
  ['Agent entry', 'AGENTS.md'],
  ['Stack Contract', 'docs/stack-contract.md'],
  ['Agent Operating Contract', 'docs/agent-operating-contract.md'],
  ['Gotchas', 'docs/gotchas.md'],
  ['Recipes', 'docs/recipes.md'],
  ['Astro content sites', 'docs/astro.md'],
  ['Security Model', 'docs/security-model.md'],
  ['Agent Factory', 'docs/agent-factory.md'],
] as const;

const routes = [
  { task: 'Astro / content site / SEO / JSON-LD / responsive images', read: ['docs/astro.md', 'examples/astro/README.md', 'examples/astro/package.json'] },
  { task: 'new app / architecture / stack choice', read: ['docs/stack-contract.md', 'skills/fenod-stack/SKILL.md', 'examples/smoke/STACK.md'] },
  { task: 'deploy / Cloudflare / secrets / D1 migration', read: ['docs/agent-operating-contract.md', 'docs/security-model.md', 'skills/fenod-cloudflare-deploy/SKILL.md'] },
  { task: 'AI feature / coding agent / eval / sandbox', read: ['docs/agent-factory.md', 'docs/agent-evals.md', 'docs/security-model.md'] },
  { task: 'auth / permissions / sensitive data', read: ['docs/security-model.md', 'docs/agent-operating-contract.md', 'examples/smoke/src/lib/auth.ts'] },
  { task: 'test / lint / typecheck / refactor', read: ['skills/fenod-quality/SKILL.md', 'examples/smoke/package.json'] },
  { task: 'UI / shadcn component or block', read: ['docs/recipes.md', 'skills/fenod-stack/SKILL.md', 'examples/smoke/components.json', 'examples/smoke/oxlint.config.ts'] },
  { task: 'slow data loading / D1 N+1 / Router cache', read: ['docs/recipes.md', 'docs/gotchas.md', 'docs/security-model.md'] },
  { task: 'TanStack Start / D1 reference', read: ['examples/smoke/STACK.md', 'examples/smoke/package.json'] },
] as const;

const llms = `# Fenod Stack\n\n> Agent-first Cloudflare TypeScript stack. Stack Contract is law. Proof: examples/smoke.\n\n## Read first\n\n${docs.map(([title, path]) => `- ${title}: ${path}`).join('\n')}\n\n## Route by task\n\n${routes.map(({ task, read }) => `- **${task}** → ${read.join(', ')}`).join('\n')}\n\n## Core defaults\n\n${coreDefaults}\n\n## Verification\n\nHandbook root: \`pnpm check && pnpm test\`. Reference apps: \`pnpm --dir examples/smoke ship\` and \`pnpm --dir examples/astro ship\`. Product repos: \`pnpm lint && pnpm typecheck && pnpm test\` (add build/browser checks for higher risk).\n`;

const context = {
  version: 1,
  readFirst: ['AGENTS.md', 'docs/stack-contract.md', 'docs/agent-operating-contract.md'],
  routes,
  defaults: coreDefaults,
  verification: ['pnpm check', 'pnpm test', 'pnpm --dir examples/smoke ship', 'pnpm --dir examples/astro ship'],
  forbidden: ['npm', 'yarn', 'new Pages projects', 'Redis', 'production deploys from agent sessions', 'real secrets in Git'],
};

// A route is useful only if its target exists in this checkout.
for (const path of new Set([...context.readFirst, ...routes.flatMap(({ read }) => read)])) {
  await access(path);
}

let full = `${llms}\n\n---\n\n# Full selected context\n`;
for (const [title, path] of docs) {
  const content = await readFile(path, 'utf8');
  full += `\n\n---\n\n# ${title}\n\n${content}`;
}
const outputs = [
  ['llms.txt', llms],
  ['agent-context.json', `${JSON.stringify(context, null, 2)}\n`],
  ['llms-full.txt', full],
] as const;

for (const [path, content] of outputs) {
  if (checkOnly) {
    const current = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (current !== content) {
      console.error(`${path} is stale or missing; run pnpm llms:build and review the diff.`);
      process.exitCode = 1;
    }
  } else {
    await writeFile(path, content);
  }
}
console.log(checkOnly ? 'agent context comparison complete (read-only)' : 'generated agent context');
