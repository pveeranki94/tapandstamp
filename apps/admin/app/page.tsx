import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  CTASection,
  Footer,
  Navbar,
} from '../components/landing';

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FBF8F5' }}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </main>
  );
}
