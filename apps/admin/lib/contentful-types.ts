import type { Asset, Entry, EntryFields } from 'contentful';
import type { Document } from '@contentful/rich-text-types';

export interface CtaLink {
  label: string;
  url: string;
}

export interface NavLink {
  label: string;
  url: string;
}

// Content Type: featureCard
export interface FeatureCardFields {
  title: EntryFields.Text;
  description: EntryFields.Text;
  icon: Asset;
}

// Content Type: step
export interface StepFields {
  stepNumber: EntryFields.Text;
  title: EntryFields.Text;
  description: EntryFields.Text;
  icon: Asset;
}

// Content Type: navBar
export interface NavBarFields {
  logo: Asset;
  links: NavLink[];
  ctaButton: CtaLink;
}

// Content Type: landingPage (singleton)
export interface LandingPageFields {
  title: EntryFields.Text;
  heroHeadline: Document;
  heroSubheading: EntryFields.Text;
  heroPrimaryCta: CtaLink;
  heroSecondaryCta: CtaLink;
  socialProofVenues: string[];
  features: Entry<FeatureCardFields>[];
  featuresHeadline: EntryFields.Text;
  featuresSubheadline: EntryFields.Text;
  howItWorksSteps: Entry<StepFields>[];
  howItWorksSectionTitle: EntryFields.Text;
  howItWorksHeadline: EntryFields.Text;
  ctaHeadline: EntryFields.Text;
  ctaSubtext: EntryFields.Text;
  ctaPrimaryCta: CtaLink;
  ctaSecondaryText: EntryFields.Text;
  ctaSecondaryUrl: EntryFields.Text;
  footerTagline: EntryFields.Text;
  footerLinks: NavLink[];
}

export type LandingPageEntry = Entry<LandingPageFields>;
export type FeatureCardEntry = Entry<FeatureCardFields>;
export type StepEntry = Entry<StepFields>;
export type NavBarEntry = Entry<NavBarFields>;
