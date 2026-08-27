/**
 * Browser bundle safety tests
 *
 * These tests verify that the browser bundle:
 * 1. Does not contain Node.js-only imports
 * 2. Does not include the browser-excluded tar command
 * 3. Shows helpful error messages for browser-excluded commands
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Bash } from "./Bash.js";
import { BROWSER_EXCLUDED_COMMANDS } from "./commands/browser-excluded.js";
import { getCommandNames } from "./commands/registry.js";

const browserBundlePath = resolve(__dirname, "../dist/bundle/browser.js");

describe("browser bundle safety", () => {
  describe("bundle contents", () => {
    it("should not contain tar command registration", () => {
      const bundleContent = readFileSync(browserBundlePath, "utf-8");
      expect(bundleContent).not.toContain('name:"tar"');
      expect(bundleContent).not.toContain("tarCommand");
    });

    it("should not contain direct node: protocol imports in bundle code", () => {
      const bundleContent = readFileSync(browserBundlePath, "utf-8");
      // The browser bundle should externalize all node: imports
      // Check for common patterns that indicate node: modules are bundled
      // Note: We check for function calls, not just string presence
      // since the external declaration might still reference them
      expect(bundleContent).not.toMatch(/require\s*\(\s*["']node:/);
      expect(bundleContent).not.toMatch(/from\s*["']node:fs["']/);
      expect(bundleContent).not.toMatch(/from\s*["']node:path["']/);
      expect(bundleContent).not.toMatch(/from\s*["']node:child_process["']/);
    });

    it("should not contain native module artifacts", () => {
      const bundleContent = readFileSync(browserBundlePath, "utf-8");
      // Native modules (.node files) cannot work in browsers
      // This catches any native dependency that gets accidentally bundled
      expect(bundleContent).not.toMatch(/\.node["']/); // .node file references
      expect(bundleContent).not.toMatch(/prebuild-install/); // native module installer
      expect(bundleContent).not.toMatch(/node-gyp/); // native build tool
      expect(bundleContent).not.toMatch(/napi_/); // N-API bindings
      expect(bundleContent).not.toMatch(/\.binding\(/); // native binding loader
    });
  });

  describe("browser-excluded commands list", () => {
    it("should include tar in browser-excluded commands", () => {
      expect(BROWSER_EXCLUDED_COMMANDS).toContain("tar");
    });

    it("should have browser-excluded commands available in Node.js registry", () => {
      // In Node.js environment (where tests run), all commands are available
      // This verifies that browser-excluded commands exist in the full registry
      const commandNames = getCommandNames();

      for (const excludedCmd of BROWSER_EXCLUDED_COMMANDS) {
        // These commands should be available in Node.js
        expect(commandNames).toContain(excludedCmd);
      }
    });
  });

  describe("tar in Node.js", () => {
    it("tar should be available by default in Node.js", async () => {
      const bash = new Bash();
      const result = await bash.exec("tar --help");

      expect(result.stdout).toContain("Usage:");
      expect(result.exitCode).toBe(0);
    });
  });

  describe("helpful error messages for excluded commands", () => {
    it("should show helpful error when tar is used but not available", async () => {
      const availableCommands = getCommandNames().filter(
        (cmd) => cmd !== "tar",
      ) as import("./commands/registry.js").CommandName[];

      const bash = new Bash({
        commands: availableCommands,
      });

      const result = await bash.exec("tar -tf archive.tar");

      expect(result.stderr).toContain("tar");
      expect(result.stderr).toContain("not available in browser");
      expect(result.stderr).toContain("Exclude");
      expect(result.exitCode).toBe(127);
    });

    it("should show standard command not found for non-excluded commands", async () => {
      const bash = new Bash();
      const result = await bash.exec("nonexistentcmd arg1 arg2");

      // Regular unknown command should just say "command not found"
      expect(result.stderr).toContain("command not found");
      expect(result.stderr).not.toContain("browser");
      expect(result.exitCode).toBe(127);
    });
  });
});
