import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Run tests sequentially — DB integration tests share state
    sequence: {
      concurrent: false,
    },
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
