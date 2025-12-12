/**
 * Color utility functions for branding wizard
 * Includes WCAG contrast checking and color validation
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Calculate relative luminance for WCAG contrast calculations
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 1;
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standards
 * AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function meetsContrastAA(
  foreground: string,
  background: string,
  largeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA standards
 * AAA requires 7:1 for normal text, 4.5:1 for large text
 */
export function meetsContrastAAA(
  foreground: string,
  background: string,
  largeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get contrast status with description
 */
export function getContrastStatus(
  foreground: string,
  background: string
): {
  ratio: number;
  AA: boolean;
  AAA: boolean;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
} {
  const ratio = getContrastRatio(foreground, background);
  const AA = meetsContrastAA(foreground, background);
  const AAA = meetsContrastAAA(foreground, background);

  let status: 'excellent' | 'good' | 'fair' | 'poor';
  let message: string;

  if (AAA) {
    status = 'excellent';
    message = `Excellent contrast (${ratio.toFixed(2)}:1) - Meets WCAG AAA`;
  } else if (AA) {
    status = 'good';
    message = `Good contrast (${ratio.toFixed(2)}:1) - Meets WCAG AA`;
  } else if (ratio >= 3) {
    status = 'fair';
    message = `Fair contrast (${ratio.toFixed(2)}:1) - May be hard to read`;
  } else {
    status = 'poor';
    message = `Poor contrast (${ratio.toFixed(2)}:1) - Fails WCAG standards`;
  }

  return { ratio, AA, AAA, status, message };
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Ensure color has # prefix
 */
export function normalizeHexColor(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Determine whether black or white text provides better contrast
 * against a given background color.
 * Uses the luminance threshold of 0.179 (W3C recommendation)
 */
export function getContrastTextColor(backgroundColor: string): '#000000' | '#FFFFFF' {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  // If background is light (high luminance), use black text
  // If background is dark (low luminance), use white text
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}
