import { readFileSync } from "node:fs";
import type { EnvMap, ParseResult } from "../types.js";

const KEY_VALUE_REGEX =
  /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

function stripInlineComment(value: string): string {
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    const prev = value[i - 1];

    if (char === "'" && !inDouble && prev !== "\\") {
      inSingle = !inSingle;
    } else if (char === '"' && !inSingle && prev !== "\\") {
      inDouble = !inDouble;
    } else if (char === "#" && !inSingle && !inDouble) {
      return value.slice(0, i).trimEnd();
    }
  }

  return value;
}

function unquoteValue(raw: string): string {
  const trimmed = raw.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const inner = trimmed.slice(1, -1);
    if (trimmed.startsWith('"')) {
      return inner.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    return inner;
  }

  return trimmed;
}

export function parseEnvContent(content: string): ParseResult {
  const entries: EnvMap = new Map();
  const warnings: string[] = [];
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(KEY_VALUE_REGEX);
    if (!match) {
      warnings.push(`Line ${lineNumber}: unable to parse entry`);
      continue;
    }

    const key = match[1];
    const value = unquoteValue(stripInlineComment(match[2]));

    if (entries.has(key)) {
      warnings.push(`Line ${lineNumber}: duplicate key "${key}" overwritten`);
    }

    entries.set(key, { value, line: lineNumber });
  }

  return { entries, warnings };
}

export function parseEnvFile(filePath: string): ParseResult {
  const content = readFileSync(filePath, "utf8");
  return parseEnvContent(content);
}
