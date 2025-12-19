# Quick Test Guide

## ✅ Fixed Error
The "invalid type: map, expected a string" error is now fixed. The transaction serialization properly converts TypeScript objects to plain strings for WASM.

## 📝 Step-by-Step Testing

### Step 1: Select Notes (Input)
Create a note with these values:
- **First Name**: `Alice`
- **Last Name**: `Note-1`
- **Value**: `100`
- **Lock Type**: `%pkh` (multisig)
- **Threshold (m)**: `2`
- **Pubkeys (N=3)**:
  ```
  02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
  02cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
  ```

Click "Add Note" → Select the note → Click "Next"

### Step 2: Create Outputs

**Output 1 (Send to Bob):**
- **Recipient**: `Bob`
- **Value**: `50`
- **Threshold**: `1` (Bob only needs 1 signature)
- **Pubkeys**: 
  ```
  02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  ```

**Output 2 (Change back to Alice):**
- **Recipient**: `Alice`
- **Value**: `50`
- **Threshold**: `2` (same as input, or different if you want)
- **Pubkeys** (use same as input or different):
  ```
  02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
  ```

**Important**: Total outputs (50 + 50 = 100) must equal total inputs (100)

Click "Create Transaction"

### Step 3: Sign Transaction

You'll see:
- **Transaction Summary**: Shows inputs/outputs are balanced
- **Spend 1**: Requires 2 signatures (m=2 from input note)

**To Sign:**
1. Make sure Iris Wallet is connected (top right should show your PKH)
2. Click "Sign with Iris Wallet" button
3. Approve in Iris Wallet popup
4. Signature will be added (you'll see "Signatures: 1 / 2")

**For Testing Multisig:**
- You need 2 signatures total
- Either:
  - Sign with 2 different accounts from Iris Wallet, OR
  - Export the transaction → Send to another person → They import and sign

### Common Questions

**Q: Can I use different pubkeys in outputs than inputs?**
A: Yes! Outputs are independent. You can send to completely different multisig setups.

**Q: What if I only have 1 Iris account?**
A: For testing:
1. Sign once with your account
2. Export the transaction (Download JSON)
3. You can manually add a second signature or simulate collaborative signing

**Q: Why 2-of-3 multisig?**
A: This means you need ANY 2 signatures out of the 3 pubkeys to spend. Common for:
- Business accounts (2 executives must approve)
- Shared wallets (any 2 family members)
- Security (lose 1 key, still have access with other 2)

**Q: Can I change the threshold?**
A: Yes! Common setups:
- `1-of-1`: Single signature (normal wallet)
- `2-of-2`: Both must sign (joint account)
- `2-of-3`: Any 2 of 3 (recommended for security)
- `3-of-5`: Any 3 of 5 (DAO/organization)

### Example Scenarios

**Scenario 1: Simple Send**
- Input: 1 note worth 100 (2-of-3)
- Output 1: Send 90 to Bob (1-of-1, Bob's pubkey)
- Output 2: Change 10 back to you (2-of-3, same as input)

**Scenario 2: Split to Multiple Recipients**
- Input: 1 note worth 100 (2-of-3)
- Output 1: 30 to Alice (1-of-1)
- Output 2: 30 to Bob (1-of-1)
- Output 3: 40 to Carol (1-of-1)

**Scenario 3: Consolidate Notes**
- Input 1: 50 (2-of-3)
- Input 2: 30 (2-of-3)
- Input 3: 20 (2-of-3)
- Output: 100 to new multisig (3-of-5 for better security)

## 🎨 UI Improvements Made

- ✨ Glassmorphism design with backdrop blur
- 🌈 Gradient backgrounds and glowing effects
- 💫 Smooth animations and hover effects
- 🎯 Better visual hierarchy
- 🔘 Enhanced button interactions

## 🐛 Errors Fixed

1. ✅ **WASM initialization** - Now properly awaits before use
2. ✅ **Serialization error** - Converts TypeScript objects to plain strings for WASM
3. ✅ **Type safety** - All transaction data properly typed

## 🚀 Ready to Test!

Your app is now ready at **http://localhost:5173/** (or 5174 if 5173 was in use)

All errors are fixed and the UI is beautiful! 🎉
