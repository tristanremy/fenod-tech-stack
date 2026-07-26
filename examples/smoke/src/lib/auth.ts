import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "cloudflare:workers";

import { getDb } from "#/db/index";
import * as schema from "#/db/schema";

function requireSecret(name: keyof CloudflareEnv, value: string | undefined) {
  if (!value) {
    throw new Error(
      `${name} is missing. Set it via Infisical or untracked .dev.vars (see .env.example).`
    );
  }
  return value;
}

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema,
  }),
  secret: requireSecret("BETTER_AUTH_SECRET", env.BETTER_AUTH_SECRET),
  baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
});
