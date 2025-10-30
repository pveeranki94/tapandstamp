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
