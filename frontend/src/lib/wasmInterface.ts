import init, {
  build_transaction as wasmBuildTransaction,
  get_spend_hash as wasmGetSpendHash,
  add_signature as wasmAddSignature,
  get_spend_signing_status as wasmGetSpendSigningStatus,
  validate_transaction as wasmValidateTransaction,
} from '../../../rust-core/pkg/nockchain_multisig.js';

import type {
  Note,
  Output,
  Transaction,
  SigningStatus,
} from '../types/nockchain';
import {
  serializeNote,
  deserializeTransaction,
} from '../types/nockchain';

let wasmInitialized = false;

/**
 * Initialize the WASM module. Must be called before using any WASM functions.
 */
export async function initWasm(): Promise<void> {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

/**
 * Build a transaction from notes and outputs.
 * This creates the deterministic transaction structure with unsigned spends.
 */
export async function buildTransaction(
  notes: Note[],
  outputs: Output[]
): Promise<Transaction> {
  // Ensure WASM is initialized
  await initWasm();
  const notesJson = JSON.stringify(notes.map(serializeNote));
  const outputsJson = JSON.stringify(
    outputs.map(o => ({
      recipient: o.recipient,
      value: o.value,
      lock: {
        pkh: {
          threshold: o.lock.pkh.threshold,
          pubkeys: o.lock.pkh.pubkeys.map(pk => pk.value)
        }
      }
    }))
  );

  const result = wasmBuildTransaction(notesJson, outputsJson);
  return deserializeTransaction(JSON.parse(result));
}

/**
 * Get the deterministic hash for a specific spend that signers must sign.
 */
export function getSpendHash(tx: Transaction, spendIndex: number): string {
  const serialized = serializeTransactionForWasm(tx);
  const txJson = JSON.stringify(serialized);
  return wasmGetSpendHash(txJson, spendIndex);
}

/**
 * Add a signature to a specific spend in the transaction.
 */
export function addSignature(
  tx: Transaction,
  spendIndex: number,
  pubkey: string,
  signature: string
): Transaction {
  const serialized = serializeTransactionForWasm(tx);
  const txJson = JSON.stringify(serialized);
  const result = wasmAddSignature(txJson, spendIndex, pubkey, signature);
  return deserializeTransaction(JSON.parse(result));
}

/**
 * Get the signing status for a specific spend.
 */
export function getSpendSigningStatus(
  tx: Transaction,
  spendIndex: number
): SigningStatus {
  const serialized = serializeTransactionForWasm(tx);
  const txJson = JSON.stringify(serialized);
  const result = wasmGetSpendSigningStatus(txJson, spendIndex);
  return JSON.parse(result);
}

/**
 * Serialize transaction for WASM (convert objects to plain strings)
 */
function serializeTransactionForWasm(tx: Transaction): any {
  return {
    spends: tx.spends.map(spend => ({
      note: {
        name: spend.note.name,
        value: spend.note.value,
        lock: {
          pkh: {
            threshold: spend.note.lock.pkh.threshold,
            pubkeys: spend.note.lock.pkh.pubkeys.map(pk => pk.value)
          }
        }
      },
      seeds: {
        message_hash: spend.seeds.message_hash,
        signatures: spend.seeds.signatures.map(([pk, sig]) => [pk.value, sig.value])
      }
    })),
    outputs: tx.outputs.map(output => ({
      recipient: output.recipient,
      value: output.value,
      lock: {
        pkh: {
          threshold: output.lock.pkh.threshold,
          pubkeys: output.lock.pkh.pubkeys.map(pk => pk.value)
        }
      }
    }))
  };
}

/**
 * Validate that the transaction is complete and ready for broadcast.
 */
export function validateTransaction(tx: Transaction): string {
  const serialized = serializeTransactionForWasm(tx);
  const txJson = JSON.stringify(serialized);
  return wasmValidateTransaction(txJson);
}

/**
 * Export transaction to JSON string for sharing with other signers.
 */
export function exportTransaction(tx: Transaction): string {
  return JSON.stringify(tx, null, 2);
}

/**
 * Import transaction from JSON string.
 */
export function importTransaction(json: string): Transaction {
  return deserializeTransaction(JSON.parse(json));
}
