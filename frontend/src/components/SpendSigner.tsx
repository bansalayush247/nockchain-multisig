import { useState, useEffect } from 'react';
import type { Spend } from '../types/nockchain';
import { getProvider, isWalletInstalled, UserRejectedError } from '../lib/irisProvider';

interface SignedSpend {
  public_key: string;
  signature: string;
}

interface SpendSignerProps {
  spend: Spend;
  spendIndex: number;
  onSignatureAdded: (spendIndex: number, signature: SignedSpend) => void;
  wasmInterface: any | null;
}

export function SpendSigner({ spend, spendIndex, onSignatureAdded }: SpendSignerProps) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletPkh, setWalletPkh] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  // Track signatures from seeds
  const signatures = spend.seeds.signatures;

  useEffect(() => {
    const checkWalletConnection = () => {
      if (isWalletInstalled()) {
        try {
          const provider = getProvider();
          const accounts = provider.accounts;
          setWalletConnected(accounts.length > 0);
          setWalletPkh(accounts[0] || null);
        } catch (err) {
          console.error('Error checking wallet:', err);
        }
      }
    };

    checkWalletConnection();

    // Listen for account changes
    if (isWalletInstalled()) {
      const provider = getProvider();
      
      const handleAccountsChanged = (accounts: string[]) => {
        setWalletConnected(accounts.length > 0);
        setWalletPkh(accounts[0] || null);
      };

      provider.on('accountsChanged', handleAccountsChanged);
      return () => provider.off('accountsChanged', handleAccountsChanged);
    }
  }, []);

  const handleIrisWalletSign = async () => {
    if (!walletConnected) {
      alert('Please connect your Iris Wallet first');
      return;
    }

    console.log('Starting signature process for spend:', spendIndex);
    console.log('Message hash to sign:', spend.seeds.message_hash);
    console.log('Connected wallet PKH:', walletPkh);

    setSigning(true);
    try {
      const provider = getProvider();
      
      // Use signMessage to sign the spend hash
      const messageHash = spend.seeds.message_hash;
      console.log('Calling provider.signMessage with hash:', messageHash);
      
      const signResult = await provider.signMessage(messageHash);
      console.log('Sign result received:', signResult);

      const newSig: SignedSpend = {
        public_key: signResult.publicKeyHex,
        signature: signResult.signature,
      };

      console.log('Adding signature:', newSig);
      onSignatureAdded(spendIndex, newSig);
      
      console.log('Signature successfully added to spend', spendIndex);
      alert('✓ Signature added successfully!');
    } catch (err) {
      console.error('Error during signing:', err);
      if (err instanceof UserRejectedError) {
        alert('❌ Signing rejected by user');
      } else {
        alert('❌ Failed to sign: ' + (err instanceof Error ? err.message : String(err)));
      }
    } finally {
      setSigning(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const provider = getProvider();
      const connectionInfo = await provider.connect();
      setWalletConnected(true);
      setWalletPkh(connectionInfo.pkh);
    } catch (err) {
      if (err instanceof UserRejectedError) {
        alert('Connection rejected by user');
      } else {
        console.error('Failed to connect wallet:', err);
        alert('Failed to connect wallet. Please try again.');
      }
    }
  };

  const signingStatus = () => {
    const signed = signatures.length;
    const required = spend.note.lock.pkh.threshold;
    const complete = signed >= required;
    return { signed, required, complete };
  };

  const status = signingStatus();

  return (
    <div className="spend-signer">
      <h4>Spend {spendIndex + 1} - Note: {spend.note.name.first}/{spend.note.name.last}</h4>
      <div className="signing-status">
        <p>
          Signatures: {status.signed} / {status.required}
          {status.complete && <span className="complete-badge"> ✓ Complete</span>}
        </p>
      </div>

      <div className="authorized-signers">
        <h5>Authorized Public Keys ({spend.note.lock.pkh.pubkeys.length} total):</h5>
        <div className="pubkey-list">
          {spend.note.lock.pkh.pubkeys.map((pk, idx) => {
            const isSigned = signatures.some(([sigPk]) => sigPk.value === pk.value);
            return (
              <div key={idx} className={`pubkey-item ${isSigned ? 'signed' : 'pending'}`}>
                <span className="pubkey-status">{isSigned ? '✓' : '○'}</span>
                <code className="pubkey-value">{pk.value.substring(0, 20)}...{pk.value.substring(pk.value.length - 10)}</code>
              </div>
            );
          })}
        </div>
      </div>

      {signatures.length > 0 && (
        <div className="signatures-list">
          <h5>Collected Signatures:</h5>
          {signatures.map(([pubkey, sig], idx) => (
            <div key={idx} className="signature-item">
              <div className="signature-pubkey">
                <strong>Public Key:</strong> <code>{pubkey.value.substring(0, 20)}...{pubkey.value.substring(pubkey.value.length - 10)}</code>
              </div>
              <div className="signature-value">
                <strong>Signature:</strong> <code>{sig.value.substring(0, 32)}...{sig.value.substring(sig.value.length - 16)}</code>
              </div>
            </div>
          ))}
        </div>
      )}

      {!status.complete && (
        <div className="signing-controls">
          <h5>Sign with Iris Wallet:</h5>
          
          {!isWalletInstalled() ? (
            <div className="wallet-not-installed">
              <p>⚠️ Iris Wallet extension not found</p>
              <a 
                href="https://github.com/nockbox/iris" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Get Iris Wallet
              </a>
            </div>
          ) : walletConnected ? (
            <div className="wallet-signing">
              <p className="wallet-status">
                ✓ Connected: <code>{walletPkh}</code>
              </p>
              <button 
                onClick={handleIrisWalletSign}
                className="btn-wallet-sign"
                disabled={signing}
              >
                {signing ? 'Signing...' : 'Sign with Iris Wallet'}
              </button>
            </div>
          ) : (
            <div className="wallet-signing">
              <p className="wallet-status">Wallet not connected</p>
              <button 
                onClick={handleConnectWallet}
                className="btn-wallet-connect"
              >
                Connect Iris Wallet
              </button>
            </div>
          )}
        </div>
      )}

      {status.complete && (
        <div className="complete-message">
          ✓ This spend has enough signatures and is ready to broadcast
        </div>
      )}
    </div>
  );
}
