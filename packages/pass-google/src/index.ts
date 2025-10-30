export type GooglePassState = 'issued' | 'reward-available' | 'archived';

export interface GooglePassContract {
  objectId: string;
  merchantId: string;
  memberId: string;
  stampCount: number;
  rewardGoal: number;
  state: GooglePassState;
  updatedAt: string;
}

export interface GooglePassInput {
  merchantId: string;
  memberId: string;
  stampCount: number;
  rewardGoal: number;
  state?: GooglePassState;
}

export function createGooglePassContract(input: GooglePassInput): GooglePassContract {
  const now = new Date().toISOString();
  return {
    objectId: `google-${input.memberId}`,
    merchantId: input.merchantId,
    memberId: input.memberId,
    stampCount: input.stampCount,
    rewardGoal: input.rewardGoal,
    state: input.state ?? (input.stampCount >= input.rewardGoal ? 'reward-available' : 'issued'),
    updatedAt: now
  };
}
