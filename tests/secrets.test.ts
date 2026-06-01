import { describe, expect, it } from "vitest";
import { join } from "node:path";
import {
  detectSecretForEntry,
  hasAnySecrets,
  hasHighSeveritySecrets,
  scanEnvMap,
} from "../src/core/secrets.js";
import { parseEnvFile } from "../src/core/parser.js";

const fixturesDir = join(process.cwd(), "fixtures");

describe("detectSecretForEntry", () => {
  it("flags sensitive key names", () => {
    const findings = detectSecretForEntry("DB_PASSWORD", "changeme", 1);
    expect(findings.some((finding) => finding.reason === "Sensitive key name")).toBe(true);
  });

  it("detects OpenAI keys", () => {
    const findings = detectSecretForEntry(
      "OPENAI_KEY",
      "sk-123456789012345678901234567890",
      1,
    );
    expect(findings.some((finding) => finding.reason === "OpenAI API key")).toBe(true);
    expect(hasHighSeveritySecrets(findings)).toBe(true);
  });

  it("detects GitHub tokens", () => {
    const findings = detectSecretForEntry(
      "GITHUB_TOKEN",
      "ghp_123456789012345678901234567890123456",
      1,
    );
    expect(findings.some((finding) => finding.reason === "GitHub personal access token")).toBe(
      true,
    );
  });

  it("detects AWS access keys", () => {
    const findings = detectSecretForEntry("AWS_KEY", "AKIAIOSFODNN7EXAMPLE", 1);
    expect(findings.some((finding) => finding.reason === "AWS access key ID")).toBe(true);
  });

  it("detects high-entropy values", () => {
    const findings = detectSecretForEntry(
      "RANDOM",
      "abcdefghijklmnopqrstuvwxyz0123456789AB",
      1,
    );
    expect(findings.some((finding) => finding.reason === "High-entropy value")).toBe(true);
  });
});

describe("scanEnvMap", () => {
  it("scans all entries in a file", () => {
    const entries = parseEnvFile(join(fixturesDir, ".env.prod")).entries;
    const findings = scanEnvMap(entries);
    expect(hasAnySecrets(findings)).toBe(true);
    expect(findings.some((finding) => finding.key === "GITHUB_TOKEN")).toBe(true);
  });
});
