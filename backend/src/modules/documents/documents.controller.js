// ============================================================
// CaseGrid — Documents Controller
// Handles the full document lifecycle:
//   Upload → Encrypt → Store → Chain → Audit
//   List → Get → Download → Verify
// ============================================================

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { sha256 } from '../../utils/hash.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { encryptFile, decryptFile } from '../../services/encryption.service.js';
import { uploadFile, downloadFile } from '../../services/storage.service.js';
import { getIntegrityService } from '../../services/integrity/index.js';
import { writeAuditLog } from '../../services/audit.service.js';

const prisma = new PrismaClient();

/**
 * POST /api/documents/upload
 * Full upload pipeline:
 *   1. Hash the original file (SHA-256)
 *   2. Encrypt the file (AES-256-CBC)
 *   3. Upload encrypted file to MinIO
 *   4. Add block to integrity chain
 *   5. Save metadata to PostgreSQL
 *   6. Write audit log
 */
export async function uploadDocument(req, res, next) {
  try {
    // ── Validate input ────────────────────────────────────
    if (!req.file) {
      return sendError(res, 'No file provided. Upload a file with field name "file".', 400);
    }

    const { caseId, docType, title, description } = req.body;

    if (!caseId || !docType || !title) {
      return sendError(res, 'caseId, docType, and title are required', 400);
    }

    // Validate docType against allowed values
    const validDocTypes = ['FIR', 'CHARGE_SHEET', 'WITNESS_STATEMENT', 'FORENSIC_REPORT', 'COURT_FILING', 'OTHER'];
    if (!validDocTypes.includes(docType)) {
      return sendError(res, `Invalid docType. Allowed: ${validDocTypes.join(', ')}`, 400);
    }

    const fileBuffer = req.file.buffer;     // Raw file bytes (from multer memoryStorage)
    const docId = uuidv4();                  // Generate document ID upfront

    // ── Step 1: Hash the original (unencrypted) file ──────
    const fileHash = sha256(fileBuffer);

    // ── Step 1.5: Officer Digital Signature Simulation ────
    const crypto = await import('crypto');
    const digitalSignature = crypto.default
      .createHmac('sha256', process.env.JWT_SECRET || 'casegrid-jwt-super-secret')
      .update(`${fileHash}:${req.user.id}:${req.user.email}:${Date.now()}`)
      .digest('hex');

    // ── Step 2: Encrypt the file ──────────────────────────
    const { encrypted, iv } = encryptFile(fileBuffer);

    // ── Step 3: Upload encrypted file to MinIO ────────────
    const minioKey = `documents/${docId}/${req.file.originalname}.enc`;
    await uploadFile(minioKey, encrypted, req.file.mimetype);

    // ── Step 4: Add block to integrity chain ──────────────
    const integrity = getIntegrityService();
    const block = await integrity.addBlock({
      docId,
      fileHash,
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'UPLOAD',
      metadata: { 
        caseId, 
        docType, 
        title, 
        digitalSignature: `SIG-SHA256-${digitalSignature.substring(0, 16).toUpperCase()}`,
        signedBy: req.user.name,
        badgeNumber: req.user.badgeNumber || 'OFFICER-REG'
      },
    });

    // ── Step 5: Save document metadata to PostgreSQL ──────
    const document = await prisma.document.create({
      data: {
        id: docId,
        caseId,
        docType,
        title,
        description: description || null,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        minioKey,
        encryptionIV: iv,
        uploadedById: req.user.id,
        chainBlockId: block.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        chainBlock: true,
      },
    });

    // ── Step 6: Audit log ─────────────────────────────────
    await writeAuditLog({
      actorId: req.user.id,
      action: 'UPLOAD',
      resourceType: 'DOCUMENT',
      resourceId: docId,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { caseId, docType, fileHash, blockIndex: block.blockIndex },
    });

    return sendSuccess(res, { document }, 'Document uploaded and integrity chain updated', 201);

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/documents
 * List all documents. Supports optional filtering by caseId and docType.
 */
export async function listDocuments(req, res, next) {
  try {
    const { caseId, docType, page = 1, limit = 20 } = req.query;

    const where = {};
    if (caseId) where.caseId = caseId;
    if (docType) where.docType = docType;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          chainBlock: {
            select: { blockIndex: true, fileHash: true, blockHash: true, timestamp: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return sendSuccess(res, {
      documents,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    }, 'Documents retrieved');

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/documents/:id
 * Get a single document's metadata + chain block info.
 */
export async function getDocument(req, res, next) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        chainBlock: true,
      },
    });

    if (!document) {
      return sendError(res, 'Document not found', 404);
    }

    // Audit: View
    await writeAuditLog({
      actorId: req.user.id,
      action: 'VIEW',
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
    });

    return sendSuccess(res, { document }, 'Document retrieved');

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/documents/:id/download
 * Download the document: fetch from MinIO, decrypt, verify hash, stream to client.
 */
export async function downloadDocument(req, res, next) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { chainBlock: true },
    });

    if (!document) {
      return sendError(res, 'Document not found', 404);
    }

    // Fetch encrypted file from MinIO
    const encryptedBuffer = await downloadFile(document.minioKey);

    // Decrypt the file
    const decryptedBuffer = decryptFile(encryptedBuffer, document.encryptionIV);

    // Verify hash against chain
    const currentHash = sha256(decryptedBuffer);
    const chainHash = document.chainBlock?.fileHash;
    const verified = currentHash === chainHash;

    // Audit: Download
    await writeAuditLog({
      actorId: req.user.id,
      action: 'DOWNLOAD',
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      result: verified ? 'HASH_MATCH' : 'HASH_MISMATCH',
      ipAddress: req.ip,
      details: { verified, currentHash, chainHash },
    });

    // Set response headers for file download
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('X-CaseGrid-Verified', verified ? 'true' : 'false');
    res.setHeader('X-CaseGrid-Status', verified ? 'UNTAMPERED' : 'HASH_MISMATCH');
    res.setHeader('X-CaseGrid-FileHash', currentHash);
    res.setHeader('X-CaseGrid-ChainHash', chainHash || 'N/A');

    return res.send(decryptedBuffer);

  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/documents/:id/verify
 * Verify document integrity WITHOUT downloading.
 * Re-fetches from MinIO, decrypts, re-hashes, compares to chain.
 */
export async function verifyDocument(req, res, next) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { chainBlock: true },
    });

    if (!document) {
      return sendError(res, 'Document not found', 404);
    }

    if (!document.chainBlock) {
      return sendError(res, 'No integrity chain block found for this document', 404);
    }

    // Fetch encrypted file from MinIO
    const encryptedBuffer = await downloadFile(document.minioKey);

    // Decrypt the file
    const decryptedBuffer = decryptFile(encryptedBuffer, document.encryptionIV);

    // Compute current hash
    const currentHash = sha256(decryptedBuffer);

    // Verify against chain
    const integrity = getIntegrityService();
    const verification = await integrity.verifyDocument(document.id, currentHash);

    // Also validate the full chain
    const chainStatus = await integrity.verifyChain();

    // Audit: Verify
    await writeAuditLog({
      actorId: req.user.id,
      action: verification.verified ? 'VERIFY' : 'VERIFY_FAIL',
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      result: verification.verified ? 'HASH_MATCH' : 'HASH_MISMATCH',
      ipAddress: req.ip,
      details: {
        fileHash: currentHash,
        chainHash: verification.chainHash,
        blockIndex: verification.blockIndex,
        chainValid: chainStatus.valid,
      },
    });

    return sendSuccess(res, {
      verification: {
        verified: verification.verified,
        status: verification.status,
        fileHash: currentHash,
        chainHash: verification.chainHash,
        blockIndex: verification.blockIndex,
        blockIntact: verification.blockIntact,
        chainValid: chainStatus.valid,
        chainBlockCount: chainStatus.blockCount,
      },
    }, verification.verified
      ? '✅ Verified — Document is UNTAMPERED'
      : '⚠️ WARNING — Document integrity check FAILED'
    );

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/documents/cases/timeline
 * Get all cases grouped by caseId with full chronological document & block history.
 */
export async function listCasesWithTimeline(req, res, next) {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true, badgeNumber: true },
        },
        chainBlock: true,
      },
    });

    // Group documents by caseId
    const casesMap = {};
    for (const doc of documents) {
      if (!casesMap[doc.caseId]) {
        casesMap[doc.caseId] = {
          caseId: doc.caseId,
          createdAt: doc.createdAt,
          documents: [],
        };
      }
      casesMap[doc.caseId].documents.push(doc);
    }

    const cases = Object.values(casesMap).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return sendSuccess(res, { cases }, 'Case timelines retrieved');
  } catch (error) {
    next(error);
  }
}

