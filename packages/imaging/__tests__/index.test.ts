import { renderStampStrip } from '../src/index.js';
import type { Branding } from '@tapandstamp/core';

const mockBranding: Branding = {
  logoUrl: 'https://example.com/logo.png',
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

describe('renderStampStrip', () => {
  describe('basic rendering', () => {
    it('renders 0 stamps successfully', async () => {
      const result = await renderStampStrip({
        branding: mockBranding,
        count: 0
      });

      expect(result.mime).toBe('image/png');
      expect(result.width).toBe(1125);
      expect(result.height).toBe(432);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.byteLength).toBeGreaterThan(0);
    });

    it('renders partial stamps successfully', async () => {
      const result = await renderStampStrip({
        branding: mockBranding,
        count: 3
      });

      expect(result.mime).toBe('image/png');
      expect(result.buffer.byteLength).toBeGreaterThan(0);
    });

    it('renders full stamps successfully', async () => {
      const result = await renderStampStrip({
        branding: mockBranding,
        count: 8
      });

      expect(result.mime).toBe('image/png');
      expect(result.buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('platform support', () => {
    it('renders for Apple platform with correct dimensions', async () => {
      const result = await renderStampStrip({
        branding: mockBranding,
        count: 4,
        platform: 'apple'
      });

      expect(result.width).toBe(1125);
      expect(result.height).toBe(432);
    });

    it('renders for Google platform with correct dimensions', async () => {
      const result = await renderStampStrip({
        branding: mockBranding,
        count: 4,
        platform: 'google'
      });

      expect(result.width).toBe(1032);
      expect(result.height).toBe(336);
    });
  });

  describe('stamp shapes', () => {
    it('renders circle stamps', async () => {
      const brandingWithCircles: Branding = {
        ...mockBranding,
        stamp: { ...mockBranding.stamp, shape: 'circle' }
      };

      const result = await renderStampStrip({
        branding: brandingWithCircles,
        count: 5
      });

      expect(result.buffer.byteLength).toBeGreaterThan(0);
    });

    it('renders square stamps', async () => {
      const brandingWithSquares: Branding = {
        ...mockBranding,
        stamp: { ...mockBranding.stamp, shape: 'square' }
      };

      const result = await renderStampStrip({
        branding: brandingWithSquares,
        count: 5
      });

      expect(result.buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('validation', () => {
    it('throws error for negative count', async () => {
      await expect(
        renderStampStrip({
          branding: mockBranding,
          count: -1
        })
      ).rejects.toThrow('count must be between 0 and 8');
    });

    it('throws error for count exceeding total', async () => {
      await expect(
        renderStampStrip({
          branding: mockBranding,
          count: 10
        })
      ).rejects.toThrow('count must be between 0 and 8');
    });
  });

  describe('branding customization', () => {
    it('handles different stamp totals', async () => {
      const brandingWith6Stamps: Branding = {
        ...mockBranding,
        stamp: { ...mockBranding.stamp, total: 6 }
      };

      const result = await renderStampStrip({
        branding: brandingWith6Stamps,
        count: 3
      });

      expect(result.buffer.byteLength).toBeGreaterThan(0);
    });

    it('handles different color schemes', async () => {
      const customBranding: Branding = {
        ...mockBranding,
        background: { type: 'solid', color: '#000000' },
        labelColor: '#FFD700',
        stamp: {
          ...mockBranding.stamp,
          filledColor: '#FFD700',
          emptyColor: '#333333',
          outlineColor: '#FFD700'
        }
      };

      const result = await renderStampStrip({
        branding: customBranding,
        count: 4
      });

      expect(result.buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('output characteristics', () => {
    it('produces PNG images under 300KB', async () => {
      const result = await renderStampStrip({
        branding: mockBranding,
        count: 5
      });

      // Per TDD spec: <200-300 KB
      const sizeInKB = result.buffer.byteLength / 1024;
      expect(sizeInKB).toBeLessThan(300);
    });

    it('produces consistent output for same inputs', async () => {
      const result1 = await renderStampStrip({
        branding: mockBranding,
        count: 3
      });

      const result2 = await renderStampStrip({
        branding: mockBranding,
        count: 3
      });

      // Should produce identical buffers for deterministic rendering
      expect(result1.buffer.byteLength).toBe(result2.buffer.byteLength);
      expect(result1.buffer.equals(result2.buffer)).toBe(true);
    });
  });
});
