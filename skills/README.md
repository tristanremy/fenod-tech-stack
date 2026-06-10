# Fenod Agent Skills

Installable skills that turn this repo's handbook into active context for Claude Code, Cursor, and other agents. Each `SKILL.md` carries the distilled 20% inline and routes to `src/content/docs/` for depth, so agents load only what the task needs.

| Skill | Triggers on |
|-------|-------------|
| [`fenod-stack`](./fenod-stack/SKILL.md) | New projects, scaffolding, architecture, monorepo, framework choice, TypeScript config |
| [`fenod-cloudflare-deploy`](./fenod-cloudflare-deploy/SKILL.md) | Deploys, Alchemy, Wrangler, secrets, API tokens, compute choice, CI/CD |
| [`fenod-quality`](./fenod-quality/SKILL.md) | Tests, TDD, lint/format, git hooks, verification before commit/PR |

## Install

**Claude Code** — symlink into the user skills directory:

```bash
ln -s ~/dev/fenod-tech-stack/skills/fenod-stack ~/.claude/skills/fenod-stack
ln -s ~/dev/fenod-tech-stack/skills/fenod-cloudflare-deploy ~/.claude/skills/fenod-cloudflare-deploy
ln -s ~/dev/fenod-tech-stack/skills/fenod-quality ~/.claude/skills/fenod-quality
```

**Cursor** — same pattern into `~/.cursor/skills/` (or manage via the dotfiles `dot symlinks-apply` flow).

**Per-project** — symlink or copy into `.claude/skills/` inside a project to scope them to that repo.

Symlinks keep skills in sync with this repo: `git pull` here updates every agent everywhere.

## Reference resolution

Skills reference `src/content/docs/<slug>.md` with a three-step fallback (repo-relative → `~/dev/fenod-tech-stack/src/content/docs/` → raw GitHub). If you move your checkout, update step 2 in each skill or rely on the GitHub fallback.

## Maintenance

- When a doc in `src/content/docs/` changes a default (tool swap, new pattern), update the distilled version in the matching skill in the same commit. The skill is the contract agents act on; a stale skill is worse than no skill.
- Keep each `SKILL.md` under ~150 lines. Depth belongs in `src/content/docs/`.
- New skill candidates: only when a recurring task type isn't covered by the three above (e.g. a future `fenod-seo` if Astro SEO work becomes frequent).
