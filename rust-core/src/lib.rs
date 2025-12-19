use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use wasm_bindgen::prelude::*;
use std::collections::HashSet;

// ============================================================================
// Core Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct PublicKey(pub String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signature(pub String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteName {
    pub first: String,
    pub last: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PkhCondition {
    pub threshold: usize,
    pub pubkeys: Vec<PublicKey>,
}

impl PkhCondition {
    pub fn validate(&self) -> Result<(), String> {
        if self.threshold == 0 {
            return Err("Threshold must be >= 1".into());
        }
        if self.threshold > self.pubkeys.len() {
            return Err("Threshold exceeds number of pubkeys".into());
        }

        let mut set = HashSet::new();
        for pk in &self.pubkeys {
            if !set.insert(pk) {
                return Err("Duplicate public key in multisig set".into());
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lock {
    pub pkh: PkhCondition,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub name: NoteName,
    pub value: u64,
    pub lock: Lock,
}

// ============================================================================
// Seeds and Signing
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Seeds {
    pub message_hash: String,
    pub signatures: Vec<(PublicKey, Signature)>,
}

impl Seeds {
    pub fn new(message_hash: String) -> Self {
        Self {
            message_hash,
            signatures: Vec::new(),
        }
    }

    pub fn add_signature(&mut self, pubkey: PublicKey, signature: Signature) {
        self.signatures.retain(|(pk, _)| pk != &pubkey);
        self.signatures.push((pubkey, signature));
    }

    pub fn signature_count(&self) -> usize {
        self.signatures.len()
    }

    pub fn has_signature(&self, pubkey: &PublicKey) -> bool {
        self.signatures.iter().any(|(pk, _)| pk == pubkey)
    }
}

// ============================================================================
// Transaction Model
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Spend {
    pub note: Note,
    pub seeds: Seeds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Output {
    pub recipient: String,
    pub value: u64,
    pub lock: Lock,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub spends: Vec<Spend>,
    pub outputs: Vec<Output>,
}

impl Transaction {
    pub fn total_input(&self) -> u64 {
        self.spends.iter().map(|s| s.note.value).sum()
    }

    pub fn total_output(&self) -> u64 {
        self.outputs.iter().map(|o| o.value).sum()
    }

    pub fn validate_balance(&self) -> Result<(), String> {
        if self.total_input() != self.total_output() {
            return Err("Input value does not equal output value".into());
        }
        Ok(())
    }

    pub fn validate_signatures(&self) -> Result<(), String> {
        for (i, spend) in self.spends.iter().enumerate() {
            let pkh = &spend.note.lock.pkh;
            pkh.validate()?;

            if spend.seeds.signature_count() < pkh.threshold {
                return Err(format!("Spend {} has insufficient signatures", i));
            }

            for (pk, _) in &spend.seeds.signatures {
                if !pkh.pubkeys.contains(pk) {
                    return Err(format!("Spend {} has invalid signer", i));
                }
            }
        }
        Ok(())
    }
}

// ============================================================================
// Deterministic Hashing
// ============================================================================

#[derive(Serialize)]
struct SigningPayload<'a> {
    spend_index: usize,
    transaction: &'a Transaction,
}

fn compute_spend_hash(spend_index: usize, tx: &Transaction) -> String {
    let mut tx_clone = tx.clone();

    for spend in tx_clone.spends.iter_mut() {
        spend.seeds.signatures.clear();
    }

    let payload = SigningPayload {
        spend_index,
        transaction: &tx_clone,
    };

    let bytes = serde_json::to_vec(&payload).expect("Serialization failed");

    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hex::encode(hasher.finalize())
}

// ============================================================================
// Signing Status
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct SigningStatus {
    pub spend_index: usize,
    pub threshold: usize,
    pub signed: Vec<PublicKey>,
    pub pending: Vec<PublicKey>,
    pub complete: bool,
}

fn signing_status(spend_index: usize, tx: &Transaction) -> SigningStatus {
    let spend = &tx.spends[spend_index];
    let pkh = &spend.note.lock.pkh;

    let mut signed = Vec::new();
    let mut pending = Vec::new();

    for pk in &pkh.pubkeys {
        if spend.seeds.has_signature(pk) {
            signed.push(pk.clone());
        } else {
            pending.push(pk.clone());
        }
    }

    let complete = signed.len() >= pkh.threshold;

    SigningStatus {
        spend_index,
        threshold: pkh.threshold,
        signed,
        pending,
        complete,
    }
}

// ============================================================================
// WASM Interface
// ============================================================================

#[wasm_bindgen]
pub fn build_transaction(notes_json: &str, outputs_json: &str) -> Result<String, String> {
    let notes: Vec<Note> =
        serde_json::from_str(notes_json).map_err(|e| e.to_string())?;
    let outputs: Vec<Output> =
        serde_json::from_str(outputs_json).map_err(|e| e.to_string())?;

    let mut spends = Vec::new();

    for (i, note) in notes.into_iter().enumerate() {
        note.lock.pkh.validate()?;

        let dummy_tx = Transaction {
            spends: Vec::new(),
            outputs: outputs.clone(),
        };

        let hash = compute_spend_hash(i, &dummy_tx);

        spends.push(Spend {
            note,
            seeds: Seeds::new(hash),
        });
    }

    let tx = Transaction { spends, outputs };
    tx.validate_balance()?;

    serde_json::to_string(&tx).map_err(|e| e.to_string())
}

#[wasm_bindgen]
pub fn get_spend_hash(tx_json: &str, spend_index: usize) -> Result<String, String> {
    let tx: Transaction =
        serde_json::from_str(tx_json).map_err(|e| e.to_string())?;

    if spend_index >= tx.spends.len() {
        return Err("Spend index out of bounds".into());
    }

    Ok(tx.spends[spend_index].seeds.message_hash.clone())
}

#[wasm_bindgen]
pub fn add_signature(
    tx_json: &str,
    spend_index: usize,
    pubkey: &str,
    signature: &str,
) -> Result<String, String> {
    let mut tx: Transaction =
        serde_json::from_str(tx_json).map_err(|e| e.to_string())?;

    let pk = PublicKey(pubkey.to_string());

    let spend = tx
        .spends
        .get_mut(spend_index)
        .ok_or("Invalid spend index")?;

    if !spend.note.lock.pkh.pubkeys.contains(&pk) {
        return Err("Public key not allowed for this spend".into());
    }

    spend
        .seeds
        .add_signature(pk, Signature(signature.to_string()));

    serde_json::to_string(&tx).map_err(|e| e.to_string())
}

#[wasm_bindgen]
pub fn get_spend_signing_status(
    tx_json: &str,
    spend_index: usize,
) -> Result<String, String> {
    let tx: Transaction =
        serde_json::from_str(tx_json).map_err(|e| e.to_string())?;

    if spend_index >= tx.spends.len() {
        return Err("Spend index out of bounds".into());
    }

    let status = signing_status(spend_index, &tx);
    serde_json::to_string(&status).map_err(|e| e.to_string())
}

#[wasm_bindgen]
pub fn validate_transaction(tx_json: &str) -> Result<String, String> {
    let tx: Transaction =
        serde_json::from_str(tx_json).map_err(|e| e.to_string())?;

    tx.validate_balance()?;
    tx.validate_signatures()?;

    Ok("Transaction is valid and ready for broadcast".into())
}
