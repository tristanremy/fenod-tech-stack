# Fenod Agent Skills

Installable skills that turn this repo's handbook into active context for Claude Code, Cursor, and other agents. Each `SKILL.md` carries the distilled 20% inline and routes to `src/content/docs/` for depth, so agents load only what the task needs.

| Skill | Triggers on |
|-------|-------------|
| [`fenod-stack`](./fenod-stack/SKILL.md) | New projects, scaffolding, architecture, monorepo, framework choice, TypeScript config |
| [`fenod-cloudflare-deploy`](./fenod-cloudflare-deploy/SKILL.md) | Deploys, Alchemy, Wrangler, secrets, API tokens, compute choice, CI/CD |
| [`fenod-quality`](./fenod-quality/SKILL.md) | Tests, TDD, lint/format, git hooks, verification before commit/PR |

## Install

**Claude Code** — symlink into the user skills directory (adjust `$REPO` to your checkout):

```bash
REPO="$(pwd)"   # from this repository root
ln -s "$REPO/skills/fenod-stack" ~/.claude/skills/fenod-stack
ln -s "$REPO/skills/fenod-cloudflare-deploy" ~/.claude/skills/fenod-cloudflare-deploy
ln -s "$REPO/skills/fenod-quality" ~/.claude/skills/fenod-quality
```

**Cursor** — same pattern into `~/.cursor/skills/`.

**Per-project** — symlink or copy into `.claude/skills/` inside a project to scope them to that repo.

Symlinks keep skills in sync with this repo: `git pull` here updates every agent everywhere.

## Reference resolution

Skills reference `src/content/docs/<slug>.md` with a three-step fallback:

1. repo-relative path from the skill file
2. sibling checkout named `fenod-tech-stack` if present
3. raw GitHub: `https://raw.githubusercontent.com/tristanremy/fenod-tech-stack/main/src/content/docs/<slug>.md`

## Maintenance

- When a doc in `src/content/docs/` changes a default, update the matching skill in the same commit.
- Keep each `SKILL.md` under ~150 lines. Depth belongs in `src/content/docs/`.
- New skill candidates only when a recurring task type isn't covered above.
