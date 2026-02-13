import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPollingPrompt } from "../src/installer/agent-cron.js";

describe("buildPollingPrompt", () => {
  it("contains the step claim command with correct agent id", () => {
    const prompt = buildPollingPrompt("feature-dev", "developer");
    assert.ok(prompt.includes('step claim "feature-dev/developer"'));
  });

  it("instructs to reply HEARTBEAT_OK on NO_WORK", () => {
    const prompt = buildPollingPrompt("feature-dev", "developer");
    assert.ok(prompt.includes("HEARTBEAT_OK"));
    assert.ok(prompt.includes("NO_WORK"));
  });

  it("does NOT contain workspace/AGENTS.md/SOUL.md content", () => {
    const prompt = buildPollingPrompt("feature-dev", "developer");
    assert.ok(!prompt.includes("AGENTS.md"));
    assert.ok(!prompt.includes("SOUL.md"));
    assert.ok(!prompt.includes("step complete"));
    assert.ok(!prompt.includes("step fail"));
  });

  it("is under 2000 characters", () => {
    const prompt = buildPollingPrompt("security-audit", "scanner");
    assert.ok(prompt.length < 2000, `Prompt is ${prompt.length} chars, expected < 2000`);
  });

  it("works with different workflow/agent ids", () => {
    const prompt = buildPollingPrompt("bug-fix", "fixer");
    assert.ok(prompt.includes('step claim "bug-fix/fixer"'));
  });
});
