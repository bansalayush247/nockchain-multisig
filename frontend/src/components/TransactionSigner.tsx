import React, { useState, useEffect } from 'react';
import type { Transaction } from '../types/nockchain';
import { SpendSigner } from './SpendSigner';
import {
  addSignature,
  validateTransaction,
  exportTransaction,
  importTransaction,
} from '../lib/wasmInterface';

interface TransactionSignerProps {
  initialTransaction: Transaction;
  onBack: () => void;
}

export const TransactionSigner: React.FC<TransactionSignerProps> = ({
  initialTransaction,
  onBack,
}) => {
  const [transaction, setTransaction] = useState<Transaction>(initialTransaction);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [showExportImport, setShowExportImport] = useState<boolean>(false);
  const [importJson, setImportJson] = useState<string>('');

  useEffect(() => {
    checkValidation();
  }, [transaction]);

  const checkValidation = () => {
    try {
      const message = validateTransaction(transaction);
      setValidationMessage(message);
      setIsValid(true);
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : String(error));
      setIsValid(false);
    }
  };

  const handleSignatureAdded = (spendIndex: number, pubkey: string, signature: string) => {
    console.log('handleSignatureAdded called with:', { spendIndex, pubkey, signature });
    console.log('Current transaction:', transaction);
    
    try {
      const updatedTx = addSignature(transaction, spendIndex, pubkey, signature);
      console.log('Updated transaction after adding signature:', updatedTx);
      setTransaction(updatedTx);
      console.log('Transaction state updated successfully');
    } catch (error) {
      console.error('Error in handleSignatureAdded:', error);
      alert('Error adding signature: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleExport = () => {
    const json = exportTransaction(transaction);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nockchain-transaction.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const json = exportTransaction(transaction);
    navigator.clipboard.writeText(json);
    alert('Transaction copied to clipboard!');
  };

  const handleImport = () => {
    try {
      const imported = importTransaction(importJson);
      setTransaction(imported);
      setImportJson('');
      setShowExportImport(false);
      alert('Transaction imported successfully!');
    } catch (error) {
      alert('Error importing transaction: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleBroadcast = () => {
    if (!isValid) {
      alert('Transaction is not valid. Please complete all required signatures.');
      return;
    }

    alert(
      'Transaction Broadcast:\n\n' +
      'In production, this would:\n' +
      '1. Submit the transaction to the Nockchain network\n' +
      '2. Wait for confirmation\n' +
      '3. Display the transaction hash\n\n' +
      'This is a mock implementation for demonstration purposes.\n\n' +
      'Transaction is valid and ready for broadcast!'
    );
  };

  return (
    <div className="transaction-signer">
      <h2>Step 3: Sign Transaction</h2>

      <div className="transaction-summary">
        <h3>Transaction Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Total Spends:</span>
            <span>{transaction.spends.length}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Input:</span>
            <span>{transaction.spends.reduce((sum, s) => sum + s.note.value, 0)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Output:</span>
            <span>{transaction.outputs.reduce((sum, o) => sum + o.value, 0)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Status:</span>
            <span className={isValid ? 'valid' : 'invalid'}>
              {isValid ? '✓ Valid' : '⋯ Incomplete'}
            </span>
          </div>
        </div>
      </div>

      <div className="validation-status">
        <div className={`validation-message ${isValid ? 'valid' : 'invalid'}`}>
          {validationMessage}
        </div>
      </div>

      <div className="spends-container">
        <h3>Spends Requiring Signatures</h3>
        {transaction.spends.map((spend, idx) => (
          <SpendSigner
            key={idx}
            spend={spend}
            spendIndex={idx}
            wasmInterface={null}
            onSignatureAdded={(spendIndex: number, signature: { public_key: string; signature: string }) =>
              handleSignatureAdded(spendIndex, signature.public_key, signature.signature)
            }
          />
        ))}
      </div>

      <div className="transaction-actions">
        <div className="action-group">
          <h4>Export/Import</h4>
          <div className="button-group">
            <button onClick={handleExport} className="btn-secondary">
              📥 Download JSON
            </button>
            <button onClick={handleCopyToClipboard} className="btn-secondary">
              📋 Copy to Clipboard
            </button>
            <button
              onClick={() => setShowExportImport(!showExportImport)}
              className="btn-secondary"
            >
              📤 Import Transaction
            </button>
          </div>

          {showExportImport && (
            <div className="import-form">
              <label>Paste Transaction JSON:</label>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste transaction JSON here..."
                rows={8}
              />
              <button onClick={handleImport} className="btn-primary">
                Import
              </button>
            </div>
          )}
        </div>

        <div className="action-group">
          <h4>Finalize</h4>
          <p className="help-text">
            {isValid
              ? 'All signatures collected. Ready to broadcast!'
              : 'Complete all required signatures before broadcasting.'}
          </p>
          <button
            onClick={handleBroadcast}
            className="btn-primary btn-large"
            disabled={!isValid}
          >
            🚀 Broadcast Transaction
          </button>
        </div>
      </div>

      <div className="bottom-actions">
        <button onClick={onBack} className="btn-secondary">
          ← Start New Transaction
        </button>
      </div>
    </div>
  );
};
