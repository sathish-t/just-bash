import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/examples/**",
      "**/.pnpm-store/**",
    ],
    pool: "threads",
    isolate: false,
    setupFiles: [resolve(__dirname, "src/vitest-setup.ts")],
    // Tests that need process-level isolation because defense-in-depth
    // patches globalThis (shared across threads with isolate: false).
    // Note: mock-based tests (queue-timeout-exploit) prefer threads,
    // but vi.mock works in forks as of vitest v4.
    poolMatchGlobs: [
      ["forks", "**/security/attacks/**"],
      ["forks", "**/security/defense-in-depth*.test.ts"],
      ["forks", "**/browser.bundle.test.ts"],
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.comparison.test.ts",
        "src/spec-tests/**",
        "src/comparison-tests/**",
        "src/cli/**",
        "src/agent-examples/**",
      ],
    },
  },
});
