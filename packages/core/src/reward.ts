export function isRewardReady(count: number, goal: number): boolean {
  if (goal <= 0) {
    throw new Error('Reward goal must be greater than zero.');
  }
  return count >= goal;
}

export function nextStamp(count: number, goal: number): number {
  if (goal <= 0) {
    throw new Error('Reward goal must be greater than zero.');
  }
  if (count < 0) {
    throw new Error('Stamp count cannot be negative.');
  }
  const next = count + 1;
  return next > goal ? goal : next;
}

/**
 * Check if cooldown is active (stamp not allowed yet)
 * @param lastStampAt - ISO timestamp of last stamp, or null if never stamped
 * @param cooldownMinutes - Cooldown period in minutes (default 5)
 * @returns true if cooldown is active and stamp should be blocked
 */
export function isCooldownActive(
  lastStampAt: string | null | undefined,
  cooldownMinutes = 5
): boolean {
  if (!lastStampAt) {
    return false;
  }
  const lastStamp = new Date(lastStampAt).getTime();
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return now - lastStamp < cooldownMs;
}

/**
 * Get remaining cooldown time in seconds
 * @param lastStampAt - ISO timestamp of last stamp, or null if never stamped
 * @param cooldownMinutes - Cooldown period in minutes (default 5)
 * @returns Remaining seconds, or 0 if cooldown has expired
 */
export function getCooldownRemainingSeconds(
  lastStampAt: string | null | undefined,
  cooldownMinutes = 5
): number {
  if (!lastStampAt) {
    return 0;
  }
  const lastStamp = new Date(lastStampAt).getTime();
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const remainingMs = cooldownMs - (now - lastStamp);
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}
