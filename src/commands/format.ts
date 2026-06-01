import chalk from "chalk";
import Table from "cli-table3";
import { groupFindingsByKey } from "../core/findings.js";
import {
  formatChangedPair,
  formatKeyValue,
  hasDiffChanges,
} from "../core/redact.js";
import type { DiffJsonOutput, SecretFinding } from "../types.js";

function formatSecretBadge(findings: SecretFinding[] | undefined): string {
  if (!findings || findings.length === 0) {
    return "";
  }

  const hasError = findings.some((finding) => finding.severity === "error");
  return hasError ? chalk.red(" [!secret]") : chalk.yellow(" [!warning]");
}

export function printDiffReport(report: DiffJsonOutput, options: { showAll?: boolean; redact?: boolean } = {}) {
  const { showAll = false, redact = true } = options;
  const hasDiff = hasDiffChanges(report);
  const groupedSecrets = groupFindingsByKey(report.secrets);

  console.log(chalk.bold("EnvGuard Diff"));
  console.log(`A: ${report.fileA}`);
  console.log(`B: ${report.fileB}`);
  console.log("");

  if (report.warnings.length > 0) {
    console.log(chalk.yellow("Warnings:"));
    for (const warning of report.warnings) {
      console.log(chalk.yellow(`  - ${warning}`));
    }
    console.log("");
  }

  const sections = [
    { title: "ADDED", color: chalk.green, items: report.added },
    { title: "REMOVED", color: chalk.red, items: report.removed },
  ];

  for (const section of sections) {
    if (section.items.length === 0) {
      continue;
    }

    console.log(section.color(`+ ${section.title} (${section.items.length})`));
    for (const item of section.items) {
      const line = formatKeyValue(item.key, item.value, redact);
      console.log(`  ${line}${formatSecretBadge(item.secrets)}`);
    }
    console.log("");
  }

  if (report.changed.length > 0) {
    console.log(chalk.cyan(`~ CHANGED (${report.changed.length})`));
    for (const item of report.changed) {
      const { oldLine, newLine } = formatChangedPair(item.key, item.oldValue, item.newValue, redact);
      console.log(`  - ${oldLine}`);
      console.log(`  + ${newLine}${formatSecretBadge(item.secrets)}`);
    }
    console.log("");
  }

  if (showAll && report.unchanged.length > 0) {
    console.log(chalk.gray(`= UNCHANGED (${report.unchanged.length})`));
    for (const item of report.unchanged) {
      console.log(chalk.gray(`  ${formatKeyValue(item.key, item.value, redact)}`));
    }
    console.log("");
  }

  if (!hasDiff) {
    console.log(chalk.green("No differences found."));
  }

  if (groupedSecrets.length > 0) {
    console.log(chalk.yellow(`Secrets detected: ${groupedSecrets.length}`));
    for (const finding of groupedSecrets) {
      const label = finding.severity === "error" ? chalk.red("ERROR") : chalk.yellow("WARN");
      console.log(`  ${label} ${finding.key}: ${finding.reasons.join("; ")}`);
    }
  } else if (hasDiff) {
    console.log(chalk.green("No secret patterns detected."));
  }
}

export function printCheckReport(
  report: ReturnType<typeof import("../core/service.js").buildCheckReport>,
  options: { redact?: boolean } = {},
) {
  const { redact = true } = options;

  console.log(chalk.bold("EnvGuard Check"));
  console.log(`File: ${report.file}`);
  console.log(`Entries: ${report.entryCount}`);
  console.log("");

  if (report.warnings.length > 0) {
    console.log(chalk.yellow("Warnings:"));
    for (const warning of report.warnings) {
      console.log(chalk.yellow(`  - ${warning}`));
    }
    console.log("");
  }

  const grouped = groupFindingsByKey(report.secrets);
  if (grouped.length === 0) {
    console.log(chalk.green("No secret patterns detected."));
    return;
  }

  const table = new Table({
    head: ["Severity", "Key", "Reason", "Value"],
  });

  for (const finding of grouped) {
    table.push([
      finding.severity === "error" ? chalk.red("error") : chalk.yellow("warning"),
      finding.key,
      finding.reasons.join("; "),
      formatKeyValue(finding.key, finding.value, redact).split(" = ")[1] ?? "****",
    ]);
  }

  console.log(table.toString());
}

export function printNoRedactWarning() {
  console.log(chalk.red("Warning: --no-redact exposes sensitive values in terminal output."));
}
