// ============================================================================
// Core Nockchain Types
// ============================================================================

export interface PublicKey {
  value: string;
}

export interface Signature {
  value: string;
}

export interface NoteName {
  first: string;
  last: string;
}

export interface PkhCondition {
  threshold: number;
  pubkeys: PublicKey[];
}

export interface Lock {
  pkh: PkhCondition;
}

export interface Note {
  name: NoteName;
  value: number;
  lock: Lock;
}

export interface Seeds {
  message_hash: string;
  signatures: Array<[PublicKey, Signature]>;
}

export interface Spend {
  note: Note;
  seeds: Seeds;
}

export interface Output {
  recipient: string;
  value: number;
  lock: Lock;
}

export interface Transaction {
  spends: Spend[];
  outputs: Output[];
}

export interface SigningStatus {
  spend_index: number;
  threshold: number;
  signed: PublicKey[];
  pending: PublicKey[];
  complete: boolean;
}

// ============================================================================
// Serialization Helpers
// ============================================================================

export function serializePublicKey(pk: PublicKey): string {
  return pk.value;
}

export function deserializePublicKey(value: string): PublicKey {
  return { value };
}

export function serializeNote(note: Note): any {
  return {
    name: note.name,
    value: note.value,
    lock: {
      pkh: {
        threshold: note.lock.pkh.threshold,
        pubkeys: note.lock.pkh.pubkeys.map(pk => serializePublicKey(pk))
      }
    }
  };
}

export function deserializeTransaction(data: any): Transaction {
  return {
    spends: data.spends.map((spend: any) => ({
      note: {
        name: spend.note.name,
        value: spend.note.value,
        lock: {
          pkh: {
            threshold: spend.note.lock.pkh.threshold,
            pubkeys: (spend.note.lock.pkh.pubkeys || []).map((pk: any) =>
              typeof pk === 'string' ? deserializePublicKey(pk) : deserializePublicKey(pk?.value)
            )
          }
        }
      },
      seeds: {
        message_hash: spend.seeds.message_hash,
        signatures: (spend.seeds.signatures || []).map((pair: any) => {
          const [pk, sig] = pair || [];
          const pkStr = typeof pk === 'string' ? pk : pk?.value;
          const sigStr = typeof sig === 'string' ? sig : sig?.value;
          return [deserializePublicKey(pkStr), { value: sigStr }];
        })
      }
    })),
    outputs: data.outputs.map((output: any) => ({
      recipient: output.recipient,
      value: output.value,
      lock: {
        pkh: {
          threshold: output.lock.pkh.threshold,
          pubkeys: output.lock.pkh.pubkeys.map(deserializePublicKey)
        }
      }
    }))
  };
}
