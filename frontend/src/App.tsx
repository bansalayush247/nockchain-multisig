import { useState, useEffect } from 'react';
import { NoteSelection } from './components/NoteSelection';
import { OutputBuilder } from './components/OutputBuilder';
import { TransactionSigner } from './components/TransactionSigner';
import { WalletConnection } from './components/WalletConnection';
import type { Note, Output, Transaction } from './types/nockchain';
import { initWasm, buildTransaction } from './lib/wasmInterface';
import './App.css';

type AppStep = 'notes' | 'outputs' | 'signing';

function App() {
  const [step, setStep] = useState<AppStep>('notes');
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    initWasm()
      .then(() => setWasmReady(true))
      .catch((err) => setError('Failed to initialize WASM: ' + err.message));
  }, []);

  const handleNotesSelected = (notes: Note[]) => {
    setSelectedNotes(notes);
    setStep('outputs');
  };

  const handleOutputsCreated = async (outputs: Output[]) => {
    try {
      setError('');
      const tx = await buildTransaction(selectedNotes, outputs);
      setTransaction(tx);
      setStep('signing');
    } catch (err) {
      setError('Failed to build transaction: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleBackToNotes = () => {
    setStep('notes');
    setSelectedNotes([]);
    setTransaction(null);
  };

  const totalInput = selectedNotes.reduce((sum, note) => sum + note.value, 0);

  if (!wasmReady) {
    return (
      <div className="app-container">
        <div className="loading">
          {error ? (
            <div className="error">
              <h2>Error</h2>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="spinner"></div>
              <p>Loading Nockchain Transaction Builder...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-inner">
          <h1>🔗 Nockchain Multisig Transaction Builder</h1>
          <p className="subtitle">
            Create, sign, and broadcast multisig transactions with confidence
          </p>
        </div>
      </header>

      <div className="progress-indicator">
        <div className={`step-indicator ${step === 'notes' ? 'active' : step === 'outputs' || step === 'signing' ? 'complete' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Select Notes</div>
        </div>
        <div className="progress-line"></div>
        <div className={`step-indicator ${step === 'outputs' ? 'active' : step === 'signing' ? 'complete' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Create Outputs</div>
        </div>
        <div className="progress-line"></div>
        <div className={`step-indicator ${step === 'signing' ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Sign & Broadcast</div>
        </div>
      </div>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError('')} className="close-btn">✕</button>
          </div>
        )}

        <div className="content-wrapper">
          <WalletConnection />

          {step === 'notes' && <NoteSelection onNotesSelected={handleNotesSelected} />}
          
          {step === 'outputs' && (
            <OutputBuilder
              totalInput={totalInput}
              onOutputsCreated={handleOutputsCreated}
              onBack={handleBackToNotes}
            />
          )}
          
          {step === 'signing' && transaction && (
            <TransactionSigner
              initialTransaction={transaction}
              onBack={handleBackToNotes}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>
            <strong>Note:</strong> This is a demonstration application for the Nockchain multisig protocol.
            Only <code>%pkh</code> lock primitives are implemented.
          </p>
          <p className="footer-links">
            <a href="https://github.com/nockbox/iris-rs" target="_blank" rel="noopener noreferrer">
              iris-rs
            </a>
            {' • '}
            <a href="https://github.com/nockbox/iris-wallet" target="_blank" rel="noopener noreferrer">
              Iris Wallet
            </a>
            {' • '}
            <a href="https://www.npmjs.com/package/@nockbox/iris-connect" target="_blank" rel="noopener noreferrer">
              Iris Connect SDK
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
