import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Tests never read a real .env file; they build their own config (see src/test/helpers.ts).
    env: { NODE_ENV: "test" },
  },
});
