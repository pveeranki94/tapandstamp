import React from 'react';
import Image from 'next/image';
import { Smartphone, Gift, Globe, Coffee } from 'lucide-react';
import type { Entry } from 'contentful';
import type { FeatureCardFields } from '../../lib/contentful-types';

interface FeaturesSectionProps {
  content?: {
    headline: string;
    subheadline: string;
    features: Entry<FeatureCardFields>[];
  };
}

const defaultFeatures = [
  {
    icon: Smartphone,
    title: 'Digital stamp cards',
    description: 'Customers collect stamps by scanning a QR code. No paper cards to lose, no app to download.',
  },
  {
    icon: Gift,
    title: 'Rewards that matter',
    description: 'Free coffee, discounts, or perks — you decide what brings your customers back.',
  },
  {
    icon: Globe,
    title: 'Apple & Google Wallet',
    description: 'Works directly in Apple Wallet or Google Wallet. Zero friction for your guests.',
  },
  {
    icon: Coffee,
    title: 'Built for hospitality',
    description: 'Fast setup, no training needed, no clutter. Made by people who understand venues.',
  },
];

export function FeaturesSection({ content }: FeaturesSectionProps) {
  const headline = content?.headline ?? 'Everything you need.';
  const subheadline = content?.subheadline ?? "Nothing you don\u2019t.";

  return (
    <section className="py-16 md:py-24 lg:py-32 px-4 md:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-4">
            {headline}
            <br />
            <span className="text-muted-foreground">{subheadline}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {content?.features ? (
            content.features.map((feature, index) => {
              const iconUrl = feature.fields.icon?.fields?.file?.url;
              return (
                <div
                  key={feature.sys.id}
                  className="group p-8 md:p-10 bg-background border border-border rounded-lg hover:border-foreground/20 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'both' }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    {iconUrl ? (
                      <Image src={`https:${iconUrl}`} alt="" width={24} height={24} />
                    ) : (
                      <div className="w-6 h-6" />
                    )}
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium mb-3">{feature.fields.title}</h3>
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                    {feature.fields.description}
                  </p>
                </div>
              );
            })
          ) : (
            defaultFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 md:p-10 bg-background border border-border rounded-lg hover:border-foreground/20 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'both' }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-medium mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
