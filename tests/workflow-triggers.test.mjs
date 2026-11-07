import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const yaml=readFileSync(new URL("../.github/workflows/public-guard.yml",import.meta.url),"utf8");
test("public CI only runs feature branches through Pull Requests",()=>{
  assert.match(yaml,/on:\s*\n\s+push:\s*\n\s+branches:\s*\[main\]/);
  assert.match(yaml,/\n\s+pull_request:\s*\n/);
  assert.match(yaml,/\n\s+workflow_dispatch:\s*\n/);
  assert.doesNotMatch(yaml,/\n\s+push:\s*\n\s+branches:\s*\['\*'\]/);
});
test("branch and PR CI remain read-only, offline and cancel stale checks",()=>{
  assert.match(yaml,/permissions:\s*\n\s+contents:\s*read/);
  assert.match(yaml,/persist-credentials:\s*false/);
  assert.match(yaml,/cancel-in-progress:\s*true/);
  assert.match(yaml,/github\.event\.pull_request\.number \|\| github\.ref/);
  assert.match(yaml,/npm run check/);
  assert.match(yaml,/npm test/);
  assert.match(yaml,/timeout-minutes:\s*5/);
  assert.doesNotMatch(yaml,/wrangler deploy|cloudflare\/wrangler-action|secrets\./i);
});
