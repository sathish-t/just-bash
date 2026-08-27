import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/comparison-tests/**"],
    setupFiles: [resolve(__dirname, "src/vitest-setup.ts")],
    // Tests that patch globalThis need process-level isolation so they don't
    // leak state into thread neighbours.
    poolMatchGlobs: [
      ["forks", "**/security/attacks/**"],
      ["forks", "**/security/defense-in-depth*.test.ts"],
      ["forks", "**/security/sandbox/**"],
    ],
  },
});
