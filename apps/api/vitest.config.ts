import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests run sequentially to avoid DB conflicts between test files
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 30_000,
    env: {
      NODE_ENV: "test",
    },
  },
});
