'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

export function HeroSection() {
  return (
    <section className="pt-32 md:pt-40 lg:pt-48 pb-16 md:pb-24 lg:pb-32 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Main headline */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-6 md:mb-8">
            <span className="inline-flex flex-wrap justify-center items-center gap-2 md:gap-3">
              <span className="border border-foreground px-4 md:px-6 py-2 md:py-3 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                Turn
              </span>
              <span className="border border-foreground px-4 md:px-6 py-2 md:py-3 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                first-time
              </span>
              <span className="bg-primary text-primary-foreground border border-foreground px-4 md:px-6 py-2 md:py-3 rounded-[20px] md:rounded-[32px] animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                guests
              </span>
            </span>
            <br />
            <span className="inline-flex flex-wrap justify-center items-center gap-2 md:gap-3 mt-2 md:mt-3">
              <span className="border border-foreground px-4 md:px-6 py-2 md:py-3 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                into
              </span>
              <span className="bg-accent text-accent-foreground border border-foreground px-4 md:px-6 py-2 md:py-3 rounded-[20px] md:rounded-[32px] animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                regulars.
              </span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
            Simple digital loyalty for cafes, bars, and restaurants — no app download required for your customers.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
          <Button
            size="lg"
            asChild
            className="group relative overflow-hidden bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-base font-medium"
          >
            <Link href="/login?mode=signup">
              <span className="relative z-10 flex items-center gap-2">
                Start free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-6 text-base font-medium border-foreground/20 hover:bg-muted"
          >
            See how it works
          </Button>
        </div>

        {/* Social proof */}
        <div className="mt-16 md:mt-24 text-center animate-fade-in" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
          <p className="text-sm text-muted-foreground mb-4">Trusted by local venues</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <span className="text-lg font-medium">The Corner Cafe</span>
            <span className="text-lg font-medium">Bar Centrale</span>
            <span className="text-lg font-medium">Little Elm</span>
            <span className="text-lg font-medium">Brew & Co</span>
          </div>
        </div>
      </div>
    </section>
  );
}
