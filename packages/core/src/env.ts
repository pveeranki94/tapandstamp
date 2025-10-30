const REQUIRED_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'BASE_URL',
  'COOLDOWN_MINUTES',
  'REWARD_GOAL'
] as const;

type RequiredKey = (typeof REQUIRED_KEYS)[number];

export type CoreEnv = Record<RequiredKey, string>;

export function loadEnv(source: Record<string, string | undefined> = process.env): CoreEnv {
  const missing: string[] = [];
  const result = {} as CoreEnv;

  for (const key of REQUIRED_KEYS) {
    const value = source[key];
    if (!value) {
      missing.push(key);
      continue;
    }
    result[key] = value;
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return result;
}
