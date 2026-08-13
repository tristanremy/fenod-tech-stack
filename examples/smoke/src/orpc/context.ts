import { ORPCError, os } from "@orpc/server";

import type { AuthSession } from "#/lib/auth";

export const base = os.$context<{ session: AuthSession }>();

export const requireAuth = base.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      session: context.session,
    },
  });
});

export const authorized = base.use(requireAuth);
