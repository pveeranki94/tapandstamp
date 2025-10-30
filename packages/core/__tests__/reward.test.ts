import { isRewardReady, nextStamp } from '../src/reward.js';

describe('reward utilities', () => {
  it('determines reward readiness', () => {
    expect(isRewardReady(8, 8)).toBe(true);
    expect(isRewardReady(5, 8)).toBe(false);
  });

  it('increments without exceeding goal', () => {
    expect(nextStamp(0, 8)).toBe(1);
    expect(nextStamp(7, 8)).toBe(8);
    expect(nextStamp(8, 8)).toBe(8);
  });

  it('guards invalid values', () => {
    expect(() => nextStamp(-1, 8)).toThrow('Stamp count cannot be negative.');
    expect(() => nextStamp(0, 0)).toThrow('Reward goal must be greater than zero.');
    expect(() => isRewardReady(1, 0)).toThrow('Reward goal must be greater than zero.');
  });
});
