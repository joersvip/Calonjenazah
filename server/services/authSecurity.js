const crypto = require('crypto');

const HASH_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

// Derive or load JWT session signing secret
function getSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }
  // Fallback to consistent HMAC key based on default seeds if not specified
  return crypto.createHash('sha256').update(process.env.ADMIN_DEFAULT_USER || 'calonjenazah_secure_salt_2026').digest('hex');
}

/**
 * Hash a plain password using PBKDF2 with a cryptographic salt.
 * Result format: `pbkdf2$<iterations>$<saltHex>$<hashHex>`
 *
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST);
  return `pbkdf2$${HASH_ITERATIONS}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Safely verify a password against stored value.
 * Supports:
 * 1. PBKDF2 hash (`pbkdf2$<iterations>$<salt>$<hash>`) using timing-safe comparison.
 * 2. Legacy plaintext string fallback with `needsRehash: true` flag to allow seamless auto-migration.
 *
 * @param {string} password
 * @param {string} storedHash
 * @returns {{ verified: boolean, needsRehash: boolean }}
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return { verified: false, needsRehash: false };
  }

  if (typeof storedHash === 'string' && storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) {
      return { verified: false, needsRehash: false };
    }
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const hashHex = parts[3];

    try {
      const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
      const storedBuf = Buffer.from(hashHex, 'hex');
      if (derivedKey.length !== storedBuf.length) {
        return { verified: false, needsRehash: false };
      }
      const match = crypto.timingSafeEqual(derivedKey, storedBuf);
      return { verified: match, needsRehash: iterations < HASH_ITERATIONS };
    } catch (e) {
      return { verified: false, needsRehash: false };
    }
  }

  // Legacy plaintext check (for backward compatibility before hashing)
  if (storedHash === password) {
    return { verified: true, needsRehash: true };
  }

  return { verified: false, needsRehash: false };
}

/**
 * Generate a cryptographically signed HMAC-SHA256 session token.
 * Token format: `cj_sec_<base64UrlPayload>.<base64UrlHmacSignature>`
 *
 * @param {object} user
 * @returns {string}
 */
function generateSecureToken(user) {
  const secret = getSessionSecret();
  const payload = {
    uid: user.id,
    u: user.username,
    r: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days validity
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `cj_sec_${payloadB64}.${signature}`;
}

/**
 * Verify HMAC signature and expiration of a session token.
 *
 * @param {string} token
 * @returns {object|null} payload if valid, null otherwise
 */
function verifySecureToken(token) {
  if (!token || typeof token !== 'string') return null;

  if (token.startsWith('cj_sec_')) {
    const raw = token.slice('cj_sec_'.length);
    const [payloadB64, signature] = raw.split('.');
    if (!payloadB64 || !signature) return null;

    const secret = getSessionSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    if (signature.length !== expectedSig.length) return null;

    const match = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
    if (!match) return null;

    try {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return payload;
    } catch (e) {
      return null;
    }
  }

  // Gracefully handle legacy unverified token if needed for immediate transition
  if (token.startsWith('auth_token_')) {
    try {
      const decoded = Buffer.from(token.replace('auth_token_', ''), 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length >= 2) {
        return { u: parts[0], uid: parts[1], legacy: true };
      }
    } catch (e) {}
  }

  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  verifySecureToken
};
