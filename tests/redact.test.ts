import { describe, expect, it } from "vitest";
import { formatKeyValue, redactValue } from "../src/core/redact.js";

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

describe("formatKeyValue", () => {
  it("formats redacted output by default", () => {
    expect(formatKeyValue("DB_HOST", "localhost")).toBe("DB_HOST = lo***st");
  });

  it("can show raw values", () => {
    expect(formatKeyValue("DB_HOST", "localhost", false)).toBe("DB_HOST = localhost");
  });
});
