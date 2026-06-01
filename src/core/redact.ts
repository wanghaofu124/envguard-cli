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

function appendCollisionHint(
  displayValue: string,
  oldLength: number,
  newLength: number,
  side: "old" | "new",
): string {
  if (side === "old") {
    return `${displayValue} (len ${oldLength})`;
  }

  if (oldLength === newLength) {
    return `${displayValue} (len ${newLength}, changed)`;
  }

  return `${displayValue} (len ${oldLength}->${newLength})`;
}

function withCollisionHint(
  key: string,
  value: string,
  otherValue: string,
  side: "old" | "new",
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

  const oldLength = side === "old" ? value.length : otherValue.length;
  const newLength = side === "old" ? otherValue.length : value.length;
  return appendCollisionHint(displayValue, oldLength, newLength, side);
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
  const displayValue = withCollisionHint(key, value, otherValue, side, redact);
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
