// ============================================================
// CaseGrid — MinIO Client Configuration
// Sets up the S3-compatible client and ensures the bucket exists
// ============================================================

import * as Minio from 'minio';
import env from './env.js';

/**
 * MinIO client instance — used by storage.service.js for all file operations.
 * Connection params come from environment config.
 */
const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

/**
 * Ensure the documents bucket exists on startup.
 * Creates it if missing — idempotent, safe to call multiple times.
 */
export async function ensureBucket() {
  const bucketName = env.MINIO_BUCKET;
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      console.log(`  📦 Created MinIO bucket: ${bucketName}`);
    } else {
      console.log(`  📦 MinIO bucket exists: ${bucketName}`);
    }
  } catch (error) {
    console.error(`❌ MinIO bucket setup failed:`, error.message);
    throw error;
  }
}

export default minioClient;
