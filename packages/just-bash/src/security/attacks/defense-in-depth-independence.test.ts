import { readFileSync } from "node:fs";
import * as nodeModule from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Bash } from "../../Bash.js";
import { DefenseInDepthBox } from "../defense-in-depth-box.js";
import { assertExecResultSafe } from "../fuzzing/oracles/assertions.js";
import type { SecurityViolation } from "../types.js";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "exploit-fixtures",
);

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

async function runAttackWithAndWithoutDefense(options: {
  fixture: string;
}): Promise<{
  baseline: Awaited<ReturnType<Bash["exec"]>>;
  withDefense: Awaited<ReturnType<Bash["exec"]>>;
  violations: SecurityViolation[];
}> {
  const script = loadFixture(options.fixture);

  const baselineEnv = new Bash({
    defenseInDepth: false,
  });
  const baseline = await baselineEnv.exec(script);

  DefenseInDepthBox.resetInstance();
  const violations: SecurityViolation[] = [];
  const defenseEnv = new Bash({
    defenseInDepth: {
      enabled: true,
      onViolation: (violation) => violations.push(violation),
    },
  });
  const withDefense = await defenseEnv.exec(script);
  DefenseInDepthBox.resetInstance();

  return { baseline, withDefense, violations };
}

describe.runIf(typeof nodeModule.registerHooks === "function")(
  "Defense-in-depth independence evidence for exploit probes",
  () => {
    it("awk exploit probes are contained without defense and do not trigger defense violations", async () => {
      const { baseline, withDefense, violations } =
        await runAttackWithAndWithoutDefense({
          fixture: "awk-system-sinks.sh",
        });

      expect(withDefense).toEqual(baseline);
      expect(violations).toEqual([]);
      assertExecResultSafe(baseline);
      assertExecResultSafe(withDefense);
    });

    it("jq exploit probes are contained with and without defense", async () => {
      const { baseline, withDefense } = await runAttackWithAndWithoutDefense({
        fixture: "query-engine-constructor-chain.sh",
      });

      expect(withDefense).toEqual(baseline);
      assertExecResultSafe(baseline);
      assertExecResultSafe(withDefense);
    });
  },
);
