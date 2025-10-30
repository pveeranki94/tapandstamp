export interface Branding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  labelColor: string;
  stampTotal: number;
}

export interface Merchant {
  id: string;
  slug: string;
  name: string;
  rewardGoal: number;
  createdAt: string;
}

export interface Member {
  id: string;
  merchantId: string;
  stampCount: number;
  rewardAvailable: boolean;
  lastStampAt?: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  merchantId: string;
  memberId: string;
  stampedAt: string;
}
