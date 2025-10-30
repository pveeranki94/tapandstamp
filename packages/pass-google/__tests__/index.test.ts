import { createGooglePassContract } from '../src/index.js';

describe('createGooglePassContract', () => {
  it('defaults to issued until goal reached', () => {
    const contract = createGooglePassContract({
      merchantId: 'merchant-1',
      memberId: 'member-1',
      stampCount: 3,
      rewardGoal: 8
    });
    expect(contract.state).toBe('issued');
    expect(contract.objectId).toBe('google-member-1');
  });
});
