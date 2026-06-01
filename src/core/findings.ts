import type { SecretFinding, SecretSeverity } from "../types.js";

export interface GroupedFinding {
  key: string;
  severity: SecretSeverity;
  reasons: string[];
  value: string;
}

export function groupFindingsByKey(findings: SecretFinding[]): GroupedFinding[] {
  const grouped = new Map<string, GroupedFinding>();

  for (const finding of findings) {
    const existing = grouped.get(finding.key);
    if (!existing) {
      grouped.set(finding.key, {
        key: finding.key,
        severity: finding.severity,
        reasons: [finding.reason],
        value: finding.value,
      });
      continue;
    }

    if (finding.severity === "error") {
      existing.severity = "error";
    }

    if (!existing.reasons.includes(finding.reason)) {
      existing.reasons.push(finding.reason);
    }
  }

  return [...grouped.values()].sort((a, b) => a.key.localeCompare(b.key));
}
