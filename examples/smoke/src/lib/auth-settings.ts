/** Cloudflare/D1-safe Better Auth knobs. Safe to import from Node tests. */
export const authSettings = {
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "compact" as const,
    },
  },
  rateLimit: {
    storage: "database" as const,
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip"],
    },
  },
};
