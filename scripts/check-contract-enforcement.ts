import { readFile } from 'node:fs/promises';

const [
  ci,
  recipes,
  factory,
  security,
  stack,
  deploySkill,
  qualitySkill,
  stackSkill,
  smokePackage,
  smokeStack,
  agents,
  readme,
  contextText,
] = await Promise.all([
  readFile('.github/workflows/ci.yml', 'utf8'),
  readFile('docs/recipes.md', 'utf8'),
  readFile('docs/agent-factory.md', 'utf8'),
  readFile('docs/security-model.md', 'utf8'),
  readFile('docs/stack-contract.md', 'utf8'),
  readFile('skills/fenod-cloudflare-deploy/SKILL.md', 'utf8'),
  readFile('skills/fenod-quality/SKILL.md', 'utf8'),
  readFile('skills/fenod-stack/SKILL.md', 'utf8'),
  readFile('examples/smoke/package.json', 'utf8'),
  readFile('examples/smoke/STACK.md', 'utf8'),
  readFile('AGENTS.md', 'utf8'),
  readFile('README.md', 'utf8'),
  readFile('agent-context.json', 'utf8'),
]);

const shadcnCommand = 'pnpm dlx shadcn@latest add <item>';
const requirements = [
  ['CI audits dependencies', ci, 'pnpm audit --audit-level high'],
  ['CI scans secrets', ci, 'trufflesecurity/trufflehog@'],
  ['CI reviews dependency changes', ci, 'actions/dependency-review-action@'],
  ['CI builds the smoke Worker', ci, 'pnpm cf-types && pnpm build'],
  ['deploy recipe limits deploy authority', recipes, 'CI or a human-owned terminal'],
  ['UI recipe requires the official shadcn CLI', recipes, shadcnCommand],
  ['agent factory bounds AI tools', factory, 'maximum tool rounds'],
  ['agent factory documents DeepSec', factory, 'pnpm dlx deepsec process --diff origin/main'],
  ['security policy requires CI hardening', security, 'Pin GitHub Actions to full commit SHAs'],
  ['stack contract links agent operations', stack, 'agent-factory.md'],
  ['stack contract requires the official shadcn CLI', stack, shadcnCommand],
  ['agent entry requires the official shadcn CLI', agents, shadcnCommand],
  ['stack skill requires the official shadcn CLI', stackSkill, shadcnCommand],
  ['smoke reference requires the official shadcn CLI', smokeStack, shadcnCommand],
  ['README explains the official shadcn CLI', readme, shadcnCommand],
  ['deploy skill preserves agent deploy boundary', deploySkill, 'agents push Git. They do not run'],
  ['quality skill requires audit', qualitySkill, 'pnpm audit --audit-level high'],
  ['smoke reference has Workers verification scripts', smokePackage, '"cf-types"'],
  ['agent context has task routes', contextText, '"routes"'],
  ['agent context routes deployment', contextText, 'deploy / Cloudflare'],
  ['agent context routes AI work', contextText, 'AI feature / coding agent'],
  ['agent context routes shadcn work', contextText, 'UI / shadcn component or block'],
] as const;

const unpinnedActions = [...ci.matchAll(/^\s*uses:\s+[^@\s]+@([^\s#]+)/gm)]
  .map(([, ref]) => ref)
  .filter((ref) => !/^[a-f0-9]{40}$/i.test(ref));
const missing = requirements
  .filter(([, text, required]) => !text.includes(required))
  .map(([name]) => name);

if (missing.length || unpinnedActions.length) {
  console.error('contract enforcement check failed');
  if (missing.length) console.error('missing:', missing.join(', '));
  if (unpinnedActions.length) {
    console.error('unpinned GitHub Actions:', unpinnedActions.join(', '));
  }
  process.exit(1);
}

console.log('contract enforcement ok');
