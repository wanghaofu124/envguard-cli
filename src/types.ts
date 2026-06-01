export interface EnvEntry {
  value: string;
  line: number;
}

export type EnvMap = Map<string, EnvEntry>;

export interface ParseResult {
  entries: EnvMap;
  warnings: string[];
}

export interface ChangedEntry {
  key: string;
  oldValue: string;
  newValue: string;
  oldLine?: number;
  newLine?: number;
}

export interface DiffResult {
  added: Array<{ key: string; value: string; line?: number }>;
  removed: Array<{ key: string; value: string; line?: number }>;
  changed: ChangedEntry[];
  unchanged: Array<{ key: string; value: string }>;
}

export type SecretSeverity = "warning" | "error";

export interface SecretFinding {
  key: string;
  value: string;
  line?: number;
  severity: SecretSeverity;
  reason: string;
}

export type DiffViewMode = "diff" | "all" | "secrets";

export interface DiffDisplayOptions {
  redact?: boolean;
  showAll?: boolean;
}

export interface DiffJsonOutput {
  fileA: string;
  fileB: string;
  added: Array<{ key: string; value: string; line?: number; secrets?: SecretFinding[] }>;
  removed: Array<{ key: string; value: string; line?: number; secrets?: SecretFinding[] }>;
  changed: Array<{
    key: string;
    oldValue: string;
    newValue: string;
    oldLine?: number;
    newLine?: number;
    secrets?: SecretFinding[];
  }>;
  unchanged: Array<{ key: string; value: string }>;
  secrets: SecretFinding[];
  warnings: string[];
}
