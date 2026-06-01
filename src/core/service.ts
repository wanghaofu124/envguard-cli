import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { diffEnvMaps } from "../core/diff.js";
import { parseEnvFile } from "../core/parser.js";
import { detectSecretForEntry, scanEnvMap } from "../core/secrets.js";
import type { DiffJsonOutput, DiffResult, SecretFinding } from "../types.js";

export class EnvGuardError extends Error {
  constructor(
    message: string,
    readonly exitCode = 2,
  ) {
    super(message);
    this.name = "EnvGuardError";
  }
}

export function resolveEnvFile(filePath: string): string {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    throw new EnvGuardError(`File not found: ${resolved}`);
  }
  return resolved;
}

export interface LoadedEnvFile {
  path: string;
  entries: ReturnType<typeof parseEnvFile>["entries"];
  warnings: string[];
}

export function loadEnvFile(filePath: string): LoadedEnvFile {
  const path = resolveEnvFile(filePath);
  try {
    const { entries, warnings } = parseEnvFile(path);
    return { path, entries, warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new EnvGuardError(`Failed to read ${path}: ${message}`);
  }
}

function collectDiffSecrets(
  diff: DiffResult,
  side: "added" | "removed" | "changed",
): SecretFinding[] {
  const findings: SecretFinding[] = [];

  if (side === "added") {
    for (const entry of diff.added) {
      findings.push(...detectSecretForEntry(entry.key, entry.value, entry.line));
    }
  }

  if (side === "removed") {
    for (const entry of diff.removed) {
      findings.push(...detectSecretForEntry(entry.key, entry.value, entry.line));
    }
  }

  if (side === "changed") {
    for (const entry of diff.changed) {
      findings.push(...detectSecretForEntry(entry.key, entry.oldValue, entry.oldLine));
      findings.push(...detectSecretForEntry(entry.key, entry.newValue, entry.newLine));
    }
  }

  return findings;
}

export function buildDiffReport(fileA: string, fileB: string): DiffJsonOutput {
  const loadedA = loadEnvFile(fileA);
  const loadedB = loadEnvFile(fileB);
  const diff = diffEnvMaps(loadedA.entries, loadedB.entries);

  const added = diff.added.map((entry) => ({
    ...entry,
    secrets: detectSecretForEntry(entry.key, entry.value, entry.line),
  }));

  const removed = diff.removed.map((entry) => ({
    ...entry,
    secrets: detectSecretForEntry(entry.key, entry.value, entry.line),
  }));

  const changed = diff.changed.map((entry) => ({
    ...entry,
    secrets: [
      ...detectSecretForEntry(entry.key, entry.oldValue, entry.oldLine),
      ...detectSecretForEntry(entry.key, entry.newValue, entry.newLine),
    ],
  }));

  const secrets = [
    ...collectDiffSecrets(diff, "added"),
    ...collectDiffSecrets(diff, "removed"),
    ...collectDiffSecrets(diff, "changed"),
  ].filter(
    (finding, index, array) =>
      array.findIndex(
        (item) =>
          item.key === finding.key &&
          item.reason === finding.reason &&
          item.severity === finding.severity,
      ) === index,
  );

  return {
    fileA: loadedA.path,
    fileB: loadedB.path,
    added,
    removed,
    changed,
    unchanged: diff.unchanged,
    secrets,
    warnings: [...loadedA.warnings, ...loadedB.warnings],
  };
}

export function buildCheckReport(filePath: string) {
  const loaded = loadEnvFile(filePath);
  const secrets = scanEnvMap(loaded.entries);

  return {
    file: loaded.path,
    secrets,
    warnings: loaded.warnings,
    entryCount: loaded.entries.size,
  };
}
