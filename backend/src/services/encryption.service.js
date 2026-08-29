// ============================================================
// CaseGrid — AES-256-CBC Encryption Service
// Encrypts/decrypts document files before storing in MinIO
// ============================================================

import crypto from 'crypto';
import env from '../config/env.js';

// AES-256-CBC requires a 32-byte key (our ENCRYPTION_KEY is 64 hex chars = 32 bytes)
const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex'); // 32 bytes

/**
 * Encrypt a file buffer using AES-256-CBC.
 * Generates a random 16-byte IV for each encryption (stored alongside the document metadata).
 *
 * @param {Buffer} buffer - The plaintext file buffer
 * @returns {{ encrypted: Buffer, iv: string }} Encrypted buffer + hex-encoded IV
 */
export function encryptFile(buffer) {
  // Generate a fresh random IV for each file (critical for security)
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return {
    encrypted,
    iv: iv.toString('hex'), // Store IV as hex string in the database
  };
}

/**
 * Decrypt an encrypted file buffer using AES-256-CBC.
 *
 * @param {Buffer} encryptedBuffer - The encrypted file buffer (from MinIO)
 * @param {string} ivHex - The hex-encoded IV used during encryption
 * @returns {Buffer} The decrypted (original) file buffer
 */
export function decryptFile(encryptedBuffer, ivHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}
