# Architecture Overview

## System Architecture

### High-Level Design

This application follows a **three-tier architecture**:

1. **Presentation Layer** (React + TypeScript)
   - User interface and interaction logic
   - State management
   - Component orchestration

2. **Business Logic Layer** (Rust → WASM)
   - Transaction construction and validation
   - Cryptographic hashing
   - Multisig verification logic

3. **Integration Layer** (TypeScript WASM Bindings)
   - Bridge between React and Rust
   - Type conversions and serialization
   - Error handling

### Data Flow

```
User Interaction
      ↓
React Components (UI State)
      ↓
TypeScript Functions (wasmInterface.ts)
      ↓
Type Conversion/Serialization
      ↓
WASM Functions (Rust)
      ↓
Business Logic Execution
      ↓
Result Serialization
      ↓
TypeScript (deserialize)
      ↓
React State Update
      ↓
UI Render
```

## Core Abstractions

### Rust Core

#### Transaction Model
```rust
Transaction {
  spends: Vec<Spend>,    // Inputs (Notes being consumed)
  outputs: Vec<Output>,  // New Notes being created
}

Spend {
  note: Note,           // The UTXO being spent
  seeds: Seeds,         // Unlock conditions (signatures)
}

Note {
  name: NoteName,       // [first, last] identifier
  value: u64,           // Amount
  lock: Lock,           // Spending requirements
}

Lock {
  pkh: PkhCondition,    // Only %pkh implemented
}

PkhCondition {
  threshold: usize,     // M in M-of-N
  pubkeys: Vec<PublicKey>, // N pubkeys
}

Seeds {
  message_hash: String,           // What signers sign
  signatures: Vec<(PubKey, Sig)>, // Collected signatures
}
```

#### Key Algorithms

**1. Deterministic Hash Generation**
```rust
fn compute_spend_hash(spend_index: usize, tx: &Transaction) -> String {
  // Clone transaction
  let mut tx_clone = tx.clone();
  
  // Clear all signatures (determinism)
  for spend in tx_clone.spends.iter_mut() {
    spend.seeds.signatures.clear();
  }
  
  // Create payload with index
  let payload = SigningPayload {
    spend_index,
    transaction: &tx_clone,
  };
  
  // Serialize and hash
  let bytes = serde_json::to_vec(&payload)?;
  let hash = SHA256(bytes);
  
  hex::encode(hash)
}
```

**Why this approach?**
- Same hash for all signers of a given spend
- Index included to differentiate spends
- Empty signatures ensure determinism
- JSON serialization for clarity (production might use binary)

**2. Signature Validation**
```rust
fn validate_signatures(&self) -> Result<(), String> {
  for spend in &self.spends {
    let pkh = &spend.note.lock.pkh;
    
    // Check threshold met
    if spend.seeds.signature_count() < pkh.threshold {
      return Err("Insufficient signatures");
    }
    
    // Verify all signers are authorized
    for (pk, _) in &spend.seeds.signatures {
      if !pkh.pubkeys.contains(pk) {
        return Err("Invalid signer");
      }
    }
  }
  Ok(())
}
```

### React Architecture

#### Component Hierarchy

```
App
├── NoteSelection
│   └── [Note cards with multisig config]
├── OutputBuilder
│   └── [Output forms with locks]
└── TransactionSigner
    ├── TransactionSummary
    ├── SpendSigner (one per spend)
    │   ├── SigningStatus
    │   ├── MessageHash display
    │   └── SigningActions
    └── TransactionActions
        ├── Export/Import
        └── Broadcast
```

#### State Management

**Application State:**
- `step`: Which phase of transaction building
- `selectedNotes`: Notes chosen for spending
- `transaction`: Current transaction object
- `wasmReady`: WASM initialization status

**Component State:**
- Form inputs (controlled components)
- UI state (toggles, selections)
- Local validation errors

**State Flow:**
```
NoteSelection → notes[] → OutputBuilder → outputs[]
                                ↓
                         buildTransaction(notes, outputs)
                                ↓
                         TransactionSigner ← transaction
                                ↓
                         addSignature(...)
                                ↓
                         updated transaction
```

## Key Design Patterns

### 1. Builder Pattern
Transaction construction follows builder pattern:
- Select inputs (Notes)
- Define outputs
- Build structure
- Add signatures incrementally
- Validate
- Finalize

### 2. Immutability in Rust
Every operation returns a new transaction:
```rust
pub fn add_signature(tx_json: &str, ...) -> Result<String, String> {
  let mut tx: Transaction = deserialize(tx_json);
  // Modify
  tx.spends[index].seeds.add_signature(...);
  // Return new JSON
  serialize(&tx)
}
```

Benefits:
- No shared mutable state
- Easier to reason about
- Supports undo/redo patterns
- Safe concurrency

### 3. Interface Segregation
WASM functions are single-purpose:
- `build_transaction()` - Create structure
- `get_spend_hash()` - Get hash for signing
- `add_signature()` - Add one signature
- `get_spend_signing_status()` - Check progress
- `validate_transaction()` - Final validation

Each does one thing well, easier to test and compose.

### 4. Fail-Fast Validation
Multiple validation layers:
1. **UI validation**: Form constraints, balance checks
2. **Rust validation**: Type checks, business logic
3. **Final validation**: Complete transaction rules

Errors surface early with clear messages.

## Security Considerations

### What's Validated

✅ **Threshold Requirements**
- At least M signatures for M-of-N
- Signatures from authorized keys only

✅ **Balance Constraints**
- Sum(inputs) = Sum(outputs)
- No value creation

✅ **Type Safety**
- Rust's type system prevents many bugs
- No null/undefined in core logic

✅ **Deterministic Hashing**
- Same input → same hash
- No timing attacks on hash generation

### What's NOT Validated (Out of Scope)

❌ **Signature Cryptography**
- Signatures not actually verified (mock)
- Production needs Ed25519/ECDSA verification

❌ **Note Existence**
- Not checking if Notes actually exist on chain
- Would need blockchain state access

❌ **Double Spending**
- Not tracking which Notes already spent
- Needs mempool integration

❌ **Replay Protection**
- No nonce or sequence numbers
- Would need transaction versioning

## Performance Considerations

### WASM Overhead
- Serialization/deserialization at boundary
- Acceptable for transaction sizes (KB range)
- Could optimize with binary formats

### React Rendering
- Component memoization not needed (small lists)
- No virtualization (reasonable note counts)
- Could optimize with React.memo if scaling

### Hash Computation
- SHA256 is fast (~100MB/s)
- Transaction JSON typically < 10KB
- Hash computation << 1ms

## Testing Strategy

### Unit Tests (Rust)
Should test:
- PkhCondition validation
- Signature counting
- Transaction validation
- Hash determinism

```rust
#[cfg(test)]
mod tests {
  #[test]
  fn test_threshold_validation() {
    let pkh = PkhCondition {
      threshold: 2,
      pubkeys: vec![pk1, pk2, pk3],
    };
    assert!(pkh.validate().is_ok());
    
    let bad_pkh = PkhCondition {
      threshold: 5, // > pubkeys.len()
      pubkeys: vec![pk1, pk2],
    };
    assert!(bad_pkh.validate().is_err());
  }
}
```

### Integration Tests (TypeScript)
Should test:
- WASM function calls
- Serialization round-trips
- Error handling

### E2E Tests (Playwright/Cypress)
Should test:
- Complete transaction flow
- Export/import workflow
- Error messages displayed correctly

## Extensibility Points

### Adding New Lock Primitives

To add `%tim` (time-based locks):

1. **Extend Rust types:**
```rust
enum LockPrimitive {
  Pkh(PkhCondition),
  Tim(TimCondition), // New
}

struct Lock {
  primitives: Vec<LockPrimitive>,
}
```

2. **Update validation:**
```rust
fn validate_lock(&self, context: &ValidationContext) -> Result<()> {
  for primitive in &self.primitives {
    match primitive {
      Pkh(p) => validate_pkh(p, context),
      Tim(t) => validate_tim(t, context), // New
    }
  }
}
```

3. **Update UI:**
- Add TimCondition component
- Update form for time inputs
- Display time requirements

### Adding Hardware Wallet Support

```typescript
interface SignerBackend {
  getPublicKeys(): Promise<PublicKey[]>;
  signMessage(hash: string): Promise<Signature>;
}

class IrisWalletBackend implements SignerBackend { ... }
class LedgerBackend implements SignerBackend { ... }
class TrezorBackend implements SignerBackend { ... }
```

## Deployment Considerations

### Build Process
1. Compile Rust to WASM (`wasm-pack`)
2. Bundle frontend (`vite build`)
3. Serve static files

### WASM Loading
- Current: Async import
- Production: Could preload in `<link rel="preload">`
- Could use service worker for offline

### Browser Compatibility
- Requires WASM support (all modern browsers)
- ES6+ features (can transpile if needed)
- No IE11 support

## Maintenance & Evolution

### Adding Features
- New lock primitives: Extend enum, add validation
- New signature schemes: Add verification logic
- Transaction history: Add storage layer

### Refactoring Paths
- Extract validation into separate module
- Add transaction builder DSL
- Create signature coordinator service

### Migration Strategy
If data format changes:
1. Version transactions (`version: 1`)
2. Support multiple versions in deserializer
3. Provide migration functions
4. Deprecate old versions gradually

## Conclusion

This architecture prioritizes:
1. **Correctness**: Type safety, validation layers
2. **Clarity**: Single-responsibility, clear naming
3. **Extensibility**: Clean abstractions, enum-based dispatch
4. **Performance**: Acceptable for use case, optimizable
5. **Maintainability**: Well-structured, documented

The system is production-ready in terms of architecture, but would need real wallet integration, blockchain connectivity, and comprehensive testing before deployment.
