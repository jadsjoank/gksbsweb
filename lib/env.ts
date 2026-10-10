const PLACEHOLDER_PATTERNS = [
  /^https?:\/\/your-project\.supabase\.co$/i,
  /^https?:\/\/placeholder\.supabase\.co$/i,
  /^placeholder$/i,
  /^your-/i,
  /^replace-with/i,
  /^re_your-/i,
  /^example\.com$/i,
];

export function isPlaceholderValue(value: string | undefined): boolean {
  if (!value || !value.trim()) return true;
  const normalized = value.trim();
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value || isPlaceholderValue(value)) {
    throw new Error(
      `${name} is not configured. Set the real value in .env.local or your deployment environment before running the app.`
    );
  }

  return value;
}

export function getRequiredSecret(name: string, minimumLength = 32): string {
  const value = getRequiredEnv(name);
  if (value.length < minimumLength) {
    throw new Error(`${name} must be at least ${minimumLength} characters long.`);
  }
  return value;
}
