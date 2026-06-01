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

export function formatKeyValue(key: string, value: string, redact = true): string {
  const displayValue = redact ? redactValue(key, value) : value;
  return `${key} = ${displayValue}`;
}
