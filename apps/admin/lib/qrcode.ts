import QRCode from 'qrcode';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(
  url: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    size = 512,
    margin = 2,
    errorCorrectionLevel = 'M'
  } = options;

  return QRCode.toDataURL(url, {
    width: size,
    margin,
    errorCorrectionLevel,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

/**
 * Generate QR code as Buffer (PNG)
 */
export async function generateQRCodeBuffer(
  url: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const {
    size = 512,
    margin = 2,
    errorCorrectionLevel = 'M'
  } = options;

  return QRCode.toBuffer(url, {
    width: size,
    margin,
    errorCorrectionLevel,
    type: 'png',
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

/**
 * Generate Join QR code
 */
export async function generateJoinQR(
  baseUrl: string,
  merchantSlug: string,
  options?: QRCodeOptions
): Promise<string> {
  const url = `${baseUrl}/join/${merchantSlug}`;
  return generateQRCode(url, options);
}

/**
 * Generate Stamp QR code (placeholder - actual memberId added later)
 */
export async function generateStampQR(
  baseUrl: string,
  options?: QRCodeOptions
): Promise<string> {
  // For now, just generate a placeholder
  // In practice, each member gets their own stamp QR
  const url = `${baseUrl}/stamp/[member-id]`;
  return generateQRCode(url, options);
}
