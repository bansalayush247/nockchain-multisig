# ⚠️ IMPORTANT: PKH vs Public Key

## The Problem You Just Hit

You got the error: **"Public key not allowed for this spend"**

This happened because there's a critical difference between:
- **PKH (Public Key Hash)** - A short hash of your public key (what you see in the wallet UI)
- **Public Key** - The actual full public key (what's needed for signatures)

## What Happened

1. In **Step 1**, you entered these PKH values thinking they were public keys:
   - `9vXAbnuEgLS6FxFsnuGwXZyfFtTc3xGGDVQ8frHJ8m4fQybHPgZXaHR`
   - `9SufgdXxZRPppMuXpV2pnHDzvYKm67Bb7hrnU6BdXL3oEJ3q2kNfkKy`

2. But when Iris Wallet **signed**, it returned the actual public key:
   - `019758db283633d0dcaedf62f31f82c1f5bf52c1bb16f34b31...` (130+ characters)
   - `014695050004e96b4e27e87c6c0bdc379ebd8290643df6d2bc...` (130+ characters)

3. The Rust WASM code checked: "Is this signer's public key in the authorized list?" → **NO** → Error!

## The Solution

### Step 1: Get Your Actual Public Keys

The app now displays your **actual public key** in the wallet connection section:

1. **Refresh** the page at http://localhost:5173/
2. Look at the wallet connection box at the top
3. You'll now see:
   ```
   Connected
   PKH: CLDrW2M5...
   Public Key: 019758db283633d0dcaedf62...
   [📋 Copy Full Key]
   ```
4. Click **"📋 Copy Full Key"** to copy your actual public key

### Step 2: Create a New Transaction with Correct Keys

You need to **start over** with the correct public keys:

1. Click **"← Start New Transaction"** at the bottom
2. In **Step 1: Select Notes**, when entering public keys:
   - Click the **"📋 Copy Full Key"** button in the wallet section
   - **Paste** that full public key (starts with `01`, about 130 characters)
   - Do this for each participant's public key
3. Complete Steps 2 and 3 as before

### Example: Correct vs Incorrect

**❌ INCORRECT (PKH - won't work):**
```
9SufgdXxZRPppMuXpV2pnHDzvYKm67Bb7hrnU6BdXL3oEJ3q2kNfkKy
```

**✅ CORRECT (Full Public Key):**
```
019758db283633d0dcaedf62f31f82c1f5bf52c1bb16f34b31d2f234a08787c8d943442ac281bb6d6b9590ea866d5ac799654f846a
```

## For Testing with Multiple Signers

Since you have a 2-of-3 multisig:

### Option 1: Create Multiple Iris Accounts
1. In Iris Wallet, create 2 more accounts
2. Get the public key for each by signing (the app will fetch it)
3. Use all 3 public keys when creating the Note

### Option 2: Test with One Account (for now)
1. Create a 1-of-1 or 2-of-2 multisig
2. Use the same public key multiple times
3. This lets you test the signing flow with just one account

### Option 3: Export/Import Flow
1. Create transaction with multiple real public keys
2. Sign with your account
3. Export the partial transaction (JSON)
4. Send to another party
5. They import, sign, and send back

## Why This Design?

In Nockchain:
- **PKH** = User-friendly identifier (like a username)
- **Public Key** = Cryptographic verification material (like a password hash)
- Signatures must be verified against the **actual public key**, not its hash
- The multisig lock stores full public keys to validate signatures

## Next Steps

1. ✅ Refresh the page - you'll see your public key displayed
2. ✅ Click "Copy Full Key" to get your actual public key  
3. ✅ Start a new transaction
4. ✅ Use the copied public key in Step 1
5. ✅ Try signing again - it will work!

---

**TL;DR**: Use the **"📋 Copy Full Key"** button in the wallet section when creating Notes. Don't use the short PKH string!
