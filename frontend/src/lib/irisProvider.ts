/**
 * Iris Wallet Integration using official @nockbox/iris-sdk
 * 
 * This module provides a singleton NockchainProvider instance for interacting
 * with the Iris Wallet extension via the window.nockchain injected object.
 */

import { NockchainProvider } from '@nockbox/iris-sdk';

let providerInstance: NockchainProvider | null = null;

/**
 * Get or create the Nockchain provider instance
 * @returns NockchainProvider instance
 * @throws {WalletNotInstalledError} If Iris wallet extension is not installed
 */
export function getProvider(): NockchainProvider {
  if (!providerInstance) {
    // This will throw WalletNotInstalledError if extension is not present
    providerInstance = new NockchainProvider();
  }
  return providerInstance;
}

/**
 * Check if the Iris wallet extension is installed
 * @returns true if extension is installed
 */
export function isWalletInstalled(): boolean {
  return NockchainProvider.isInstalled();
}

/**
 * Reset the provider instance (useful for testing or reconnection)
 */
export function resetProvider(): void {
  if (providerInstance) {
    providerInstance.dispose();
    providerInstance = null;
  }
}

// Re-export types and errors from SDK
export { WalletNotInstalledError, UserRejectedError, NoAccountError, RpcError } from '@nockbox/iris-sdk';
export type { NockchainProvider } from '@nockbox/iris-sdk';
