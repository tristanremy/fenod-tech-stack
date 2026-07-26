interface CloudflareEnv {
  DB: D1Database
  APP_ENV: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL?: string
}

declare namespace Cloudflare {
  interface Env extends CloudflareEnv {}
}

declare module 'cloudflare:workers' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Env extends CloudflareEnv {}
}
