import { buildCheckReport, EnvGuardError } from "../core/service.js";
import { hasAnySecrets, hasHighSeveritySecrets } from "../core/secrets.js";
import { printCheckReport, printNoRedactWarning } from "./format.js";

export interface CheckCommandOptions {
  format?: "text" | "json";
  strict?: boolean;
  redact?: boolean;
}

export async function runCheckCommand(
  filePath: string,
  options: CheckCommandOptions = {},
): Promise<number> {
  const format = options.format ?? "text";
  const strict = options.strict ?? false;
  const redact = options.redact ?? true;

  try {
    const report = buildCheckReport(filePath);

    if (!redact) {
      printNoRedactWarning();
    }

    if (format === "json") {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printCheckReport(report, { redact });
    }

    if (hasHighSeveritySecrets(report.secrets)) {
      return 1;
    }

    if (strict && hasAnySecrets(report.secrets)) {
      return 1;
    }

    return 0;
  } catch (error) {
    if (error instanceof EnvGuardError) {
      console.error(error.message);
      return error.exitCode;
    }
    throw error;
  }
}
