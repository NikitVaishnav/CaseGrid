// ============================================================
// CaseGrid — Integrity Service Factory
// Returns the active integrity implementation based on env config.
// Change INTEGRITY_PROVIDER to swap between custom chain and Fabric.
// ============================================================

import { CustomChainService } from './CustomChainService.js';
// Future: import { FabricService } from './FabricService.js';

/**
 * Singleton instance — created once, reused across the app.
 * @type {import('./IntegrityService.js').IntegrityService|null}
 */
let instance = null;

/**
 * Get the active integrity service implementation.
 * Uses factory pattern so controllers never know which implementation they're using.
 *
 * @returns {import('./IntegrityService.js').IntegrityService}
 */
export function getIntegrityService() {
  if (instance) return instance;

  const provider = process.env.INTEGRITY_PROVIDER || 'custom';

  switch (provider) {
    case 'custom':
      instance = new CustomChainService();
      console.log('  ⛓️  Integrity provider: Custom Chain (PostgreSQL)');
      break;

    // case 'fabric':
    //   instance = new FabricService();
    //   console.log('  ⛓️  Integrity provider: Hyperledger Fabric');
    //   break;

    default:
      throw new Error(`Unknown integrity provider: "${provider}". Use "custom" or "fabric".`);
  }

  return instance;
}
