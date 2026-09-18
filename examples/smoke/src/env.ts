import { z } from "zod";

/** Non-secret / Node-side config validation (build scripts, local tooling). */
const nodeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export function validateNodeEnv(
  env: Record<string, string | undefined> = process.env,
): z.infer<typeof nodeEnvSchema> {
  const result = nodeEnvSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid Node env: ${result.error.message}`);
  }
  return result.data;
}

export const APP_ENVS = ["development", "test", "staging", "production"] as const;

/**
 * Worker configuration declared per name in `wrangler.jsonc`:
 * public values in `vars`, secrets in `secrets.required`.
 */
const workerConfigSchema = z.object({
  APP_ENV: z.enum(APP_ENVS),
  BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().min(1, "is required"),
});

/** Values that only ever exist to be replaced. Never accepted away from local dev. */
const PLACEHOLDER_SECRET = /(replace|change[-_ ]?me|placeholder|example|dev-only|test-only)/iu;

export type WorkerConfig = {
  appEnv: (typeof APP_ENVS)[number];
  secret: string;
  origin: string;
  isLocal: boolean;
};

/**
 * Validates the configuration Better Auth actually consumes, at the point it
 * consumes it. Error messages name the offending key and never echo a value.
 */
export function readWorkerConfig(source: {
  APP_ENV?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
}): WorkerConfig {
  const result = workerConfigSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")} ${issue.message}`)
      .join("; ");
    throw new Error(
      `Invalid Worker configuration: ${problems}. See .dev.vars.example and wrangler.jsonc.`,
    );
  }

  const { APP_ENV, BETTER_AUTH_SECRET, BETTER_AUTH_URL } = result.data;
  const isLocal = APP_ENV === "development" || APP_ENV === "test";

  let url: URL;
  try {
    url = new URL(BETTER_AUTH_URL);
  } catch {
    throw new Error("Invalid Worker configuration: BETTER_AUTH_URL is not an absolute URL.");
  }

  if (isLocal) {
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (!loopback || url.protocol !== "http:") {
      throw new Error(
        `Invalid Worker configuration: ${APP_ENV} BETTER_AUTH_URL must be http on a loopback host, got a different origin.`,
      );
    }
  } else {
    if (url.protocol !== "https:") {
      throw new Error(`Invalid Worker configuration: ${APP_ENV} BETTER_AUTH_URL must use https.`);
    }
    if (PLACEHOLDER_SECRET.test(BETTER_AUTH_SECRET)) {
      throw new Error(
        `Invalid Worker configuration: ${APP_ENV} BETTER_AUTH_SECRET still looks like a placeholder value.`,
      );
    }
  }

  return { appEnv: APP_ENV, secret: BETTER_AUTH_SECRET, origin: url.origin, isLocal };
}
