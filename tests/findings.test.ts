import { describe, expect, it } from "vitest";
import { groupFindingsByKey } from "../src/core/findings.js";
import type { SecretFinding } from "../src/types.js";

describe("groupFindingsByKey", () => {
  it("merges findings for the same key", () => {
    const findings: SecretFinding[] = [
      { key: "GITHUB_TOKEN", value: "x", severity: "warning", reason: "Sensitive key name" },
      { key: "GITHUB_TOKEN", value: "x", severity: "error", reason: "GitHub personal access token" },
      { key: "GITHUB_TOKEN", value: "x", severity: "warning", reason: "High-entropy value" },
      { key: "API_KEY", value: "y", severity: "warning", reason: "Sensitive key name" },
    ];

    const grouped = groupFindingsByKey(findings);

    expect(grouped).toHaveLength(2);
    expect(grouped[0]?.key).toBe("API_KEY");
    expect(grouped[1]?.key).toBe("GITHUB_TOKEN");
    expect(grouped[1]?.severity).toBe("error");
    expect(grouped[1]?.reasons).toEqual([
      "Sensitive key name",
      "GitHub personal access token",
      "High-entropy value",
    ]);
  });
});
