import type { EnvMap, SecretFinding, SecretSeverity } from "../types.js";

const SENSITIVE_KEY_REGEX = /(password|secret|token|api_key|private_key|credential)/i;

const PATTERN_RULES: Array<{ name: string; severity: SecretSeverity; regex: RegExp }> = [
  { name: "OpenAI API key", severity: "error", regex: /sk-[a-zA-Z0-9]{20,}/ },
  { name: "GitHub personal access token", severity: "error", regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: "AWS access key ID", severity: "error", regex: /AKIA[0-9A-Z]{16}/ },
  {
    name: "JWT token",
    severity: "error",
    regex: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
  },
];

function isHighEntropy(value: string): boolean {
  if (value.length < 32) {
    return false;
  }

  const alphanumeric = value.replace(/[^a-zA-Z0-9]/g, "").length;
  return alphanumeric / value.length > 0.8;
}

function pushFinding(
  findings: SecretFinding[],
  seen: Set<string>,
  finding: SecretFinding,
): void {
  const id = `${finding.key}:${finding.reason}:${finding.severity}`;
  if (seen.has(id)) {
    return;
  }
  seen.add(id);
  findings.push(finding);
}

export function detectSecretForEntry(
  key: string,
  value: string,
  line?: number,
): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const seen = new Set<string>();

  if (SENSITIVE_KEY_REGEX.test(key)) {
    pushFinding(findings, seen, {
      key,
      value,
      line,
      severity: "warning",
      reason: "Sensitive key name",
    });
  }

  for (const rule of PATTERN_RULES) {
    if (rule.regex.test(value)) {
      pushFinding(findings, seen, {
        key,
        value,
        line,
        severity: rule.severity,
        reason: rule.name,
      });
    }
  }

  if (isHighEntropy(value)) {
    pushFinding(findings, seen, {
      key,
      value,
      line,
      severity: "warning",
      reason: "High-entropy value",
    });
  }

  return findings;
}

export function scanEnvMap(entries: EnvMap): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const seen = new Set<string>();

  for (const [key, entry] of entries) {
    for (const finding of detectSecretForEntry(key, entry.value, entry.line)) {
      pushFinding(findings, seen, finding);
    }
  }

  return findings.sort((a, b) => a.key.localeCompare(b.key));
}

export function hasHighSeveritySecrets(findings: SecretFinding[]): boolean {
  return findings.some((finding) => finding.severity === "error");
}

export function hasAnySecrets(findings: SecretFinding[]): boolean {
  return findings.length > 0;
}
