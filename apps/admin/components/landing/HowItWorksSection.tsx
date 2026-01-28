import React from 'react';
import Image from 'next/image';
import { QrCode, Stamp, PartyPopper } from 'lucide-react';
import type { ContentfulEntry, StepFields } from '../../lib/contentful-types';

interface HowItWorksSectionProps {
  content?: {
    sectionTitle: string;
    headline: string;
    steps: ContentfulEntry<StepFields>[];
  };
}

const defaultSteps = [
  {
    number: '01',
    icon: QrCode,
    title: 'Customer scans',
    description: 'Display a QR code at checkout. Customers scan with their phone camera — no app download needed.',
  },
  {
    number: '02',
    icon: Stamp,
    title: 'Stamp collected',
    description: 'Each visit earns a digital stamp. Progress is saved automatically to their Apple or Google Wallet.',
  },
  {
    number: '03',
    icon: PartyPopper,
    title: 'Reward unlocked',
    description: 'After collecting enough stamps, they redeem their reward. The pass updates instantly.',
  },
];

export function HowItWorksSection({ content }: HowItWorksSectionProps) {
  const sectionTitle = content?.sectionTitle ?? 'How it works';
  const headline = content?.headline ?? 'Three steps. Zero friction.';
  const cmsSteps = content?.steps;

  const stepCount = cmsSteps?.length ?? defaultSteps.length;

  return (
    <section id="how-it-works" className="py-16 md:py-24 lg:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">{sectionTitle}</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium">
            {headline}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {cmsSteps ? (
            cmsSteps.map((step, index) => {
              const iconUrl = step.fields.icon?.fields?.file?.url;
              return (
                <div
                  key={step.sys.id}
                  className="relative text-center md:text-left animate-fade-in"
                  style={{ animationDelay: `${0.2 + index * 0.15}s`, animationFillMode: 'both' }}
                >
                  {index < stepCount - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-border" />
                  )}
                  <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6 mx-auto md:mx-0">
                    {iconUrl ? (
                      <Image src={`https:${iconUrl}`} alt="" width={40} height={40} />
                    ) : (
                      <div className="w-10 h-10" />
                    )}
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                      {step.fields.stepNumber}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium mb-3">{step.fields.title}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto md:mx-0">
                    {step.fields.description}
                  </p>
                </div>
              );
            })
          ) : (
            defaultSteps.map((step, index) => (
              <div
                key={step.number}
                className="relative text-center md:text-left animate-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.15}s`, animationFillMode: 'both' }}
              >
                {index < defaultSteps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-border" />
                )}
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6 mx-auto md:mx-0">
                  <step.icon className="w-10 h-10 text-foreground" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-medium mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto md:mx-0">
                  {step.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
