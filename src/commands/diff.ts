import { buildDiffReport, EnvGuardError } from "../core/service.js";
import { hasHighSeveritySecrets } from "../core/secrets.js";
import { printDiffReport, printNoRedactWarning } from "./format.js";

export interface DiffCommandOptions {
  format?: "text" | "json";
  all?: boolean;
  redact?: boolean;
}

export async function runDiffCommand(
  fileA: string,
  fileB: string,
  options: DiffCommandOptions = {},
): Promise<number> {
  const format = options.format ?? "text";
  const showAll = options.all ?? false;
  const redact = options.redact ?? true;

  try {
    const report = buildDiffReport(fileA, fileB);

    if (!redact) {
      printNoRedactWarning();
    }

    if (format === "json") {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printDiffReport(report, { showAll, redact });
    }

    if (hasHighSeveritySecrets(report.secrets)) {
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
