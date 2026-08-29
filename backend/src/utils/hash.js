// ============================================================
// CaseGrid — SHA-256 Hashing Utility
// Used to compute file hashes for the integrity chain
// ============================================================

import crypto from 'crypto';

/**
 * Compute SHA-256 hash of a buffer.
 * @param {Buffer} buffer - The data to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compute SHA-256 hash of a string (used for block hashing).
 * @param {string} data - The string to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function sha256String(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}
