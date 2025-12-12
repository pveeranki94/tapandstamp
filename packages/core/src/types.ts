export interface StampConfig {
  total: number;
  shape: 'circle' | 'square' | 'logo';
  filledColor: string;
  emptyColor: string;
  outlineColor: string;
  overlayLogo: boolean;
}

export interface BackgroundConfig {
  type: 'solid' | 'image';
  color: string;
  imageUrl?: string;
}

export interface Branding {
  logoUrl: string;
  headerLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  labelColor: string;
  background: BackgroundConfig;
  stamp: StampConfig;
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
