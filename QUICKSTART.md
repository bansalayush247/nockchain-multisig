# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Rust (1.70+): `rustc --version`
- ✅ wasm-pack: `wasm-pack --version`
- ✅ Node.js (18+): `node --version`
- ✅ npm: `npm --version`

## 5-Minute Setup

### 1. Build Rust WASM Module
```bash
cd rust-core
wasm-pack build --target web
cd ..
```

Expected output: `✨ Done in X.XXs` and `pkg/` directory created

### 2. Setup Frontend
```bash
cd frontend
npm install
ln -sf ../rust-core/pkg rust-core
```

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser

## First Transaction

### Step 1: Create a Note
1. Enter note details:
   - First Name: `alice`
   - Last Name: `treasury`
   - Value: `1000`

2. Configure multisig (2-of-3 example):
   - Threshold: `2`
   - Public Keys:
     - `0x1111111111111111111111111111111111111111111111111111111111111111`
     - `0x2222222222222222222222222222222222222222222222222222222222222222`
     - `0x3333333333333333333333333333333333333333333333333333333333333333`

3. Click "Add Note"
4. Select the note (checkbox)
5. Click "Proceed with 1 Selected Note(s)"

### Step 2: Create Outputs
1. Add recipient output:
   - Recipient: `bob`
   - Value: `700`
   - Threshold: `1`
   - Public Key: `0x4444444444444444444444444444444444444444444444444444444444444444`
   - Click "Add Output"

2. Add change output:
   - Recipient: `alice-change`
   - Value: `300`
   - Threshold: `1`
   - Public Key: `0x1111111111111111111111111111111111111111111111111111111111111111`
   - Click "Add Output"

3. Verify balance: 1000 input = 700 + 300 output ✓
4. Click "Build Transaction"

### Step 3: Sign Transaction
1. View Spend #1 details
2. Copy the message hash (click "Copy" button)
3. Click "✍️ Manual Signature Entry"
4. Select first public key
5. Enter signature (any hex string for testing):
   ```
   0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
   ```
6. Click "Add Signature"
7. See progress: 1 / 2 signatures

8. Repeat for second signer:
   - Select second public key
   - Enter different signature:
     ```
     0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
     ```
   - Click "Add Signature"
   - See progress: 2 / 2 signatures ✓

9. Transaction status changes to "Valid"
10. Click "🚀 Broadcast Transaction"

## Export/Import Flow

### Export Partially Signed Transaction
1. After adding first signature
2. Click "📋 Copy to Clipboard" or "📥 Download JSON"
3. Share JSON with other signer

### Import and Continue Signing
1. Refresh page (or open in different browser)
2. Navigate to signing step
3. Click "📤 Import Transaction"
4. Paste JSON
5. Click "Import"
6. Add remaining signatures

## Testing Different Scenarios

### 1-of-1 Multisig (Single Signer)
- Threshold: 1
- Public Keys: 1
- Requires: 1 signature

### 2-of-2 Multisig (Both Must Sign)
- Threshold: 2
- Public Keys: 2
- Requires: 2 signatures

### 3-of-5 Multisig (Any 3 of 5)
- Threshold: 3
- Public Keys: 5
- Requires: 3 signatures

### Multiple Spends
- Select 2+ notes with different multisig configs
- Create outputs that sum to total input
- Sign each spend independently

## Common Issues

### "Failed to initialize WASM"
**Solution**: Ensure rust-core/pkg exists and symlink is correct
```bash
cd rust-core && wasm-pack build --target web
cd ../frontend && ln -sf ../rust-core/pkg rust-core
```

### "Total output must equal total input"
**Solution**: Adjust output values to match input exactly
- Input: 1000
- Output: 800 (recipient) + 200 (change) = 1000 ✓

### "Public key not allowed for this spend"
**Solution**: Ensure signature is from one of the Note's authorized pubkeys

### "Threshold must be between 1 and number of public keys"
**Solution**: 
- Minimum threshold: 1
- Maximum threshold: number of pubkeys
- Example: 3 pubkeys → threshold can be 1, 2, or 3

## Development Commands

```bash
# Rebuild Rust (after code changes)
cd rust-core
wasm-pack build --target web

# Restart frontend dev server
cd frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run tsc

# Lint
npm run lint
```

## Browser Console

Open DevTools (F12) to see:
- WASM initialization logs
- Transaction state changes
- Error messages (if any)

## Next Steps

After familiarizing yourself with the basics:

1. Review `README.md` for architecture details
2. Check `ARCHITECTURE.md` for technical deep dive
3. Explore Rust code in `rust-core/src/lib.rs`
4. Examine React components in `frontend/src/components/`
5. Read about Iris Wallet integration points

## Mock vs Real

| Feature | Current (Mock) | Production |
|---------|---------------|------------|
| Signatures | Any hex string | Actual cryptographic signatures |
| Public Keys | User input | From wallet / keystore |
| Broadcasting | Mock alert | Submit to Nockchain node |
| Wallet Integration | Button placeholder | Iris Connect SDK |
| Signature Verification | Format check only | Ed25519/ECDSA verification |

## Support

For questions about:
- **Nockchain protocol**: See iris-rs documentation
- **Iris Wallet**: See Iris Wallet GitHub
- **This implementation**: Check README.md and ARCHITECTURE.md

---

Happy transaction building! 🚀
