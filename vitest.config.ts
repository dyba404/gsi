import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // lib/* marca server-only; en tests de node resolvemos a un stub neutro.
      "server-only": new URL("./tests/server-only-stub.js", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    hookTimeout: 30000,
    testTimeout: 15000,
    // El E2E vive en Playwright, no en Vitest.
    exclude: ["**/node_modules/**", "tests/e2e/**"],
  },
});
