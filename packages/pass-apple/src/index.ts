export type ApplePassState = 'issued' | 'reward-available' | 'archived';

export interface ApplePassContract {
  serial: string;
  merchantId: string;
  memberId: string;
  updatedAt: string;
  stampCount: number;
  rewardGoal: number;
  state: ApplePassState;
}

export interface ApplePassInput {
  merchantId: string;
  memberId: string;
  stampCount: number;
  rewardGoal: number;
  state?: ApplePassState;
}

export function createApplePassContract(input: ApplePassInput): ApplePassContract {
  const now = new Date().toISOString();
  return {
    serial: `apple-${input.memberId}`,
    merchantId: input.merchantId,
    memberId: input.memberId,
    updatedAt: now,
    stampCount: input.stampCount,
    rewardGoal: input.rewardGoal,
    state: input.state ?? (input.stampCount >= input.rewardGoal ? 'reward-available' : 'issued')
  };
}
