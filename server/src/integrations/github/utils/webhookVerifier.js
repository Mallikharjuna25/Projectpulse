import crypto from 'crypto';

/**
 * Verify GitHub webhook HMAC-SHA256 signature
 *
 * @param {string|Buffer} payload - Raw request body or stringified payload
 * @param {string} signatureHeader - Header value 'sha256=...'
 * @param {string} secret - Shared webhook secret
 * @returns {boolean}
 */
export const verifyGithubSignature = (payload, signatureHeader, secret) => {
  if (!secret) return true; // If no secret configured, accept in demo mode
  if (!signatureHeader) return false;

  try {
    const parts = signatureHeader.split('sha256=');
    if (parts.length !== 2) return false;
    const expectedSignature = parts[1];

    const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(stringPayload).digest('hex');

    const calcBuf = Buffer.from(calculatedSignature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');
    if (calcBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(calcBuf, expBuf);
  } catch {
    return false;
  }
};
