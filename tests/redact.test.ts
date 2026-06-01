import { describe, expect, it } from "vitest";
import {
  formatChangedKeyValue,
  formatChangedPair,
  formatKeyValue,
  hasDiffChanges,
  redactValue,
} from "../src/core/redact.js";

describe("redactValue", () => {
  it("masks short values completely", () => {
    expect(redactValue("FOO", "abc")).toBe("****");
  });

  it("keeps first and last two characters for longer values", () => {
    expect(redactValue("API_URL", "https://example.com")).toBe("ht***om");
  });

  it("fully masks sensitive key names", () => {
    expect(redactValue("DB_PASSWORD", "super-secret-prod-password")).toBe("****");
    expect(redactValue("API_TOKEN", "abcdefgh")).toBe("****");
    expect(redactValue("PRIVATE_KEY", "abcdefgh")).toBe("****");
  });
});

describe("formatChangedPair", () => {
  it("adds length hints when redacted values collide", () => {
    const { oldLine, newLine } = formatChangedPair(
      "API_URL",
      "https://api.example.com",
      "https://dev-api.example.com",
      true,
    );

    expect(oldLine).toBe("API_URL = ht***om (len 23)");
    expect(newLine).toBe("API_URL = ht***om (len 27)");
  });

  it("adds length hints for sensitive keys when values differ", () => {
    const { oldLine, newLine } = formatChangedPair("API_KEY", "replace-me", "sk-dev-placeholder-key-1234567890", true);

    expect(oldLine).toBe("API_KEY = **** (len 10)");
    expect(newLine).toBe("API_KEY = **** (len 33)");
  });

  it("adds length hints for short values", () => {
    expect(formatChangedKeyValue("SHORT", "ab", "xy", "old", true)).toBe("SHORT = **** (len 2)");
    expect(formatChangedKeyValue("SHORT", "ab", "xy", "new", true)).toBe("SHORT = **** (len 2)");
  });

  it("does not add hints when redacted values already differ", () => {
    const { oldLine, newLine } = formatChangedPair("APP_ENV", "development", "production", true);
    expect(oldLine).toBe("APP_ENV = de***nt");
    expect(newLine).toBe("APP_ENV = pr***on");
  });

  it("shows raw values when redaction is disabled", () => {
    const { oldLine, newLine } = formatChangedPair("API_URL", "https://api.example.com", "https://dev-api.example.com", false);
    expect(oldLine).toBe("API_URL = https://api.example.com");
    expect(newLine).toBe("API_URL = https://dev-api.example.com");
  });
});

describe("formatKeyValue", () => {
  it("formats redacted output by default", () => {
    expect(formatKeyValue("DB_HOST", "localhost")).toBe("DB_HOST = lo***st");
  });

  it("can show raw values", () => {
    expect(formatKeyValue("DB_HOST", "localhost", false)).toBe("DB_HOST = localhost");
  });
});

describe("hasDiffChanges", () => {
  it("returns true when any diff bucket has items", () => {
    expect(
      hasDiffChanges({
        added: [{ key: "A" }],
        removed: [],
        changed: [],
      }),
    ).toBe(true);
  });

  it("returns false when all diff buckets are empty", () => {
    expect(
      hasDiffChanges({
        added: [],
        removed: [],
        changed: [],
      }),
    ).toBe(false);
  });
});
