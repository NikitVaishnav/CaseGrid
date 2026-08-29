// ============================================================
// CaseGrid — IntegrityService (Abstract Interface)
//
// This is the Fabric-ready abstraction layer. All controllers
// use this interface — swap implementations by changing
// INTEGRITY_PROVIDER in .env without touching any routes.
//
// Implementations:
//   - CustomChainService  (INTEGRITY_PROVIDER=custom)  — PostgreSQL-backed chain
//   - FabricService       (INTEGRITY_PROVIDER=fabric)  — Hyperledger Fabric (future)
// ============================================================

/**
 * Abstract integrity service interface.
 * Any implementation must provide these 5 methods.
 */
export class IntegrityService {
  /**
   * Add a new block to the integrity chain.
   * @param {object} params
   * @param {string} params.docId      - Document UUID
   * @param {string} params.fileHash   - SHA-256 hash of the original file
   * @param {string} params.actorId    - User UUID who performed the action
   * @param {string} params.actorEmail - Actor's email (for readability)
   * @param {string} params.action     - Action type: "UPLOAD" | "UPDATE" | "DELETE"
   * @param {object} [params.metadata] - Optional extra context
   * @returns {Promise<object>} The created block
   */
  async addBlock({ docId, fileHash, actorId, actorEmail, action, metadata }) {
    throw new Error('IntegrityService.addBlock() must be implemented');
  }

  /**
   * Verify a specific document's hash against the chain.
   * @param {string} docId - Document UUID
   * @param {string} currentFileHash - SHA-256 of the file as it exists now
   * @returns {Promise<{ verified: boolean, status: string, block: object }>}
   */
  async verifyDocument(docId, currentFileHash) {
    throw new Error('IntegrityService.verifyDocument() must be implemented');
  }

  /**
   * Validate the entire chain integrity (all blocks linked correctly).
   * @returns {Promise<{ valid: boolean, blockCount: number, errors: string[] }>}
   */
  async verifyChain() {
    throw new Error('IntegrityService.verifyChain() must be implemented');
  }

  /**
   * Get the chain block for a specific document.
   * @param {string} docId - Document UUID
   * @returns {Promise<object|null>} The block, or null if not found
   */
  async getBlock(docId) {
    throw new Error('IntegrityService.getBlock() must be implemented');
  }

  /**
   * Get the full chain (all blocks in order).
   * @returns {Promise<object[]>} Array of blocks ordered by blockIndex
   */
  async getChain() {
    throw new Error('IntegrityService.getChain() must be implemented');
  }

  /**
   * Ensure the genesis block exists. Called once on server startup.
   * @returns {Promise<void>}
   */
  async ensureGenesis() {
    throw new Error('IntegrityService.ensureGenesis() must be implemented');
  }
}
