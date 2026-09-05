import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("just-bash CJS bundle", () => {
  it("should be requireable and execute basic commands", async () => {
    const cjsBundlePath = resolve(__dirname, "../dist/bundle/index.cjs");
    const require = createRequire(import.meta.url);
    const mod = require(cjsBundlePath);
    expect(mod.Bash).toBeDefined();
    const bash = new mod.Bash();
    expect("registerCommand" in bash).toBe(false);
    const result = await bash.exec("echo hello from cjs");
    expect(result.stdout).toBe("hello from cjs\n");
    expect(result.exitCode).toBe(0);
  });
});

// Regression test for https://github.com/vercel-labs/just-bash/issues/211.
// The ESM Node bundle (what consumers import via `import { Bash } from "just-bash"`)
// has its own dynamic-require shim — file-type → debug → supports-color does
// runtime require("tty")/require("os") that the shim throws for unless the
// build banner provides createRequire.
describe("just-bash ESM bundle", () => {
  it("should be importable and run file command", async () => {
    const esmBundlePath = resolve(__dirname, "../dist/bundle/index.js");
    const mod = await import(esmBundlePath);
    expect(mod.Bash).toBeDefined();
    const fs = new mod.InMemoryFs();
    await fs.writeFile("/x.txt", "hello\n");
    const bash = new mod.Bash({ fs, cwd: "/" });
    const result = await bash.exec("file /x.txt");
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe("/x.txt: ASCII text\n");
    expect(result.exitCode).toBe(0);
  });
});
