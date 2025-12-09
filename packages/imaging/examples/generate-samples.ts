/**
 * Example script to generate sample stamp strip images
 *
 * Usage:
 *   pnpm tsx examples/generate-samples.ts
 *
 * This will generate sample PNG files in the examples/output directory
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderStampStrip } from '../src/index.js';
import type { Branding } from '@tapandstamp/core';

const currentDir = dirname(fileURLToPath(import.meta.url));
const outputDir = join(currentDir, 'output');

// Create output directory if it doesn't exist
try {
  mkdirSync(outputDir, { recursive: true });
} catch (err) {
  // Directory already exists
}

// Example branding configurations
const coffeeBranding: Branding = {
  logoUrl: 'https://example.com/coffee-logo.png',
  primaryColor: '#6B4A3A',
  secondaryColor: '#E8D9CF',
  labelColor: '#FFFFFF',
  background: {
    type: 'solid',
    color: '#6B4A3A'
  },
  stamp: {
    total: 8,
    shape: 'circle',
    filledColor: '#FFFFFF',
    emptyColor: '#E8D9CF',
    outlineColor: '#FFFFFF',
    overlayLogo: false
  }
};

const modernBranding: Branding = {
  logoUrl: 'https://example.com/modern-logo.png',
  primaryColor: '#1A1A1A',
  secondaryColor: '#FFD700',
  labelColor: '#FFD700',
  background: {
    type: 'solid',
    color: '#1A1A1A'
  },
  stamp: {
    total: 6,
    shape: 'square',
    filledColor: '#FFD700',
    emptyColor: '#333333',
    outlineColor: '#FFD700',
    overlayLogo: false
  }
};

async function generateSamples() {
  console.log('Generating sample stamp strip images...\n');

  // Coffee shop samples - circles
  for (let i = 0; i <= coffeeBranding.stamp.total; i++) {
    const result = await renderStampStrip({
      branding: coffeeBranding,
      count: i,
      platform: 'apple'
    });

    const filename = `coffee-circle-${i}of${coffeeBranding.stamp.total}-apple.png`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, result.buffer);

    const sizeKB = (result.buffer.byteLength / 1024).toFixed(1);
    console.log(`✓ ${filename} (${sizeKB} KB)`);
  }

  console.log('');

  // Modern cafe samples - squares
  for (let i = 0; i <= modernBranding.stamp.total; i++) {
    const result = await renderStampStrip({
      branding: modernBranding,
      count: i,
      platform: 'google'
    });

    const filename = `modern-square-${i}of${modernBranding.stamp.total}-google.png`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, result.buffer);

    const sizeKB = (result.buffer.byteLength / 1024).toFixed(1);
    console.log(`✓ ${filename} (${sizeKB} KB)`);
  }

  console.log('\n✨ Sample images generated successfully!');
  console.log(`📁 Output directory: ${outputDir}`);
}

// Run the generation
generateSamples().catch((error) => {
  console.error('Error generating samples:', error);
  process.exit(1);
});
