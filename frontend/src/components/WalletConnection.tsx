import { useState, useEffect } from 'react';
import { getProvider, isWalletInstalled, WalletNotInstalledError } from '../lib/irisProvider';

export function WalletConnection() {
  const [connected, setConnected] = useState(false);
  const [pkh, setPkh] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [grpcEndpoint, setGrpcEndpoint] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicKey = async () => {
    try {
      const provider = getProvider();
      const dummyHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const signResult = await provider.signMessage(dummyHash);
      setPublicKey(signResult.publicKeyHex);
      console.log('Fetched public key:', signResult.publicKeyHex);
    } catch (pkErr) {
      console.warn('Could not fetch public key:', pkErr);
      setPublicKey(null);
    }
  };

  useEffect(() => {
    // Check if already connected
    try {
      if (isWalletInstalled()) {
        const provider = getProvider();
        const accounts = provider.accounts;
        if (accounts.length > 0) {
          setConnected(true);
          setPkh(accounts[0]);
        }
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }

    // Listen for account changes
    if (isWalletInstalled()) {
      const provider = getProvider();
      
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Account changed to:', accounts[0]);
        if (accounts.length > 0) {
          setPkh(accounts[0]);
          setConnected(true);
        } else {
          setPkh(null);
          setPublicKey(null);
          setConnected(false);
        }
      };

      const handleDisconnect = () => {
        setPkh(null);
        setPublicKey(null);
        setConnected(false);
        setGrpcEndpoint(null);
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('disconnect', handleDisconnect);

      return () => {
        provider.off('accountsChanged', handleAccountsChanged);
        provider.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  // Fetch public key whenever PKH changes
  useEffect(() => {
    if (pkh && connected) {
      console.log('PKH changed, fetching new public key for:', pkh);
      fetchPublicKey();
    }
  }, [pkh, connected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const provider = getProvider();
      const connectionInfo = await provider.connect();
      
      setPkh(connectionInfo.pkh);
      setGrpcEndpoint(connectionInfo.grpcEndpoint);
      setConnected(true);
      
      // Fetch the actual public key
      await fetchPublicKey();
    } catch (err) {
      if (err instanceof WalletNotInstalledError) {
        setError('Iris Wallet extension not found. Please install it from the Chrome Web Store.');
      } else if (err instanceof Error && err.message.includes('rejected')) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect to wallet: ' + (err instanceof Error ? err.message : String(err)));
      }
      console.error('Failed to connect:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isWalletInstalled()) {
    return (
      <div className="wallet-connection">
        <div className="wallet-not-installed">
          <h3>⚠️ Iris Wallet Not Found</h3>
          <p>Please install the Iris Wallet extension to use this application.</p>
          <a 
            href="https://github.com/nockbox/iris" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Get Iris Wallet
          </a>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="wallet-connection">
        <button
          onClick={handleConnect}
          className="btn-primary"
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Iris Wallet'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="wallet-connection connected">
      <div className="wallet-info">
        <div className="connection-indicator">
          <span className="status-dot"></span>
          <span>Connected</span>
        </div>
        <div className="wallet-details">
          <div className="wallet-address">
            <strong>PKH:</strong> <code>{pkh}</code>
          </div>
          {publicKey && (
            <div className="public-key-display">
              <div className="pubkey-header">
                <strong>Public Key (Use this for multisig!):</strong>
                <span className="info-badge" title="PKH is just a hash - we need the full public key to verify signatures cryptographically">ℹ️ Why not PKH?</span>
              </div>
              <code className="pubkey-code">
                {publicKey.substring(0, 30)}...{publicKey.substring(publicKey.length - 20)}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicKey);
                  alert('✓ Full public key copied!\n\nUse this in Step 1 when creating multisig Notes.\n\nNote: PKH cannot be used because it\'s just a hash of the public key - we need the actual public key to verify cryptographic signatures.');
                }}
                className="copy-pubkey-btn"
                title="Copy full public key to use in Note creation"
              >
                📋 Copy Full Key
              </button>
            </div>
          )}
          {grpcEndpoint && (
            <div className="grpc-endpoint">
              <strong>Network:</strong> <code>{grpcEndpoint}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
