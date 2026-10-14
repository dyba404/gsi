import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:4321",
    locale: "es-PE",
  },
  webServer: {
    command: "npx next start -p 4321",
    url: "http://localhost:4321/api/auth/ok",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
