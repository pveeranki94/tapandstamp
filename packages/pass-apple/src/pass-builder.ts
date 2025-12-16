import JSZip from 'jszip';
import sharp from 'sharp';
import type { Branding, Merchant, Member } from '@tapandstamp/core';
import { signManifest, sha1Hash, type SignerConfig } from './signer.js';

export interface PassBuilderConfig {
  passTypeId: string;
  teamId: string;
  webServiceUrl: string;
  signerConfig: SignerConfig;
}

export interface PassInput {
  merchant: Merchant;
  member: Member;
  branding: Branding;
  memberName?: string;
  authToken: string;
}

interface PassJson {
  formatVersion: number;
  passTypeIdentifier: string;
  teamIdentifier: string;
  serialNumber: string;
  organizationName: string;
  description: string;
  logoText?: string;
  foregroundColor: string;
  backgroundColor: string;
  labelColor: string;
  storeCard: {
    headerFields: Array<{ key: string; label: string; value: string }>;
    secondaryFields: Array<{ key: string; label: string; value: string }>;
    backFields: Array<{ key: string; label: string; value: string }>;
  };
  barcode: {
    format: string;
    message: string;
    messageEncoding: string;
  };
  barcodes: Array<{
    format: string;
    message: string;
    messageEncoding: string;
  }>;
  webServiceURL?: string;
  authenticationToken?: string;
}

/**
 * Converts a hex color to RGB format for PassKit
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return 'rgb(0, 0, 0)';
  }
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Creates the pass.json structure for an Apple Wallet store card
 */
function createPassJson(
  input: PassInput,
  config: PassBuilderConfig
): PassJson {
  const { merchant, member, branding, memberName, authToken } = input;
  const stampCount = member.stampCount;
  const rewardGoal = merchant.rewardGoal;
  const hasReward = member.rewardAvailable;

  const stampDisplay = hasReward
    ? `🎁 REWARD READY!`
    : `${stampCount} / ${rewardGoal}`;

  const passJson: PassJson = {
    formatVersion: 1,
    passTypeIdentifier: config.passTypeId,
    teamIdentifier: config.teamId,
    serialNumber: `apple-${member.id}`,
    organizationName: merchant.name,
    description: `${merchant.name} Loyalty Card`,
    // No logoText - we always use logo image (either headerLogoUrl or generated text logo)
    foregroundColor: hexToRgb(branding.labelColor),
    backgroundColor: hexToRgb(branding.background.color),
    labelColor: hexToRgb(branding.labelColor),
    storeCard: {
      headerFields: [
        {
          key: 'stamps',
          label: 'STAMPS',
          value: stampDisplay,
        },
      ],
      secondaryFields: [],
      backFields: [
        {
          key: 'terms',
          label: 'Terms & Conditions',
          value: `Collect ${rewardGoal} stamps to earn a free reward. One stamp per visit. Stamps expire after 12 months of inactivity.`,
        },
        {
          key: 'merchant',
          label: 'About',
          value: merchant.name,
        },
      ],
    },
    barcode: {
      format: 'PKBarcodeFormatQR',
      message: `${config.webServiceUrl}/stamp/${member.id}`,
      messageEncoding: 'iso-8859-1',
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: `${config.webServiceUrl}/stamp/${member.id}`,
        messageEncoding: 'iso-8859-1',
      },
    ],
  };

  // Add member name if provided
  if (memberName) {
    passJson.storeCard.secondaryFields.push({
      key: 'member',
      label: 'MEMBER',
      value: memberName,
    });
  }

  // Add web service URL for push updates (skip localhost - Apple rejects it)
  if (config.webServiceUrl && !config.webServiceUrl.includes('localhost')) {
    passJson.webServiceURL = `${config.webServiceUrl}/passkit/v1`;
    passJson.authenticationToken = authToken;
  }

  return passJson;
}

/**
 * Generates a simple colored icon from the primary color
 */
async function generateIcon(
  branding: Branding,
  size: number
): Promise<Buffer> {
  // Create a simple circle icon with the primary color
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${branding.primaryColor}" />
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generates a text-based logo image when no header logo is provided
 */
async function generateTextLogo(
  merchantName: string,
  branding: Branding,
  width: number,
  height: number
): Promise<Buffer> {
  // Use primary color for text, scale font to fit
  const fontSize = Math.min(height * 0.6, width / merchantName.length * 1.5);
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="${height * 0.7}"
        font-family="Helvetica, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${branding.primaryColor}"
      >${merchantName}</text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

/**
 * Fetches and processes a logo image from URL
 * Handles SVG with high density for crisp rendering
 */
async function fetchAndProcessLogo(
  logoUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<Buffer> {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status}`);
    }

    const logoBuffer = Buffer.from(await response.arrayBuffer());
    const isSvg = logoUrl.toLowerCase().endsWith('.svg');

    // For SVG, render at high density for crisp output
    const sharpInstance = isSvg
      ? sharp(logoBuffer, { density: 300 })
      : sharp(logoBuffer);

    // Resize to fit within bounds while maintaining aspect ratio
    return sharpInstance
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: false, // Allow enlargement for small SVGs
        kernel: 'lanczos3', // High quality resampling
      })
      .png({ quality: 100 })
      .toBuffer();
  } catch (err) {
    console.error('[PassKit] Failed to fetch logo:', logoUrl, err);
    // Return a placeholder if logo fetch fails
    const svg = `
      <svg width="${maxWidth}" height="${maxHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${maxWidth}" height="${maxHeight}" fill="transparent" />
      </svg>
    `;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

/**
 * Generates a strip image showing stamp progress (matches web card styling)
 * Uses 2 rows for better visibility, stamps spread across full width
 */
async function generateStripImage(
  branding: Branding,
  stampCount: number,
  rewardGoal: number,
  width: number,
  height: number,
  logoBuffer?: Buffer
): Promise<Buffer> {
  const { stamp, labelColor } = branding;

  // Layout: 2 rows with stamps spread evenly across full width
  const cols = Math.ceil(rewardGoal / 2);
  const rows = rewardGoal > cols ? 2 : 1;

  // Safe area margins - Apple Wallet crops edges on phone display
  // Use ~18% margin on each side to keep stamps in visible center area
  const safeMarginX = Math.round(width * 0.18);
  const paddingY = Math.round(height * 0.02);

  // Calculate stamp size based on height (limiting factor)
  // Each row gets half the height minus padding
  const rowHeight = (height - paddingY * 2) / rows;
  const stampSize = Math.floor(rowHeight * 0.95); // 95% of row height

  // Calculate horizontal spacing within safe area
  const safeWidth = width - (safeMarginX * 2);
  const totalStampWidth = stampSize * cols;
  const remainingWidth = safeWidth - totalStampWidth;
  const gapX = cols > 1 ? Math.floor(remainingWidth / (cols - 1)) : 0;
  const gapY = rows > 1 ? Math.floor((height - paddingY * 2 - stampSize * rows) / (rows - 1)) : 0;

  // Start positions - within safe area
  const startX = safeMarginX;
  const startY = paddingY;

  // If using logo stamps and we have a logo, composite logo images
  if (stamp.shape === 'logo' && logoBuffer) {
    // Resize logo to stamp size with high quality
    const logoResized = await sharp(logoBuffer, { density: 300 })
      .resize(stampSize, stampSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: 'lanczos3',
      })
      .png()
      .toBuffer();

    // Create faded version for empty stamps using proper opacity
    // Convert to raw RGBA, reduce alpha channel, then back to PNG
    const { data: rgbaData, info } = await sharp(logoResized)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create faded RGBA data (reduce alpha to ~15%)
    const fadedData = Buffer.from(rgbaData);
    for (let i = 3; i < fadedData.length; i += 4) {
      // Reduce alpha and desaturate by averaging RGB
      const r = fadedData[i - 3];
      const g = fadedData[i - 2];
      const b = fadedData[i - 1];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      fadedData[i - 3] = gray;
      fadedData[i - 2] = gray;
      fadedData[i - 1] = gray;
      fadedData[i] = Math.round(fadedData[i] * 0.15); // 15% opacity
    }

    const logoFaded = await sharp(fadedData, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();

    // Create composites for each stamp position
    const composites: Array<{ input: Buffer; left: number; top: number }> = [];
    const numberFontSize = Math.round(stampSize * 0.15);

    for (let i = 0; i < rewardGoal; i++) {
      const filled = i < stampCount;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * (stampSize + gapX);
      const y = startY + row * (stampSize + gapY);

      composites.push({
        input: filled ? logoResized : logoFaded,
        left: x,
        top: y,
      });
    }

    // Create SVG with number labels for each stamp
    let numbersSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    for (let i = 0; i < rewardGoal; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * (stampSize + gapX);
      const y = startY + row * (stampSize + gapY);
      numbersSvg += `
        <text
          x="${x + 3}"
          y="${y + numberFontSize + 2}"
          font-family="DM Sans, sans-serif"
          font-size="${numberFontSize}"
          font-weight="500"
          fill="${labelColor}"
          opacity="0.6"
        >${i + 1}</text>
      `;
    }
    numbersSvg += '</svg>';
    const numbersBuffer = await sharp(Buffer.from(numbersSvg)).png().toBuffer();

    // Create transparent base and composite all stamps + numbers
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([...composites, { input: numbersBuffer, left: 0, top: 0 }])
      .png({ quality: 100 })
      .toBuffer();
  }

  // For circle/square stamps, use SVG with 2-row grid layout
  let stamps = '';
  const numberFontSize = Math.round(stampSize * 0.15);

  for (let i = 0; i < rewardGoal; i++) {
    const filled = i < stampCount;
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * (stampSize + gapX);
    const y = startY + row * (stampSize + gapY);
    const fillColor = filled ? stamp.filledColor : stamp.emptyColor;
    const cx = x + stampSize / 2;
    const cy = y + stampSize / 2;

    if (stamp.shape === 'circle') {
      stamps += `
        <circle
          cx="${cx}"
          cy="${cy}"
          r="${stampSize / 2 - 2}"
          fill="${fillColor}"
          stroke="${stamp.outlineColor}"
          stroke-width="2"
        />
      `;
    } else {
      stamps += `
        <rect
          x="${x}"
          y="${y}"
          width="${stampSize}"
          height="${stampSize}"
          rx="4"
          fill="${fillColor}"
          stroke="${stamp.outlineColor}"
          stroke-width="2"
        />
      `;
    }

    // Add stamp number in top-left corner
    stamps += `
      <text
        x="${x + 4}"
        y="${y + numberFontSize + 2}"
        font-family="DM Sans, sans-serif"
        font-size="${numberFontSize}"
        font-weight="500"
        fill="${labelColor}"
        opacity="0.6"
      >${i + 1}</text>
    `;

    // Add checkmark for filled stamps
    if (filled) {
      const checkSize = stampSize * 0.4;
      const checkX = cx - checkSize / 2;
      const checkY = cy - checkSize / 2;
      stamps += `
        <svg x="${checkX}" y="${checkY}" width="${checkSize}" height="${checkSize}" viewBox="0 0 24 24">
          <path
            fill="${labelColor}"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          />
        </svg>
      `;
    }
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${stamps}
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Builds a complete .pkpass bundle
 * @param input - Pass data including merchant, member, and branding
 * @param config - PassKit configuration including certificates
 * @returns Buffer containing the .pkpass file
 */
export async function buildPassBundle(
  input: PassInput,
  config: PassBuilderConfig
): Promise<Buffer> {
  const { merchant, member, branding } = input;
  const zip = new JSZip();

  // Create pass.json
  const passJson = createPassJson(input, config);
  const passJsonString = JSON.stringify(passJson, null, 2);
  zip.file('pass.json', passJsonString);

  // Generate icons at different sizes
  const icon1x = await generateIcon(branding, 29);
  const icon2x = await generateIcon(branding, 58);
  const icon3x = await generateIcon(branding, 87);

  zip.file('icon.png', icon1x);
  zip.file('icon@2x.png', icon2x);
  zip.file('icon@3x.png', icon3x);

  // Fetch header logo - ONLY use headerLogoUrl (not stamp logo)
  // If no headerLogoUrl, generate text-based logo (Apple requires logo.png)
  let headerLogo1x: Buffer;
  let headerLogo2x: Buffer;
  if (branding.headerLogoUrl) {
    headerLogo1x = await fetchAndProcessLogo(branding.headerLogoUrl, 160, 50);
    headerLogo2x = await fetchAndProcessLogo(branding.headerLogoUrl, 320, 100);
  } else {
    // Generate text-based logo as fallback (required by Apple)
    headerLogo1x = await generateTextLogo(merchant.name, branding, 160, 50);
    headerLogo2x = await generateTextLogo(merchant.name, branding, 320, 100);
  }

  zip.file('logo.png', headerLogo1x);
  zip.file('logo@2x.png', headerLogo2x);

  // Fetch logo buffer for stamp images (if using logo stamps)
  // Pre-render SVGs at high quality for stamp use
  let logoBuffer: Buffer | undefined;
  if (branding.stamp.shape === 'logo' && branding.logoUrl) {
    try {
      const response = await fetch(branding.logoUrl);
      if (response.ok) {
        const rawBuffer = Buffer.from(await response.arrayBuffer());
        const isSvg = branding.logoUrl.toLowerCase().endsWith('.svg');

        // For SVG, pre-render at high density for crisp stamps
        if (isSvg) {
          logoBuffer = await sharp(rawBuffer, { density: 300 })
            .png()
            .toBuffer();
        } else {
          logoBuffer = rawBuffer;
        }
      }
    } catch (err) {
      console.error('[PassKit] Failed to fetch stamp logo:', err);
      // Will fall back to circle stamps if logo fetch fails
    }
  }

  // Generate strip image showing stamp progress
  const strip1x = await generateStripImage(
    branding,
    member.stampCount,
    merchant.rewardGoal,
    312,
    84,
    logoBuffer
  );
  const strip2x = await generateStripImage(
    branding,
    member.stampCount,
    merchant.rewardGoal,
    624,
    168,
    logoBuffer
  );
  const strip3x = await generateStripImage(
    branding,
    member.stampCount,
    merchant.rewardGoal,
    936,
    252,
    logoBuffer
  );

  zip.file('strip.png', strip1x);
  zip.file('strip@2x.png', strip2x);
  zip.file('strip@3x.png', strip3x);

  // Create manifest.json with SHA1 hashes
  const manifest: Record<string, string> = {};

  manifest['pass.json'] = sha1Hash(passJsonString);
  manifest['icon.png'] = sha1Hash(icon1x);
  manifest['icon@2x.png'] = sha1Hash(icon2x);
  manifest['icon@3x.png'] = sha1Hash(icon3x);
  manifest['strip.png'] = sha1Hash(strip1x);
  manifest['strip@2x.png'] = sha1Hash(strip2x);
  manifest['strip@3x.png'] = sha1Hash(strip3x);

  // Always include logo hashes (we always generate a logo now)
  manifest['logo.png'] = sha1Hash(headerLogo1x);
  manifest['logo@2x.png'] = sha1Hash(headerLogo2x);

  const manifestString = JSON.stringify(manifest);
  zip.file('manifest.json', manifestString);

  // Sign the manifest
  const signature = signManifest(manifestString, config.signerConfig);
  zip.file('signature', signature);

  // Generate the .pkpass file (which is a ZIP archive)
  const pkpassBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return pkpassBuffer;
}

/**
 * Creates just the pass.json content (useful for pass updates)
 */
export function createPassJsonContent(
  input: PassInput,
  config: PassBuilderConfig
): string {
  const passJson = createPassJson(input, config);
  return JSON.stringify(passJson, null, 2);
}
