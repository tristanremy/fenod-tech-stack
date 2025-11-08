# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting the key technology choices in the Fenod Stack.

## What are ADRs?

Architecture Decision Records (ADRs) are documents that capture important architectural decisions made along with their context and consequences.

## Format

Each ADR follows this structure:

- **Title**: What was decided
- **Status**: Accepted, Proposed, Deprecated, or Superseded
- **Context**: What is the issue we're facing
- **Decision**: What did we decide
- **Consequences**: What becomes easier or harder to do

## Decision Records

1. [ADR-001: TanStack Start over Next.js](001-tanstack-start-over-nextjs.md)
2. [ADR-002: ORPC over tRPC](002-orpc-over-trpc.md)
3. [ADR-003: Drizzle over Prisma](003-drizzle-over-prisma.md)
4. [ADR-004: Cloudflare over Vercel/AWS](004-cloudflare-over-vercel.md)
5. [ADR-005: Better Auth over NextAuth/Clerk](005-better-auth-over-alternatives.md)
6. [ADR-006: Ultracite over ESLint+Prettier](006-ultracite-over-eslint-prettier.md)

## Contributing

When making significant architectural decisions:

1. Create a new ADR using the next number
2. Follow the established format
3. Link to relevant discussions or RFCs
4. Update this README with the new entry

---

**Last Updated:** November 2025
