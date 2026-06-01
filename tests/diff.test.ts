import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { diffEnvMaps } from "../src/core/diff.js";
import { parseEnvFile } from "../src/core/parser.js";

const fixturesDir = join(process.cwd(), "fixtures");

describe("diffEnvMaps", () => {
  it("classifies added, removed, changed, and unchanged entries", () => {
    const mapA = parseEnvFile(join(fixturesDir, ".env.example")).entries;
    const mapB = parseEnvFile(join(fixturesDir, ".env.dev")).entries;
    const result = diffEnvMaps(mapA, mapB);

    expect(result.added.some((entry) => entry.key === "LOG_LEVEL")).toBe(true);
    expect(result.changed.some((entry) => entry.key === "API_URL")).toBe(true);
    expect(result.changed.some((entry) => entry.key === "DB_PASSWORD")).toBe(true);
    expect(result.unchanged.some((entry) => entry.key === "APP_NAME")).toBe(true);
    expect(result.removed.length).toBe(0);
  });

  it("detects removed keys", () => {
    const mapA = parseEnvFile(join(fixturesDir, ".env.dev")).entries;
    const mapB = parseEnvFile(join(fixturesDir, ".env.example")).entries;
    const result = diffEnvMaps(mapA, mapB);

    expect(result.removed.some((entry) => entry.key === "LOG_LEVEL")).toBe(true);
  });

  it("sorts keys alphabetically", () => {
    const mapA = parseEnvFile(join(fixturesDir, ".env.example")).entries;
    const mapB = parseEnvFile(join(fixturesDir, ".env.prod")).entries;
    const result = diffEnvMaps(mapA, mapB);

    const addedKeys = result.added.map((entry) => entry.key);
    expect(addedKeys).toEqual([...addedKeys].sort());
  });
});
