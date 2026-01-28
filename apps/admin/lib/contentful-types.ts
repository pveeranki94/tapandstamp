import type { Document } from '@contentful/rich-text-types';

export interface CtaLink {
  label: string;
  url: string;
}

export interface NavLink {
  label: string;
  url: string;
}

// Asset type (simplified)
export interface ContentfulAsset {
  sys: { id: string };
  fields: {
    title?: string;
    file?: {
      url: string;
      contentType: string;
    };
  };
}

// Entry wrapper type
export interface ContentfulEntry<T> {
  sys: { id: string };
  fields: T;
}

// Content Type: featureCard
export interface FeatureCardFields {
  title: string;
  description: string;
  icon: ContentfulAsset;
}

// Content Type: step
export interface StepFields {
  stepNumber: string;
  title: string;
  description: string;
  icon: ContentfulAsset;
}

// Content Type: navBar
export interface NavBarFields {
  logo: ContentfulAsset;
  links: NavLink[];
  ctaButton: CtaLink;
}

// Content Type: landingPage (singleton)
export interface LandingPageFields {
  title: string;
  heroHeadline: Document;
  heroSubheading: string;
  heroPrimaryCta: CtaLink;
  heroSecondaryCta: CtaLink;
  socialProofVenues: string[];
  features: ContentfulEntry<FeatureCardFields>[];
  featuresHeadline: string;
  featuresSubheadline: string;
  howItWorksSteps: ContentfulEntry<StepFields>[];
  howItWorksSectionTitle: string;
  howItWorksHeadline: string;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaPrimaryCta: CtaLink;
  ctaSecondaryText: string;
  ctaSecondaryUrl: string;
  footerTagline: string;
  footerLinks: NavLink[];
}

export type LandingPageEntry = ContentfulEntry<LandingPageFields>;
export type FeatureCardEntry = ContentfulEntry<FeatureCardFields>;
export type StepEntry = ContentfulEntry<StepFields>;
export type NavBarEntry = ContentfulEntry<NavBarFields>;
