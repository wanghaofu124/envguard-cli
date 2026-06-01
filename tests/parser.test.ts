import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnvContent, parseEnvFile } from "../src/core/parser.js";

const fixturesDir = join(process.cwd(), "fixtures");

describe("parseEnvContent", () => {
  it("parses basic key-value pairs", () => {
    const result = parseEnvContent("APP_NAME=MyApp\nDEBUG=true\n");
    expect(result.entries.get("APP_NAME")?.value).toBe("MyApp");
    expect(result.entries.get("DEBUG")?.value).toBe("true");
  });

  it("skips comments and empty lines", () => {
    const result = parseEnvContent("# comment\n\nFOO=bar\n");
    expect(result.entries.size).toBe(1);
    expect(result.entries.get("FOO")?.value).toBe("bar");
  });

  it("supports export prefix", () => {
    const result = parseEnvContent("export API_KEY=secret\n");
    expect(result.entries.get("API_KEY")?.value).toBe("secret");
  });

  it("supports quoted values", () => {
    const result = parseEnvContent('MESSAGE="hello world"\nPATH=\'/tmp/dir\'\n');
    expect(result.entries.get("MESSAGE")?.value).toBe("hello world");
    expect(result.entries.get("PATH")?.value).toBe("/tmp/dir");
  });

  it("strips inline comments outside quotes", () => {
    const result = parseEnvContent("URL=https://example.com # trailing\n");
    expect(result.entries.get("URL")?.value).toBe("https://example.com");
  });

  it("warns on duplicate keys", () => {
    const result = parseEnvContent("FOO=one\nFOO=two\n");
    expect(result.entries.get("FOO")?.value).toBe("two");
    expect(result.warnings.some((warning) => warning.includes("duplicate"))).toBe(true);
  });

  it("loads fixture files", () => {
    const result = parseEnvFile(join(fixturesDir, ".env.example"));
    expect(result.entries.get("APP_NAME")?.value).toBe("MyApp");
    expect(result.entries.size).toBeGreaterThan(0);
  });

  it("preserves line numbers", () => {
    const content = readFileSync(join(fixturesDir, ".env.example"), "utf8");
    const result = parseEnvContent(content);
    expect(result.entries.get("APP_NAME")?.line).toBe(2);
  });
});
