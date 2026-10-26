import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "scripts",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev -- --turbopack",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      DEMO_MODE: "1",
      AUTH_SECRET: "repro-secret-0123456789abcdef",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
