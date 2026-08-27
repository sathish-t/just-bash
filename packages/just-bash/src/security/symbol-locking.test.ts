import * as nodeModule from "node:module";
import { afterEach, describe, expect, it } from "vitest";
import { DefenseInDepthBox } from "./defense-in-depth-box.js";

describe("well-known symbol locking", () => {
  afterEach(() => {
    DefenseInDepthBox.resetInstance();
  });

  it.runIf(typeof nodeModule.registerHooks === "function")(
    "temporarily protects and then restores host symbol descriptors in scoped mode",
    () => {
      const targets = [
        [Array.prototype, Symbol.iterator],
        [String.prototype, Symbol.iterator],
        [RegExp.prototype, Symbol.match],
        [Function.prototype, Symbol.hasInstance],
        [Array.prototype, Symbol.unscopables],
        [Map.prototype, Symbol.toStringTag],
      ] as const;
      const before = targets.map(([target, symbol]) =>
        Object.getOwnPropertyDescriptor(target, symbol),
      );
      const box = DefenseInDepthBox.getInstance(true);
      const handle = box.activate();
      try {
        const during = targets.map(([target, symbol]) =>
          Object.getOwnPropertyDescriptor(target, symbol),
        );
        for (let i = 0; i < during.length; i++) {
          const duringDescriptor = during[i];
          const beforeDescriptor = before[i];
          expect(duringDescriptor?.configurable).toBe(
            beforeDescriptor?.configurable,
          );
          if (
            duringDescriptor &&
            beforeDescriptor &&
            "value" in duringDescriptor
          ) {
            expect(duringDescriptor.value).toBe(beforeDescriptor.value);
            expect(duringDescriptor.writable).toBe(false);
          }
        }
      } finally {
        handle.deactivate();
        DefenseInDepthBox.resetInstance();
      }
      expect(
        targets.map(([target, symbol]) =>
          Object.getOwnPropertyDescriptor(target, symbol),
        ),
      ).toEqual(before);
    },
  );
});
