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
