import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "cloudflare:workers";

import { getDb } from "#/db/index";
import * as schema from "#/db/schema";
import { readWorkerConfig } from "#/env";
import { authSettings } from "./auth-settings";

const config = readWorkerConfig(env);

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema,
  }),
  secret: config.secret,
  baseURL: config.origin,
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
