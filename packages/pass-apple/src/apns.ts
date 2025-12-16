import * as https from 'https';
import * as http2 from 'http2';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface APNsConfig {
  keyPath: string;
  keyId: string;
  teamId: string;
  production?: boolean;
}

interface APNsJWTHeader {
  alg: string;
  kid: string;
}

interface APNsJWTPayload {
  iss: string;
  iat: number;
}

// APNs endpoints
const APNS_HOST_PRODUCTION = 'api.push.apple.com';
const APNS_HOST_SANDBOX = 'api.sandbox.push.apple.com';

// JWT token cache (tokens are valid for up to 1 hour, we refresh at 50 minutes)
let cachedToken: { token: string; expires: number } | null = null;

/**
 * Base64 URL encode (no padding, URL-safe characters)
 */
function base64UrlEncode(data: string | Buffer): string {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate a JWT token for APNs authentication
 */
function generateAPNsToken(config: APNsConfig): string {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid (with 10-minute buffer)
  if (cachedToken && cachedToken.expires > now + 600) {
    return cachedToken.token;
  }

  // Read the .p8 private key
  const privateKey = fs.readFileSync(config.keyPath, 'utf8');

  // Create JWT header
  const header: APNsJWTHeader = {
    alg: 'ES256',
    kid: config.keyId,
  };

  // Create JWT payload
  const payload: APNsJWTPayload = {
    iss: config.teamId,
    iat: now,
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const sign = crypto.createSign('SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(privateKey);

  // Convert DER signature to raw format for JWT
  // ES256 signatures from Node.js are in DER format, need to convert to raw
  const rawSignature = derToRaw(signature);
  const encodedSignature = base64UrlEncode(rawSignature);

  const token = `${signatureInput}.${encodedSignature}`;

  // Cache token (valid for ~50 minutes)
  cachedToken = {
    token,
    expires: now + 3000, // 50 minutes
  };

  return token;
}

/**
 * Convert DER-encoded ECDSA signature to raw format
 */
function derToRaw(derSignature: Buffer): Buffer {
  // DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  let offset = 2; // Skip 0x30 and total length

  // Read r
  if (derSignature[offset] !== 0x02) {
    throw new Error('Invalid DER signature: expected 0x02 for r');
  }
  offset++;
  const rLength = derSignature[offset];
  offset++;
  let r = derSignature.subarray(offset, offset + rLength);
  offset += rLength;

  // Read s
  if (derSignature[offset] !== 0x02) {
    throw new Error('Invalid DER signature: expected 0x02 for s');
  }
  offset++;
  const sLength = derSignature[offset];
  offset++;
  let s = derSignature.subarray(offset, offset + sLength);

  // Remove leading zeros if present (DER encoding adds them for positive numbers)
  if (r.length === 33 && r[0] === 0) {
    r = r.subarray(1);
  }
  if (s.length === 33 && s[0] === 0) {
    s = s.subarray(1);
  }

  // Pad to 32 bytes if needed
  const rPadded = Buffer.alloc(32);
  const sPadded = Buffer.alloc(32);
  r.copy(rPadded, 32 - r.length);
  s.copy(sPadded, 32 - s.length);

  return Buffer.concat([rPadded, sPadded]);
}

/**
 * Send a push notification to APNs to trigger a pass update
 * @param pushToken - The device's push token for PassKit
 * @param passTypeId - The pass type identifier
 * @param config - APNs configuration
 */
export async function sendPassUpdate(
  pushToken: string,
  passTypeId: string,
  config: APNsConfig
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const host = config.production ? APNS_HOST_PRODUCTION : APNS_HOST_SANDBOX;
    const token = generateAPNsToken(config);

    // Create HTTP/2 client
    const client = http2.connect(`https://${host}`);

    client.on('error', (err) => {
      console.error('[APNs] Connection error:', err);
      resolve({ success: false, error: err.message });
    });

    // APNs push for PassKit sends an empty payload
    const payload = JSON.stringify({});

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      'authorization': `bearer ${token}`,
      'apns-topic': passTypeId,
      'apns-push-type': 'background',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload),
    });

    let responseData = '';

    req.on('response', (headers) => {
      const status = headers[':status'];

      if (status === 200) {
        resolve({ success: true });
      } else {
        req.on('data', (chunk) => {
          responseData += chunk;
        });

        req.on('end', () => {
          let errorMessage = `APNs returned status ${status}`;
          try {
            const errorBody = JSON.parse(responseData);
            errorMessage = errorBody.reason || errorMessage;
          } catch {
            // Ignore JSON parse errors
          }
          console.error('[APNs] Push failed:', errorMessage);
          resolve({ success: false, error: errorMessage });
        });
      }
    });

    req.on('error', (err) => {
      console.error('[APNs] Request error:', err);
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();

    // Close the client after response
    req.on('close', () => {
      client.close();
    });
  });
}

/**
 * Send push updates to all registered devices for a member
 * @param memberId - The member whose pass should be updated
 * @param passTypeId - The pass type identifier
 * @param config - APNs configuration
 * @param getRegistrations - Function to fetch device registrations from database
 */
export async function sendPassUpdateToAllDevices(
  memberId: string,
  passTypeId: string,
  config: APNsConfig,
  getRegistrations: () => Promise<Array<{ push_token: string }>>
): Promise<{ sent: number; failed: number }> {
  const registrations = await getRegistrations();
  let sent = 0;
  let failed = 0;

  for (const reg of registrations) {
    const result = await sendPassUpdate(reg.push_token, passTypeId, config);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
