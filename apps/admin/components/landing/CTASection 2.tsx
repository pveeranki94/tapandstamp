'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

export function CTASection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 px-4 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-6">
          Ready to build your regulars?
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Start for free. Create your first loyalty card in minutes. No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="group relative overflow-hidden bg-foreground text-background hover:bg-foreground/90 px-10 py-6 text-base font-medium"
          >
            <Link href="/login?mode=signup">
              <span className="relative z-10 flex items-center gap-2">
                Create your free account
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
