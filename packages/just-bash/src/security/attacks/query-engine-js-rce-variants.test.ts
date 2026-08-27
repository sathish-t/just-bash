import { describe, expect, it } from "vitest";
import { Bash } from "../../Bash.js";
import { assertExecResultSafe } from "../fuzzing/oracles/assertions.js";

describe("Query Engine JS RCE Variants", () => {
  it("blocks constructor-chain payload mutations in jq", async () => {
    const env = new Bash();
    const result = await env.exec(`
set +e

rm -f /tmp/jb_rce_marker_1
rm -f /tmp/jb_rce_marker_2
rm -f /tmp/jb_rce_marker_3
rm -f /tmp/jb_rce_marker_8

echo '{}' | jq '.constructor.constructor("return process.mainModule.constructor._load(\\"fs\\").writeFileSync(\\"/tmp/jb_rce_marker_1\\",\\"1\\")")()' >/tmp/jb_q1.stdout 2>/tmp/jb_q1.stderr
if [ -f /tmp/jb_rce_marker_1 ]; then
  echo JQ_CHAIN_DIRECT_RCE
else
  echo JQ_CHAIN_DIRECT_BLOCKED
fi

echo '{"constructor":{"constructor":"noop"}}' | jq '.constructor.constructor("return process.mainModule.constructor._load(\\"fs\\").writeFileSync(\\"/tmp/jb_rce_marker_2\\",\\"1\\")")()' >/tmp/jb_q2.stdout 2>/tmp/jb_q2.stderr
if [ -f /tmp/jb_rce_marker_2 ]; then
  echo JQ_CHAIN_DATA_INFLUENCED_RCE
else
  echo JQ_CHAIN_DATA_INFLUENCED_BLOCKED
fi

echo '{}' | jq 'setpath(["constructor"]; {"constructor": 1}) | .constructor.constructor("return process.mainModule.constructor._load(\\"fs\\").writeFileSync(\\"/tmp/jb_rce_marker_3\\",\\"1\\")")()' >/tmp/jb_q3.stdout 2>/tmp/jb_q3.stderr
if [ -f /tmp/jb_rce_marker_3 ]; then
  echo JQ_CHAIN_SETPATH_RCE
else
  echo JQ_CHAIN_SETPATH_BLOCKED
fi

export constructor='not-a-function'
echo 'null' | jq '$ENV.constructor.constructor("return process.mainModule.constructor._load(\\"fs\\").writeFileSync(\\"/tmp/jb_rce_marker_8\\",\\"1\\")")()' >/tmp/jb_q4.stdout 2>/tmp/jb_q4.stderr
if [ -f /tmp/jb_rce_marker_8 ]; then
  echo JQ_CHAIN_ENV_RCE
else
  echo JQ_CHAIN_ENV_BLOCKED
fi
`);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(
      [
        "JQ_CHAIN_DIRECT_BLOCKED",
        "JQ_CHAIN_DATA_INFLUENCED_BLOCKED",
        "JQ_CHAIN_SETPATH_BLOCKED",
        "JQ_CHAIN_ENV_BLOCKED",
        "",
      ].join("\n"),
    );
    expect(result.stderr).toBe("");
    assertExecResultSafe(result);
  });
});
