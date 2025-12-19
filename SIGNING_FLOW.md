# Multisig Signing Flow

## Overview

This document explains how multisig signing works in the Nockchain Transaction Builder with visual examples.

## Example Scenario: 2-of-3 Multisig

### Initial Setup

**Note "Alice Treasury":**
- Value: 1000
- Lock: 2-of-3 multisig
- Authorized Pubkeys:
  - Alice: `0x1111...`
  - Bob: `0x2222...`
  - Carol: `0x3333...`

**Required**: Any 2 of the 3 must sign

## Step-by-Step Flow

### 1. Transaction Creation

```
┌─────────────────────────────────────────────┐
│ Transaction Builder                          │
├─────────────────────────────────────────────┤
│ Inputs:                                      │
│  ✓ Note "Alice Treasury" (1000)             │
│                                              │
│ Outputs:                                     │
│  → Recipient "Bob" (700)                     │
│  → Change "Alice" (300)                      │
│                                              │
│ Balance: 1000 = 700 + 300 ✓                 │
└─────────────────────────────────────────────┘
                    ↓
         [Build Transaction]
                    ↓
┌─────────────────────────────────────────────┐
│ Unsigned Transaction Created                 │
├─────────────────────────────────────────────┤
│ Spend #1:                                    │
│  Note: Alice Treasury                        │
│  Seeds:                                      │
│   message_hash: 0xabcd1234...               │
│   signatures: []                             │
│                                              │
│ Status: ⋯ 0 / 2 signatures                  │
└─────────────────────────────────────────────┘
```

### 2. First Signature (Alice Signs)

```
┌─────────────────────────────────────────────┐
│ Spend #1 - Signing Interface                │
├─────────────────────────────────────────────┤
│ Required: 2-of-3 signatures                  │
│                                              │
│ Message Hash:                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 0xabcd1234ef5678...                [Copy]│ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Signing Status:                              │
│ ✓ Signed (1):                                │
│   ✓ Alice (0x1111...)                        │
│                                              │
│ ⋯ Pending (2):                               │
│   ⋯ Bob (0x2222...)                          │
│   ⋯ Carol (0x3333...)                        │
│                                              │
│ Progress: 1 / 2 ⋯ Incomplete                 │
└─────────────────────────────────────────────┘
```

**Alice's Action:**
1. Sees message hash: `0xabcd1234...`
2. Signs with her private key (in wallet)
3. Provides signature: `0xsig_alice...`
4. System validates Alice is authorized ✓
5. Signature added to transaction

### 3. Export for Collaboration

```
┌─────────────────────────────────────────────┐
│ Transaction Actions                          │
├─────────────────────────────────────────────┤
│ [📥 Download JSON]  [📋 Copy to Clipboard]  │
└─────────────────────────────────────────────┘
                    ↓
        transaction_v1.json
                    ↓
     (Share with Bob or Carol)
```

**Exported JSON contains:**
- Transaction structure
- Alice's signature
- Empty slots for remaining signatures

### 4. Bob Imports and Signs

```
┌─────────────────────────────────────────────┐
│ Import Transaction                           │
├─────────────────────────────────────────────┤
│ [Paste JSON here...]                         │
│                                              │
│ [Import]                                     │
└─────────────────────────────────────────────┘
                    ↓
         Transaction Loaded
                    ↓
┌─────────────────────────────────────────────┐
│ Spend #1 - Bob's View                        │
├─────────────────────────────────────────────┤
│ Message Hash: 0xabcd1234... (same as Alice) │
│                                              │
│ ✓ Signed (1):                                │
│   ✓ Alice (0x1111...)                        │
│                                              │
│ ⋯ Pending (2):                               │
│   ⋯ Bob (0x2222...)      ← YOU ARE HERE      │
│   ⋯ Carol (0x3333...)                        │
│                                              │
│ [🔐 Sign with Iris Wallet]                   │
│ [✍️ Manual Signature Entry]                  │
└─────────────────────────────────────────────┘
```

**Bob's Action:**
1. Imports transaction
2. Sees Alice already signed
3. Verifies message hash matches
4. Signs same hash with his key
5. Provides signature: `0xsig_bob...`
6. System validates Bob is authorized ✓

### 5. Transaction Complete

```
┌─────────────────────────────────────────────┐
│ Spend #1 - Complete!                         │
├─────────────────────────────────────────────┤
│ Message Hash: 0xabcd1234...                  │
│                                              │
│ ✓ Signed (2):                                │
│   ✓ Alice (0x1111...)                        │
│   ✓ Bob (0x2222...)                          │
│                                              │
│ ⋯ Pending (1):                               │
│   ⋯ Carol (0x3333...)                        │
│                                              │
│ Progress: 2 / 2 ✓ Complete                   │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ✓ Transaction is valid and ready!       │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [🚀 Broadcast Transaction]                   │
└─────────────────────────────────────────────┘
```

**Threshold Met:**
- Required: 2 signatures
- Collected: Alice + Bob = 2 ✓
- Carol's signature not needed (2-of-3, not 3-of-3)

## Different Multisig Patterns

### 1-of-1 (Single Signer)
```
Required: 1 signature
Pubkeys: [Alice]

Flow:
⋯ Alice → ✓ Alice → COMPLETE
```

### 2-of-2 (Both Must Sign)
```
Required: 2 signatures
Pubkeys: [Alice, Bob]

Flow:
⋯ Alice    ⋯ Bob
✓ Alice    ⋯ Bob
✓ Alice    ✓ Bob → COMPLETE
```

### 3-of-5 (Any 3 of 5)
```
Required: 3 signatures
Pubkeys: [Alice, Bob, Carol, Dave, Eve]

Example Flow 1:
✓ Alice  ✓ Bob  ✓ Carol  ⋯ Dave  ⋯ Eve → COMPLETE

Example Flow 2:
⋯ Alice  ✓ Bob  ✓ Carol  ✓ Dave  ⋯ Eve → COMPLETE

Example Flow 3:
✓ Alice  ⋯ Bob  ✓ Carol  ✓ Dave  ✓ Eve → COMPLETE
```

## Multiple Spends

When transaction has multiple inputs with different multisig requirements:

```
┌─────────────────────────────────────────────┐
│ Transaction with 2 Spends                    │
├─────────────────────────────────────────────┤
│ Spend #1: "Alice Treasury" (2-of-3)         │
│   ✓ Signed: Alice, Bob                       │
│   Status: 2 / 2 ✓ Complete                   │
│                                              │
│ Spend #2: "Company Safe" (3-of-5)           │
│   ✓ Signed: Alice, Carol                     │
│   ⋯ Pending: Bob, Dave, Eve                  │
│   Status: 2 / 3 ⋯ Incomplete                 │
│                                              │
│ Overall: ⋯ Not ready for broadcast          │
└─────────────────────────────────────────────┘
```

**Each spend tracks independently:**
- Different threshold requirements
- Different authorized signers
- Different message hashes
- Must ALL be complete to broadcast

## Security Properties

### Deterministic Hashing
```
Transaction (no signatures) → SHA256 → Hash
                             ↓
                    Same hash every time
                             ↓
          All signers sign the SAME hash
```

**Why important:**
- Prevents hash manipulation
- Ensures all signers agree on transaction
- Enables offline/async signing

### Threshold Enforcement
```
if signatures.count() >= threshold:
    ✓ VALID - Can broadcast
else:
    ✗ INVALID - Need more signatures
```

**Prevents:**
- Broadcasting with insufficient signatures
- Single signer controlling multisig funds

### Signer Authorization
```
for signature in signatures:
    if signature.pubkey not in authorized_pubkeys:
        ✗ REJECT - Unauthorized signer
```

**Prevents:**
- Random people signing transaction
- Using wrong keys

## User Experience Principles

### 1. Always Show Progress
```
Current: 2 / 3 signatures
         ▓▓░ 66%
```

### 2. Clear Visual Status
```
✓ Green  = Signed
⋯ Orange = Pending
✗ Red    = Error
```

### 3. Explicit Actions
```
❌ No auto-signing
✓ User clicks "Add Signature"
✓ User sees what they're signing
✓ User confirms each action
```

### 4. Export/Import Friendly
```
Alice signs → Export JSON
           ↓
Bob imports → Signs → Export JSON
                   ↓
Carol imports → Signs → Broadcast
```

## Common Scenarios

### Scenario 1: Board Approval
**Setup**: 3-of-5 board members must approve
**Flow**:
1. CFO creates transaction
2. Exports to board members
3. 3 board members sign independently
4. Last signer broadcasts

### Scenario 2: Personal Security
**Setup**: 2-of-3 (laptop, phone, hardware wallet)
**Flow**:
1. Sign on laptop
2. Export to phone
3. Sign on phone
4. Broadcast

### Scenario 3: Collaborative Treasury
**Setup**: 2-of-4 team leads
**Flow**:
1. Any lead creates transaction
2. Any other lead signs
3. Broadcast immediately

## Error Handling

### Insufficient Signatures
```
┌─────────────────────────────────────────────┐
│ ✗ Cannot broadcast                           │
├─────────────────────────────────────────────┤
│ Spend #1: 1 / 2 signatures (need 1 more)    │
│                                              │
│ [Broadcast] ← DISABLED                       │
└─────────────────────────────────────────────┘
```

### Wrong Signer
```
┌─────────────────────────────────────────────┐
│ ✗ Error adding signature                     │
├─────────────────────────────────────────────┤
│ Public key 0x9999... is not authorized       │
│ for this spend.                              │
│                                              │
│ Authorized keys:                             │
│  - 0x1111... (Alice)                         │
│  - 0x2222... (Bob)                           │
│  - 0x3333... (Carol)                         │
└─────────────────────────────────────────────┘
```

### Duplicate Signature
```
┌─────────────────────────────────────────────┐
│ ℹ️ Signature updated                         │
├─────────────────────────────────────────────┤
│ Alice's previous signature replaced          │
│ with new signature.                          │
└─────────────────────────────────────────────┘
```

## Comparison with Bitcoin Multisig

| Feature | Bitcoin | Nockchain (This App) |
|---------|---------|---------------------|
| M-of-N | ✓ | ✓ |
| Deterministic | ✓ (BIP32) | ✓ (SHA256) |
| UTXO Model | ✓ | ✓ (Notes) |
| Threshold | Per output | Per spend |
| Signing | Offline capable | Offline capable |
| Export/Import | PSBT | JSON |

## Best Practices

### For Transaction Creators
1. ✓ Verify balance before building
2. ✓ Double-check recipient addresses
3. ✓ Export immediately after creating
4. ✓ Communicate hash to signers

### For Signers
1. ✓ Verify message hash matches expected
2. ✓ Check transaction details before signing
3. ✓ Keep backup of partially signed transaction
4. ✓ Sign promptly to avoid delays

### For Security
1. ✓ Use hardware wallet for signing
2. ✓ Verify all outputs before signing
3. ✓ Never share private keys
4. ✓ Communicate via secure channels

## Conclusion

The multisig signing flow in this application prioritizes:
1. **Clarity**: Users always know signing status
2. **Safety**: Explicit actions, clear validation
3. **Flexibility**: Offline signing, async collaboration
4. **Correctness**: Deterministic hashes, threshold enforcement

Users are never confused about what they're signing or who needs to sign next.
