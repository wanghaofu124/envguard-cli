#!/usr/bin/env node

import { Command } from "commander";
import { runCheckCommand } from "./commands/check.js";
import { runDiffCommand } from "./commands/diff.js";
import { runTui } from "./tui/runTui.js";

const program = new Command();

program
  .name("envguard")
  .description("Secure .env diff tool with redaction and secret detection")
  .version("0.1.0");

program
  .command("diff")
  .description("Compare two .env files")
  .argument("<fileA>", "First env file")
  .argument("<fileB>", "Second env file")
  .option("--format <format>", "Output format: text or json", "text")
  .option("--all", "Include unchanged entries", false)
  .option("--no-redact", "Show raw values (unsafe)")
  .action(async (fileA: string, fileB: string, options) => {
    const exitCode = await runDiffCommand(fileA, fileB, {
      format: options.format,
      all: options.all,
      redact: options.redact,
    });
    process.exit(exitCode);
  });

program
  .command("check")
  .description("Scan a single .env file for secret patterns")
  .argument("<file>", "Env file to scan")
  .option("--format <format>", "Output format: text or json", "text")
  .option("--strict", "Exit with code 1 on any finding", false)
  .option("--no-redact", "Show raw values (unsafe)")
  .action(async (file: string, options) => {
    const exitCode = await runCheckCommand(file, {
      format: options.format,
      strict: options.strict,
      redact: options.redact,
    });
    process.exit(exitCode);
  });

program.action(async () => {
  const exitCode = await runTui();
  process.exit(exitCode);
});

program.parseAsync(process.argv);
