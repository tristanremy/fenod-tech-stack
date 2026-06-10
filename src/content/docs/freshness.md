---
title: "Freshness Policy"
description: "How the Fenod Stack Handbook tracks documentation freshness."
verified: 2026-06
---

The stack changes quickly. Every handbook page should include a `verified` frontmatter field in `YYYY-MM` format.

## Default Path

When changing a page:

1. Check whether the core recommendation is still current.
2. Update the English Source Locale first.
3. Update the French page or explicitly note translation drift.
4. Set `verified` to the current month only if the recommendation was actually reviewed.
5. Run the Publishing Gate.

## Stale Pages

Treat a page as stale when:

- `verified` is older than six months;
- package names, framework defaults, or Cloudflare product guidance have changed;
- implementation examples no longer match the current starter shape;
- an agent reports contradictory instructions.

## Agent Notes

Do not bump `verified` as a cosmetic change. Bump it only after checking the substance of the page.

## Related Guides

- [Agent Operating Contract](/agent-operating-contract/)
- [Stack Contract](/stack-contract/)
- [Decisions](/decisions/)
