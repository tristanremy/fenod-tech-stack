# Fenod Stack Changelog

This document tracks major decisions, additions, removals, and updates to the Fenod Stack over time.

**Format:** Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### Added
- None

### Changed
- None

### Deprecated
- None

### Removed
- None

---

## [2025-11-08] - Major Documentation Release

### Added
- **Architecture Documentation** (`docs/architecture.md`)
  - Mermaid.js diagrams for full-stack data flow
  - Cloudflare edge deployment architecture
  - Authentication flow sequences
  - Request lifecycle visualization
  - Database layer type flow
  - Performance characteristics tables
  - Security architecture diagram

- **Troubleshooting Guide** (`docs/troubleshooting.md`)
  - Comprehensive FAQ for all stack technologies
  - Solutions for TanStack Start, ORPC, Drizzle, D1, Better Auth, Hono, shadcn/ui
  - Build, deployment, and performance troubleshooting
  - Code examples for each solution

- **Local Development Setup** (`docs/local-development.md`)
  - Docker Compose configuration (PostgreSQL, Redis, Mailhog)
  - Multiple database setup options
  - Environment variables guide
  - Testing setup (Vitest, Playwright)
  - VS Code configuration
  - Debugging and profiling guides

- **Architecture Decision Records** (`docs/decisions/`)
  - ADR-001: TanStack Start over Next.js
  - ADR-002: ORPC over tRPC
  - ADR-003: Drizzle over Prisma
  - ADR-004: Cloudflare over Vercel/AWS

- **Version Compatibility Matrix** (`docs/versions.md`)
  - Recommended versions for all technologies
  - Compatibility matrix
  - Update policy and schedule
  - Security update guidelines
  - Breaking change migration guides

- **Contributing Guidelines** (`CONTRIBUTING.md`)
  - Proposal process for new technologies
  - Deprecation process
  - Evaluation criteria
  - Code of conduct
  - Review process documentation

- **Stack Changelog** (this file)
  - Track all major stack decisions
  - Document additions, changes, removals
  - Provide upgrade guidance

### Changed
- **README.md** - Reorganized with better navigation
  - Added "Core Documentation" section in Table of Contents
  - Added "Essential Documentation" in Getting Started
  - Improved information hierarchy

---

## [2025-11-07] - shadcn UI Libraries Update

### Added
- **Tailark** (tailark.com) - Marketing-focused blocks with 100+ variants
- **shadcnblocks** - 959+ premium blocks with Tailwind 4 support
- **Coss UI** - Cal.com-inspired modern UI library

### Changed
- Updated shadcn ecosystem documentation with clearer "When to use" guidance
- Reorganized component libraries with recommended picks highlighted
- Updated Resources section with all library links

---

## [2025-11-06] - Bootstrapping Tool Integration

### Added
- **create-better-t-stack** as official project bootstrapping tool
  - Interactive CLI for project setup
  - Visual stack builder at better-t-stack.dev/new
  - 4 recommended configurations for different project types
  - Integration throughout development-strategy.md

- **Ultracite** documentation clarified
  - Zero-config linter & formatter based on Biome
  - Replaces ESLint + Prettier + Husky
  - AI-ready integration details
  - Monorepo configuration benefits

### Changed
- **README.md** - Added comprehensive Quick Start section
  - Bootstrap command examples
  - Recommended configurations for different use cases
  - "After Bootstrapping" section

- **development-strategy.md** - Updated Phase 1
  - Now uses create-better-t-stack for initialization
  - Added notes for pre-configured dependencies
  - Streamlined setup process

---

## [2025-11-05] - UI-First Development Strategy

### Added
- **Development Strategy Guide** (`docs/development-strategy.md`)
  - 9-phase UI-first workflow
  - Complete code examples for every phase
  - shadcn/ui setup and integration
  - Database schema design from UI requirements
  - Type-safe API implementation examples
  - Better Auth integration guide
  - MCP/AI SDK integration patterns
  - Production deployment checklists

### Changed
- **README.md** - Added Getting Started section linking to development strategy guide

---

## [2025-10-15] - Initial Stack Definition

### Added
- **Core Stack Technologies:**
  - TanStack Start (application framework)
  - Hono (web framework)
  - ORPC (RPC layer)
  - Drizzle ORM (database toolkit)
  - Cloudflare Workers & D1 (infrastructure)
  - Better Auth (authentication)
  - Tailwind CSS v4 (styling)
  - shadcn/ui (component library)
  - Turborepo (monorepo tools)
  - Ultracite (code quality)

- **Documentation Structure:**
  - README.md with philosophy and technology choices
  - Decision tree for framework selection
  - Quick start templates
  - Resources and links

---

## Migration Guides

### Upcoming Migrations

#### React 18 → 19 (TBD - When Stable)

**Status:** Monitoring, not recommended yet

**Expected Changes:**
- useEffect timing modifications
- Ref cleanup behavior updates
- Automatic batching improvements

**Action Required:**
- Wait for React 19 stable release
- Test thoroughly in staging
- Review migration guide (TBD)

#### TanStack Router 1.x → 2.x (TBD 2026)

**Status:** Planned

**Expected Changes:**
- Route definition API updates
- Loader API changes
- Breaking changes in router configuration

**Preparation:**
- Follow TanStack Router changelog
- Test with release candidates
- Plan migration sprint

---

## Deprecation Log

### Active Deprecations

None currently.

### Past Deprecations

#### [2024-12-01] Tailwind CSS v2

**Status:** Deprecated
**Removed:** 2025-01-01
**Reason:** Tailwind v3 introduced significant improvements
**Migration:** Update to v3 or v4, update config syntax
**Impact:** Low - straightforward migration

---

## Version Bumps

### Major Version Updates

| Technology | From | To | Date | Notes |
|------------|------|----|----- |------|
| TanStack Router | 0.x | 1.0 | 2025-09-01 | Stable release |
| Better Auth | 0.x | 1.0 | 2025-10-15 | Stable release |
| Tailwind CSS | 3.x | 4.0 | 2025-10-01 | Oxide engine |
| Hono | 3.x | 4.0 | 2025-08-01 | Performance improvements |

### Minor Version Updates

Tracked in `docs/versions.md` - not listed here unless breaking changes.

---

## Stack Metrics

### Technology Count

- **Core Technologies:** 15
- **Optional Add-ons:** 8
- **Component Libraries:** 9
- **Total Documentation Pages:** 12

### Documentation Stats

| Document | Word Count | Last Updated |
|----------|-----------|--------------|
| README.md | ~3,500 | 2025-11-08 |
| development-strategy.md | ~8,000 | 2025-11-06 |
| architecture.md | ~6,000 | 2025-11-08 |
| troubleshooting.md | ~7,500 | 2025-11-08 |
| local-development.md | ~4,500 | 2025-11-08 |
| versions.md | ~3,000 | 2025-11-08 |

### Community Metrics

| Metric | Count |
|--------|-------|
| ADRs | 4 |
| Diagrams | 7 |
| Code Examples | 50+ |
| Troubleshooting Entries | 40+ |

---

## Review Schedule

### Quarterly Reviews

**Next Review:** February 2026

**Review Checklist:**
- [ ] Update version recommendations
- [ ] Check for deprecated packages
- [ ] Review security advisories
- [ ] Update compatibility matrix
- [ ] Evaluate new technologies
- [ ] Update documentation
- [ ] Publish changelog

### Last Review

**Date:** November 2025
**Reviewer:** Fenod Technical Team
**Changes:** Added comprehensive documentation suite
**Next Actions:** Monitor ORPC 1.0 release, React 19 stable

---

## Proposal History

### Accepted Proposals

1. **[2025-10-15] Adopt TanStack Start** - See ADR-001
2. **[2025-10-15] Use ORPC for RPC layer** - See ADR-002
3. **[2025-10-15] Choose Drizzle ORM** - See ADR-003
4. **[2025-10-15] Cloudflare-first infrastructure** - See ADR-004

### Rejected Proposals

None yet.

### Pending Proposals

None currently.

---

## Breaking Changes Log

### High Impact Changes

None in stable versions.

### Medium Impact Changes

#### ORPC API Updates (0.0.x → 0.1.x)

**Date:** 2025-10-20
**Impact:** Medium
**Migration:** Update procedure definitions, change import paths
**Affected Projects:** All using ORPC
**Effort:** 1-2 hours per project

### Low Impact Changes

#### Drizzle Schema Updates (0.35.x → 0.36.x)

**Date:** 2025-11-01
**Impact:** Low
**Migration:** Minor syntax updates
**Affected Projects:** All using Drizzle
**Effort:** <30 minutes per project

---

## Technology Watch List

Technologies being monitored for potential addition:

| Technology | Status | Reason for Watching |
|------------|--------|---------------------|
| React 19 | Monitoring | Wait for stable release |
| Bun 1.2+ | Evaluating | Improved Windows support |
| Astro 5 | Monitoring | View transitions improvements |

---

## Feedback & Improvements

### How to Provide Feedback

1. Open a GitHub Discussion
2. Tag with `feedback` label
3. Describe improvement or issue
4. Suggest solution if possible

### Common Feedback Themes

Will be tracked as we receive feedback.

---

## Maintainer Notes

### Review Responsibilities

- **Monthly:** Check for security updates
- **Quarterly:** Full stack review and version updates
- **Annually:** Major technology evaluations

### When to Create an ADR

Create an ADR when:
- Adding a new core technology
- Replacing an existing technology
- Making architectural decisions affecting multiple projects
- Significant deviation from stack principles

**Don't create ADR for:**
- Version updates (use STACK_CHANGELOG.md)
- Documentation improvements
- Minor tooling additions

---

## Links

- [Version Matrix](docs/versions.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Decisions](docs/decisions/)
- [Troubleshooting](docs/troubleshooting.md)

---

**Maintained by:** Fenod Technical Team
**Last Updated:** November 8, 2025
