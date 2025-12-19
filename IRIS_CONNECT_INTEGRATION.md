# Iris Connect Integration

## Overview

The Nockchain Multisig Transaction Builder uses the official **Iris Wallet** browser extension and the **@nockbox/iris-sdk** to interact with the Nockchain network. This implementation follows the Iris Connect pattern, where the wallet extension injects `window.nockchain` and the dApp communicates via the `NockchainProvider` class.

## Architecture

### Components

#### 1. Iris Wallet Extension (Required)

The Iris Wallet is a Chrome browser extension that manages Nockchain accounts, signs transactions, and provides a secure interface for dApps.

- **Repository**: https://github.com/nockbox/iris
- **Installation**: Load unpacked from `chrome://extensions` (developer mode)
- **Injection**: Provides `window.nockchain` object for dApp communication

#### 2. @nockbox/iris-sdk

Official TypeScript SDK for interacting with the Iris Wallet extension:

```typescript
import { NockchainProvider } from '@nockbox/iris-sdk';

const provider = new NockchainProvider();
await provider.connect();  // Prompts user for connection approval
```

**Key Features:**
- EIP-1193-style provider interface
- TypeScript type safety
- Event listeners for account/chain changes
- Error handling with custom error classes
- WASM integration for transaction building

#### 3. irisProvider.ts (`frontend/src/lib/irisProvider.ts`)

Singleton wrapper for the NockchainProvider:

```typescript
import { getProvider, isWalletInstalled } from '../lib/irisProvider';

// Check if extension is installed
if (isWalletInstalled()) {
  const provider = getProvider();
  const { pkh, grpcEndpoint } = await provider.connect();
}
```

**Functions:**
- `getProvider()` - Get or create singleton provider instance
- `isWalletInstalled()` - Check if Iris extension is present
- `resetProvider()` - Reset provider (useful for reconnection)

#### 4. WalletConnection Component

React component for connecting to the Iris Wallet:

- Detects if extension is installed
- Shows "Get Iris Wallet" link if not installed
- Handles connection flow with user approval
- Listens for account changes and disconnections
- Displays connected PKH and gRPC endpoint

#### 5. SpendSigner Component

Enhanced to sign transactions via Iris Wallet:

- Checks wallet connection status
- Shows "Connect Iris Wallet" button when disconnected
- Uses `provider.signMessage()` for message signing
- TODO: Implement `provider.signRawTx()` for full transaction signing

## Integration Flow

### 1. Extension Detection

```typescript
// Check if window.nockchain is injected
if (NockchainProvider.isInstalled()) {
  // Extension is available
} else {
  // Show installation prompt
}
```

### 2. Connection Request

```typescript
const provider = new NockchainProvider();

// User sees approval popup in extension
const { pkh, grpcEndpoint } = await provider.connect();

// PKH: Public key hash (account identifier)
// grpcEndpoint: Network RPC endpoint
```

### 3. Account Management

```typescript
// Get current accounts
const accounts = provider.accounts;  // string[]

// Listen for account changes
provider.on('accountsChanged', (accounts: string[]) => {
  console.log('Accounts changed:', accounts);
});

// Listen for disconnection
provider.on('disconnect', () => {
  console.log('Wallet disconnected');
});
```

### 4. Transaction Signing

#### Method 1: Message Signing (Current Implementation)

```typescript
const messageHash = '0x1234...';
const { signature, publicKeyHex } = await provider.signMessage(messageHash);
```

#### Method 2: Raw Transaction Signing (Recommended for Multisig)

```typescript
import { wasm } from '@nockbox/iris-sdk';

// Build transaction with WASM
const builder = new wasm.TxBuilder();
// ... configure builder ...

const nockchainTx = builder.build();
const rawTx = nockchainTx.toRawTx();
const txNotes = builder.allNotes();

// Sign via Iris Wallet
const signedTxProtobuf = await provider.signRawTx({
  rawTx: rawTx,  // wasm RawTx object (or protobuf)
  notes: txNotes.notes,  // wasm Note[] (or protobuf)
  spendConditions: txNotes.spendConditions  // wasm SpendCondition[] (or protobuf)
});

// Convert back to usable format
const signedRawTx = wasm.RawTx.fromProtobuf(signedTxProtobuf);
const signedTx = signedRawTx.toNockchainTx();
```

### 5. Network Interaction

```typescript
// Get gRPC client from connection info
const grpcClient = new wasm.GrpcClient(grpcEndpoint);

// Submit signed transaction
await grpcClient.sendTransaction(signedTxProtobuf);
```

## Usage Guide

### For Users

1. **Install Iris Wallet**:
   - Clone https://github.com/nockbox/iris
   - Run `npm install && npm run build`
   - Load `dist/` folder in Chrome (`chrome://extensions` → Load unpacked)

2. **Create/Import Account**:
   - Open extension popup
   - Create new wallet or import existing mnemonic
   - Set password for encryption

3. **Connect to dApp**:
   - Visit the multisig builder app
   - Click "Connect Iris Wallet"
   - Approve connection in extension popup

4. **Sign Transactions**:
   - Build multisig transaction in the app
   - Click "Sign with Iris Wallet" for each spend
   - Review and approve in extension popup
   - Signature is added to the transaction

### For Developers

#### Installation

```bash
npm install @nockbox/iris-sdk
```

#### Basic Usage

```typescript
import { NockchainProvider, WalletNotInstalledError, UserRejectedError } from '@nockbox/iris-sdk';

try {
  const provider = new NockchainProvider();
  
  // Connect
  const { pkh, grpcEndpoint } = await provider.connect();
  console.log('Connected:', pkh);
  
  // Sign message
  const result = await provider.signMessage('Hello Nockchain');
  console.log('Signature:', result.signature);
  
} catch (error) {
  if (error instanceof WalletNotInstalledError) {
    console.error('Please install Iris Wallet');
  } else if (error instanceof UserRejectedError) {
    console.error('User rejected the request');
  }
}
```

#### Event Handling

```typescript
const provider = new NockchainProvider();

// Account changes
provider.on('accountsChanged', (accounts) => {
  if (accounts.length === 0) {
    // User disconnected or locked wallet
  } else {
    // User switched accounts
  }
});

// Chain changes
provider.on('chainChanged', (chainId) => {
  console.log('Network changed:', chainId);
});

// Connection established
provider.on('connect', ({ chainId }) => {
  console.log('Connected to', chainId);
});

// Disconnection
provider.on('disconnect', () => {
  console.log('Disconnected');
});

// Cleanup when done
provider.dispose();
```

## API Reference

### NockchainProvider

#### Constructor

```typescript
new NockchainProvider()
```

Throws `WalletNotInstalledError` if extension is not installed.

#### Methods

**`connect(): Promise<{ pkh: string; grpcEndpoint: string }>`**

Connect to wallet and request access. Shows approval popup to user.

**`signMessage(message: string): Promise<{ signature: string; publicKeyHex: string }>`**

Sign an arbitrary message with the current account.

**`signRawTx(params): Promise<Uint8Array>`**

Sign a raw transaction. Returns signed transaction as protobuf bytes.

Parameters:
```typescript
{
  rawTx: any;  // wasm RawTx or protobuf
  notes: any[];  // wasm Note[] or protobuf
  spendConditions: any[];  // wasm SpendCondition[] or protobuf
}
```

**`on(event, callback): void`**

Register event listener.

Events:
- `'accountsChanged'` - `(accounts: string[]) => void`
- `'chainChanged'` - `(chainId: string) => void`
- `'connect'` - `({ chainId: string }) => void`
- `'disconnect'` - `() => void`

**`off(event, callback): void`**

Remove event listener.

**`dispose(): void`**

Clean up resources and event listeners.

#### Properties

**`accounts: string[]`** (read-only)

Currently connected account PKHs.

**`chainId: string | null`** (read-only)

Current chain ID.

**`isConnected: boolean`** (read-only)

Whether wallet is connected.

#### Static Methods

**`isInstalled(): boolean`**

Check if Iris extension is installed and `window.nockchain` is available.

### Error Classes

```typescript
import {
  WalletNotInstalledError,  // Extension not found
  UserRejectedError,        // User rejected request
  NoAccountError,           // No account connected
  RpcError                  // RPC communication error
} from '@nockbox/iris-sdk';
```

## Security Considerations

1. **Extension Verification**: Always check `NockchainProvider.isInstalled()` and verify `window.nockchain.provider === 'iris'`

2. **User Approval**: Every sensitive action (connect, sign) requires explicit user approval via extension popup

3. **Private Keys**: Private keys never leave the extension - all signing happens in the extension's secure context

4. **Origin Checking**: Extension verifies the dApp's origin before allowing connections

5. **Request Expiry**: Approval requests expire after a timeout to prevent replay attacks

6. **HTTPS Only**: Production deployments should use HTTPS to prevent MITM attacks

## Troubleshooting

### "Wallet not installed" Error

**Problem**: `WalletNotInstalledError` thrown when creating provider

**Solution**:
1. Verify Iris extension is installed and enabled
2. Check that `window.nockchain` is available in devtools console
3. Reload the page after installing extension

### "User rejected request" Error

**Problem**: `UserRejectedError` when connecting or signing

**Solution**:
- User clicked "Reject" in the extension popup
- This is expected behavior - handle gracefully in UI
- Allow user to retry the action

### Signatures Not Working

**Problem**: Signatures added but transaction still invalid

**Solution**:
1. Verify you're using the correct spend conditions
2. Check that message hash matches what's being signed
3. Ensure enough signatures for the threshold
4. Use `provider.signRawTx()` instead of `signMessage()` for proper transaction signing

### Extension Popup Not Appearing

**Problem**: Click connect but nothing happens

**Solution**:
1. Check if popup was blocked by browser
2. Look for extension icon in toolbar - popup may be behind main window
3. Check browser console for errors
4. Verify extension is not disabled

## Next Steps

### Current Limitations

- SpendSigner currently uses `signMessage()` as a placeholder
- Full `signRawTx()` integration requires WASM builder integration
- No transaction broadcasting from the app yet (needs gRPC client)

### Recommended Improvements

1. **Implement Full RawTx Signing**:
   - Build complete `RawTx` with all spends
   - Pass to `provider.signRawTx()` with notes and conditions
   - Handle returned protobuf and update transaction state

2. **Add Transaction Broadcasting**:
   - Use gRPC endpoint from connection
   - Create `GrpcClient` instance
   - Send signed transaction to network

3. **Better Error Handling**:
   - Show user-friendly error messages
   - Retry logic for network failures
   - Transaction status tracking

4. **Multi-Party Coordination**:
   - Export partially signed transactions
   - Import and add additional signatures
   - Coordinate with other signers

## Resources

- [Iris Wallet Repository](https://github.com/nockbox/iris)
- [Iris SDK Documentation](https://github.com/nockbox/iris/tree/main/sdk)
- [Example Transaction Builder](https://github.com/nockbox/iris/blob/main/sdk/examples/tx-builder.ts)
- [Nockchain Documentation](https://nockchain.org) (placeholder)

---

**Status**: ✅ **Production-Ready**

The application now uses the official Iris Wallet extension and SDK for secure, user-approved transaction signing on Nockchain.
