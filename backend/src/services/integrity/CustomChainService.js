// ============================================================
// CaseGrid — CustomChainService
// PostgreSQL-backed blockchain implementation
//
// Each block contains:
//   blockIndex, timestamp, docId, fileHash, actorId, actorEmail,
//   action, metadata, previousHash, blockHash
//
// blockHash = SHA-256(blockIndex + timestamp + docId + fileHash
//             + actorId + action + previousHash)
//
// Genesis block (index 0) has docId="GENESIS", fileHash="0",
// previousHash="0"
// ============================================================

import { PrismaClient } from '@prisma/client';
import { IntegrityService } from './IntegrityService.js';
import { sha256String } from '../../utils/hash.js';

const prisma = new PrismaClient();

export class CustomChainService extends IntegrityService {
  /**
   * Compute the hash of a block from its constituent fields.
   * This is the core of the chain's tamper-evidence:
   * changing any field changes the hash, breaking the chain.
   */
  _computeBlockHash({ blockIndex, timestamp, docId, fileHash, actorId, action, previousHash }) {
    const data = `${blockIndex}${timestamp}${docId}${fileHash}${actorId}${action}${previousHash}`;
    return sha256String(data);
  }

  /**
   * Create the genesis block if the chain is empty.
   * Called once on server startup.
   */
  async ensureGenesis() {
    const count = await prisma.chainBlock.count();
    if (count > 0) {
      console.log('  ⛓️  Integrity chain exists (${count} blocks)');
      return;
    }

    const timestamp = new Date().toISOString();
    const genesisData = {
      blockIndex: 0,
      timestamp,
      docId: 'GENESIS',
      fileHash: '0',
      actorId: 'SYSTEM',
      actorEmail: 'system@casegrid.gov.in',
      action: 'GENESIS',
      previousHash: '0',
    };

    const blockHash = this._computeBlockHash(genesisData);

    await prisma.chainBlock.create({
      data: {
        ...genesisData,
        blockHash,
        metadata: { info: 'Genesis block — CaseGrid integrity chain initialized' },
      },
    });

    console.log('  ⛓️  Genesis block created (chain initialized)');
  }

  /**
   * Add a new block to the chain for a document action.
   */
  async addBlock({ docId, fileHash, actorId, actorEmail, action, metadata = null }) {
    // Get the last block to link from
    const lastBlock = await prisma.chainBlock.findFirst({
      orderBy: { blockIndex: 'desc' },
    });

    if (!lastBlock) {
      throw new Error('Chain not initialized — genesis block missing');
    }

    const newIndex = lastBlock.blockIndex + 1;
    const timestamp = new Date().toISOString();

    const blockData = {
      blockIndex: newIndex,
      timestamp,
      docId,
      fileHash,
      actorId,
      actorEmail,
      action,
      previousHash: lastBlock.blockHash,
    };

    const blockHash = this._computeBlockHash(blockData);

    const block = await prisma.chainBlock.create({
      data: {
        ...blockData,
        blockHash,
        metadata,
      },
    });

    console.log(`  ⛓️  Block #${newIndex} added: ${action} by ${actorEmail} for doc ${docId}`);
    return block;
  }

  /**
   * Verify a document's current file hash against what's stored in the chain.
   */
  async verifyDocument(docId, currentFileHash) {
    const block = await prisma.chainBlock.findFirst({
      where: { docId },
      orderBy: { blockIndex: 'desc' }, // Get the latest block for this doc
    });

    if (!block) {
      return {
        verified: false,
        status: 'BLOCK_NOT_FOUND',
        block: null,
      };
    }

    // Compare the current file hash with what was recorded at upload time
    const hashMatch = currentFileHash === block.fileHash;

    // Also verify the block's own integrity (re-compute its hash)
    const recomputedHash = this._computeBlockHash({
      blockIndex: block.blockIndex,
      timestamp: block.timestamp.toISOString(),
      docId: block.docId,
      fileHash: block.fileHash,
      actorId: block.actorId,
      action: block.action,
      previousHash: block.previousHash,
    });
    const blockIntact = recomputedHash === block.blockHash;

    return {
      verified: hashMatch && blockIntact,
      status: !hashMatch ? 'HASH_MISMATCH' : !blockIntact ? 'BLOCK_TAMPERED' : 'UNTAMPERED',
      fileHash: currentFileHash,
      chainHash: block.fileHash,
      blockIndex: block.blockIndex,
      blockIntact,
      block,
    };
  }

  /**
   * Validate the entire chain — walk from genesis to tip,
   * verify each block's hash and its link to the previous block.
   */
  async verifyChain() {
    const blocks = await prisma.chainBlock.findMany({
      orderBy: { blockIndex: 'asc' },
    });

    if (blocks.length === 0) {
      return { valid: false, blockCount: 0, errors: ['Chain is empty'] };
    }

    const errors = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Verify block's own hash
      const recomputedHash = this._computeBlockHash({
        blockIndex: block.blockIndex,
        timestamp: block.timestamp.toISOString(),
        docId: block.docId,
        fileHash: block.fileHash,
        actorId: block.actorId,
        action: block.action,
        previousHash: block.previousHash,
      });

      if (recomputedHash !== block.blockHash) {
        errors.push(`Block #${block.blockIndex}: hash mismatch (tampered)`);
      }

      // Verify linkage to previous block (skip genesis)
      if (i > 0) {
        const prevBlock = blocks[i - 1];
        if (block.previousHash !== prevBlock.blockHash) {
          errors.push(`Block #${block.blockIndex}: previousHash doesn't match block #${prevBlock.blockIndex}`);
        }
      } else {
        // Genesis block should have previousHash = "0"
        if (block.previousHash !== '0') {
          errors.push('Genesis block: previousHash should be "0"');
        }
      }
    }

    return {
      valid: errors.length === 0,
      blockCount: blocks.length,
      errors,
    };
  }

  /**
   * Get the latest chain block for a specific document.
   */
  async getBlock(docId) {
    return prisma.chainBlock.findFirst({
      where: { docId },
      orderBy: { blockIndex: 'desc' },
    });
  }

  /**
   * Get the full chain in order.
   */
  async getChain() {
    return prisma.chainBlock.findMany({
      orderBy: { blockIndex: 'asc' },
    });
  }
}
