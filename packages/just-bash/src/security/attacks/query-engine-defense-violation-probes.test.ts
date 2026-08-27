import { describe, expect, it } from "vitest";
import { Bash } from "../../Bash.js";
import { shellJoinArgs } from "../../helpers/shell-quote.js";
import type { SecurityViolation, SecurityViolationType } from "../types.js";

const HIGH_RISK_VIOLATION_TYPES = new Set<SecurityViolationType>([
  "function_constructor",
  "async_function_constructor",
  "generator_function_constructor",
  "async_generator_function_constructor",
  "process_binding",
  "process_main_module",
  "module_load",
  "error_prepare_stack_trace",
]);

describe.runIf(typeof nodeModule.registerHooks === "function")(
  "Query Engine Defense Violation Probes",
  () => {
    it("does not trigger high-risk defense violations for jq constructor-chain mutations", async () => {
      const violations: SecurityViolation[] = [];
      const env = new Bash({
        defenseInDepth: {
          enabled: true,
          auditMode: true,
          onViolation: (v) => violations.push(v),
        },
      });

      const jqPayloads = [
        ".constructor",
        ".constructor.constructor",
        '.constructor.constructor("return process")',
        '.constructor.constructor("return process")()',
        '.["constructor"]["constructor"]',
        'getpath(["constructor","constructor"])',
        'setpath(["constructor","constructor"]; 1)',
        'fromjson? | .constructor.constructor("return process")()',
      ];

      for (const payload of jqPayloads) {
        await env.exec(shellJoinArgs(["jq", payload]), { stdin: "{}\n" });
      }

      const highRiskViolations = violations.filter((v) =>
        HIGH_RISK_VIOLATION_TYPES.has(v.type),
      );

      expect(highRiskViolations).toEqual([]);
    });
  },
);

import * as nodeModule from "node:module";
