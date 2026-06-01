import { EnvGuardError } from "../core/service.js";

export function parseOutputFormat(format: string): "text" | "json" {
  if (format === "text" || format === "json") {
    return format;
  }

  throw new EnvGuardError(`Invalid format "${format}". Use text or json.`, 2);
}
