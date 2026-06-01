import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { buildDiffReport } from "../src/core/service.js";

const fixturesDir = join(process.cwd(), "fixtures");

describe("buildDiffReport json output", () => {
  it("returns categorized diff data for fixture files", () => {
    const report = buildDiffReport(
      join(fixturesDir, ".env.example"),
      join(fixturesDir, ".env.prod"),
    );

    expect(report.added.map((entry) => entry.key)).toEqual(["GITHUB_TOKEN", "NEWRelic_KEY"]);
    expect(report.removed).toHaveLength(0);
    expect(report.changed.map((entry) => entry.key)).toEqual([
      "API_KEY",
      "APP_ENV",
      "DB_HOST",
      "DB_PASSWORD",
      "DEBUG",
    ]);
    expect(report.secrets.some((finding) => finding.key === "GITHUB_TOKEN")).toBe(true);
    expect(report.secrets.some((finding) => finding.reason === "GitHub personal access token")).toBe(
      true,
    );
  });
});
