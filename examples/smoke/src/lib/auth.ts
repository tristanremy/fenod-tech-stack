import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "cloudflare:workers";

import { getDb } from "#/db/index";
import * as schema from "#/db/schema";
import { authSettings } from "./auth-settings.ts";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  ...authSettings,
  plugins: [tanstackStartCookies()],
});

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

/** Cookie-cache session by default. Pass `fresh: true` to force a D1 read. */
export function getSession(headers: Headers, fresh = false) {
  return auth.api.getSession({
    headers,
    query: fresh ? { disableCookieCache: true } : undefined,
  });
}
