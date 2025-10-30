import { createApplePassContract } from '../src/index.js';

describe('createApplePassContract', () => {
  it('creates a reward-available state when goal met', () => {
    const contract = createApplePassContract({
      merchantId: 'merchant-1',
      memberId: 'member-1',
      stampCount: 8,
      rewardGoal: 8
    });
    expect(contract.state).toBe('reward-available');
    expect(contract.serial).toBe('apple-member-1');
  });
});
