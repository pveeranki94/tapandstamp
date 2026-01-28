import { draftMode } from 'next/headers';
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  CTASection,
  Footer,
  Navbar,
} from '../components/landing';
import { LivePreviewProvider } from '../components/LivePreviewProvider';
import { getLandingPageContent } from '../lib/contentful-fetch';
import type { LandingPageFields } from '../lib/contentful-types';

export default async function LandingPage() {
  const draft = await draftMode();
  const isPreview = draft.isEnabled;

  const content = await getLandingPageContent(isPreview);
  const fields = content?.fields as LandingPageFields | undefined;

  return (
    <LivePreviewProvider isEnabled={isPreview}>
      <main className="min-h-screen" style={{ backgroundColor: '#FBF8F5' }}>
        {isPreview && (
          <div className="fixed bottom-4 right-4 z-[9999] bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
            Preview Mode{' '}
            <a href="/api/draft/disable" className="underline ml-2">
              Exit
            </a>
          </div>
        )}
        <Navbar content={fields ? { links: fields.footerLinks, ctaButton: fields.heroPrimaryCta } : undefined} />
        <HeroSection
          content={fields ? {
            subheading: fields.heroSubheading,
            primaryCta: fields.heroPrimaryCta,
            secondaryCta: fields.heroSecondaryCta,
            socialProofVenues: fields.socialProofVenues,
          } : undefined}
        />
        <FeaturesSection
          content={fields ? {
            headline: fields.featuresHeadline,
            subheadline: fields.featuresSubheadline,
            features: fields.features,
          } : undefined}
        />
        <HowItWorksSection
          content={fields ? {
            sectionTitle: fields.howItWorksSectionTitle,
            headline: fields.howItWorksHeadline,
            steps: fields.howItWorksSteps,
          } : undefined}
        />
        <CTASection
          content={fields ? {
            headline: fields.ctaHeadline,
            subtext: fields.ctaSubtext,
            primaryCta: fields.ctaPrimaryCta,
            secondaryText: fields.ctaSecondaryText,
            secondaryUrl: fields.ctaSecondaryUrl,
          } : undefined}
        />
        <Footer
          content={fields ? {
            tagline: fields.footerTagline,
            links: fields.footerLinks,
          } : undefined}
        />
      </main>
    </LivePreviewProvider>
  );
}
