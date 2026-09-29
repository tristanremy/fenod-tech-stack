import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://localhost:3000", browserName: "chromium" },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/api/auth/get-session",
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
