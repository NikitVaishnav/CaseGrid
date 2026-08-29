// ============================================================
// CaseGrid — MinIO Storage Service
// Handles file upload, download, and deletion in MinIO
// ============================================================

import minioClient from '../config/minio.js';
import env from '../config/env.js';

const BUCKET = env.MINIO_BUCKET;

/**
 * Upload an encrypted file buffer to MinIO.
 *
 * @param {string} key - Object key (e.g. "documents/uuid/filename.enc")
 * @param {Buffer} buffer - The encrypted file buffer
 * @param {string} mimeType - Original MIME type (stored as metadata)
 * @returns {Promise<string>} The object key for retrieval
 */
export async function uploadFile(key, buffer, mimeType) {
  await minioClient.putObject(BUCKET, key, buffer, buffer.length, {
    'Content-Type': 'application/octet-stream', // Always octet-stream since it's encrypted
    'X-Original-Content-Type': mimeType,        // Preserve original type as custom metadata
  });
  return key;
}

/**
 * Download an encrypted file from MinIO as a Buffer.
 *
 * @param {string} key - Object key in the bucket
 * @returns {Promise<Buffer>} The encrypted file buffer
 */
export async function downloadFile(key) {
  const stream = await minioClient.getObject(BUCKET, key);

  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Delete a file from MinIO.
 *
 * @param {string} key - Object key to delete
 * @returns {Promise<void>}
 */
export async function deleteFile(key) {
  await minioClient.removeObject(BUCKET, key);
}
