// Core types
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

// Pass builder exports
export {
  buildPassBundle,
  createPassJsonContent,
  type PassBuilderConfig,
  type PassInput,
} from './pass-builder.js';

// Signer exports
export {
  signManifest,
  sha1Hash,
  loadP12Certificate,
  verifyCertificate,
  type SignerConfig,
} from './signer.js';

// APNs exports
export {
  sendPassUpdate,
  sendPassUpdateToAllDevices,
  type APNsConfig,
} from './apns.js';
