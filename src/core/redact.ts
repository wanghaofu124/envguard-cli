const SENSITIVE_KEY_REGEX = /(password|secret|token|api_key|private_key|private|credential)/i;

export function redactValue(key: string, value: string): string {
  if (SENSITIVE_KEY_REGEX.test(key)) {
    return "****";
  }

  if (value.length <= 4) {
    return "****";
  }

  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function appendLengthHint(displayValue: string, length: number): string {
  return `${displayValue} (len ${length})`;
}

function withCollisionHint(
  key: string,
  value: string,
  otherValue: string,
  redact: boolean,
): string {
  const displayValue = redact ? redactValue(key, value) : value;

  if (!redact || value === otherValue) {
    return displayValue;
  }

  const otherDisplayValue = redact ? redactValue(key, otherValue) : otherValue;
  if (displayValue !== otherDisplayValue) {
    return displayValue;
  }

  return appendLengthHint(displayValue, value.length);
}

export function formatKeyValue(key: string, value: string, redact = true): string {
  const displayValue = redact ? redactValue(key, value) : value;
  return `${key} = ${displayValue}`;
}

export function formatChangedKeyValue(
  key: string,
  oldValue: string,
  newValue: string,
  side: "old" | "new",
  redact = true,
): string {
  const value = side === "old" ? oldValue : newValue;
  const otherValue = side === "old" ? newValue : oldValue;
  const displayValue = withCollisionHint(key, value, otherValue, redact);
  return `${key} = ${displayValue}`;
}

export function formatChangedPair(
  key: string,
  oldValue: string,
  newValue: string,
  redact = true,
): { oldLine: string; newLine: string } {
  return {
    oldLine: formatChangedKeyValue(key, oldValue, newValue, "old", redact),
    newLine: formatChangedKeyValue(key, oldValue, newValue, "new", redact),
  };
}

export function hasDiffChanges(report: {
  added: unknown[];
  removed: unknown[];
  changed: unknown[];
}): boolean {
  return report.added.length + report.removed.length + report.changed.length > 0;
}
