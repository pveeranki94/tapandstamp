import React from 'react';
import { QrCode, Stamp, PartyPopper } from 'lucide-react';

const steps = [
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

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 lg:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium">
            Three steps. Zero friction.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative text-center md:text-left animate-fade-in"
              style={{ animationDelay: `${0.2 + index * 0.15}s`, animationFillMode: 'both' }}
            >
              {/* Connector line - only on desktop */}
              {index < steps.length - 1 && (
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
          ))}
        </div>
      </div>
    </section>
  );
}
