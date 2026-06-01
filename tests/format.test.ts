import { describe, expect, it } from "vitest";
import { parseOutputFormat } from "../src/commands/validate.js";
import { EnvGuardError } from "../src/core/service.js";

describe("parseOutputFormat", () => {
  it("accepts text and json", () => {
    expect(parseOutputFormat("text")).toBe("text");
    expect(parseOutputFormat("json")).toBe("json");
  });

  it("rejects invalid formats", () => {
    expect(() => parseOutputFormat("invalid")).toThrow(EnvGuardError);
    expect(() => parseOutputFormat("invalid")).toThrow('Invalid format "invalid". Use text or json.');
  });
});
