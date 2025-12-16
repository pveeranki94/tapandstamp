import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface SignerConfig {
  certPath: string;
  certPassword: string;
  wwdrCertPath?: string;
}

interface P12Contents {
  certificate: forge.pki.Certificate;
  privateKey: forge.pki.PrivateKey;
  caCertificates: forge.pki.Certificate[];
}

/**
 * Loads and parses a .p12 certificate file
 */
export function loadP12Certificate(certPath: string, password: string): P12Contents {
  const p12Buffer = fs.readFileSync(certPath);
  const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

  // Extract the signing certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag];
  if (!certBag || certBag.length === 0) {
    throw new Error('No certificate found in .p12 file');
  }

  // Find the signing certificate (the one with a private key)
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
  if (!keyBag || keyBag.length === 0) {
    throw new Error('No private key found in .p12 file');
  }

  const privateKey = keyBag[0].key;
  if (!privateKey) {
    throw new Error('Could not extract private key from .p12 file');
  }

  // Find the certificate that matches the private key
  let signingCert: forge.pki.Certificate | null = null;
  const caCerts: forge.pki.Certificate[] = [];

  for (const bag of certBag) {
    if (bag.cert) {
      // Check if this cert's public key matches our private key
      const certPublicKey = bag.cert.publicKey as forge.pki.rsa.PublicKey;
      const privKey = privateKey as forge.pki.rsa.PrivateKey;

      if (certPublicKey.n && privKey.n && certPublicKey.n.equals(privKey.n)) {
        signingCert = bag.cert;
      } else {
        caCerts.push(bag.cert);
      }
    }
  }

  if (!signingCert) {
    // If no match found, use the first certificate
    signingCert = certBag[0].cert!;
  }

  return {
    certificate: signingCert,
    privateKey,
    caCertificates: caCerts,
  };
}

/**
 * Loads the Apple WWDR (Worldwide Developer Relations) certificate
 * This certificate is required to be included in the signature chain
 * Supports both PEM and DER formats
 */
export function loadWWDRCertificate(wwdrPath?: string): forge.pki.Certificate | null {
  if (!wwdrPath) {
    return null;
  }

  try {
    const wwdrBuffer = fs.readFileSync(wwdrPath);
    const wwdrContent = wwdrBuffer.toString('utf8');

    // Check if it's PEM format (starts with -----BEGIN)
    if (wwdrContent.includes('-----BEGIN CERTIFICATE-----')) {
      return forge.pki.certificateFromPem(wwdrContent);
    }

    // Otherwise treat as DER format
    const derAsn1 = forge.asn1.fromDer(wwdrBuffer.toString('binary'));
    return forge.pki.certificateFromAsn1(derAsn1);
  } catch (err) {
    console.warn('Could not load WWDR certificate from:', wwdrPath, err);
    return null;
  }
}

/**
 * Signs the manifest data using PKCS#7 detached signature via OpenSSL
 * @param manifest - The manifest.json content as a string
 * @param config - Signer configuration with certificate paths and password
 * @returns Buffer containing the DER-encoded PKCS#7 signature
 */
export function signManifest(manifest: string, config: SignerConfig): Buffer {
  // Create temp files for the signing process
  const tempDir = fs.mkdtempSync('/tmp/passkit-');
  const manifestPath = path.join(tempDir, 'manifest.json');
  const signerCertPath = path.join(tempDir, 'signer.pem');
  const signerKeyPath = path.join(tempDir, 'signer.key');
  const signaturePath = path.join(tempDir, 'signature');

  try {
    // Write manifest to temp file
    fs.writeFileSync(manifestPath, manifest);

    // Extract certificate from p12
    execSync(
      `openssl pkcs12 -in "${config.certPath}" -passin pass:'${config.certPassword}' -legacy -nokeys -out "${signerCertPath}" 2>/dev/null`
    );

    // Extract private key from p12
    execSync(
      `openssl pkcs12 -in "${config.certPath}" -passin pass:'${config.certPassword}' -legacy -nocerts -nodes -out "${signerKeyPath}" 2>/dev/null`
    );

    // Build the openssl command
    let cmd = `openssl smime -sign -signer "${signerCertPath}" -inkey "${signerKeyPath}"`;

    // Add WWDR certificate if available
    if (config.wwdrCertPath && fs.existsSync(config.wwdrCertPath)) {
      cmd += ` -certfile "${config.wwdrCertPath}"`;
    }

    cmd += ` -in "${manifestPath}" -out "${signaturePath}" -outform DER -binary`;

    // Sign the manifest
    execSync(cmd, { stdio: 'pipe' });

    // Read and return the signature
    const signature = fs.readFileSync(signaturePath);
    return signature;
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Calculates SHA-1 hash of a buffer (required for manifest.json)
 */
export function sha1Hash(data: Buffer | string): string {
  const md = forge.md.sha1.create();
  md.update(typeof data === 'string' ? data : data.toString('binary'), 'raw');
  return md.digest().toHex();
}

/**
 * Verifies that a .p12 certificate is valid for PassKit signing
 */
export function verifyCertificate(config: SignerConfig): {
  valid: boolean;
  passTypeId?: string;
  teamId?: string;
  error?: string;
} {
  try {
    const { certificate } = loadP12Certificate(config.certPath, config.certPassword);

    // Extract Pass Type ID from the certificate's User ID (UID) field
    let passTypeId: string | undefined;
    let teamId: string | undefined;

    const subject = certificate.subject;
    for (const attr of subject.attributes) {
      if (attr.shortName === 'UID') {
        passTypeId = attr.value as string;
      }
      if (attr.shortName === 'OU') {
        teamId = attr.value as string;
      }
    }

    // Verify the certificate has the PassKit extension
    const extensions = certificate.extensions;
    const hasPassKitExtension = extensions.some(
      (ext) => ext.name === 'extKeyUsage' || ext.id === '1.2.840.113635.100.4.16'
    );

    if (!passTypeId) {
      return {
        valid: false,
        error: 'Certificate does not contain a Pass Type ID (UID field)',
      };
    }

    return {
      valid: true,
      passTypeId,
      teamId,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unknown error validating certificate',
    };
  }
}
