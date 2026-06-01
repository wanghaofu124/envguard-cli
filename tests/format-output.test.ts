import { describe, expect, it } from "vitest";
import { runDiffCommand } from "../src/commands/diff.js";

describe("runDiffCommand", () => {
  it("returns exit code 2 for invalid format", async () => {
    const exitCode = await runDiffCommand("fixtures/.env.example", "fixtures/.env.dev", {
      format: "invalid" as "text",
    });
    expect(exitCode).toBe(2);
  });
});
