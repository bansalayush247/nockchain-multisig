import React, { useState } from 'react';
import type { Output, Lock } from '../types/nockchain';

interface OutputBuilderProps {
  totalInput: number;
  onOutputsCreated: (outputs: Output[]) => void;
  onBack: () => void;
}

export const OutputBuilder: React.FC<OutputBuilderProps> = ({
  totalInput,
  onOutputsCreated,
  onBack,
}) => {
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [recipient, setRecipient] = useState('');
  const [value, setValue] = useState('');
  const [threshold, setThreshold] = useState('1');
  const [pubkeys, setPubkeys] = useState<string[]>(['']);

  const addPubkeyField = () => {
    setPubkeys([...pubkeys, '']);
  };

  const updatePubkey = (index: number, value: string) => {
    const updated = [...pubkeys];
    updated[index] = value;
    setPubkeys(updated);
  };

  const removePubkey = (index: number) => {
    setPubkeys(pubkeys.filter((_, i) => i !== index));
  };

  const totalOutput = outputs.reduce((sum, o) => sum + o.value, 0);
  const remaining = totalInput - totalOutput;

  const addOutput = () => {
    const validPubkeys = pubkeys.filter(pk => pk.trim() !== '');
    
    if (!recipient || !value || validPubkeys.length === 0) {
      alert('Please fill all fields and add at least one public key');
      return;
    }

    const outputValue = parseInt(value);
    if (outputValue <= 0) {
      alert('Value must be positive');
      return;
    }

    if (totalOutput + outputValue > totalInput) {
      alert('Total output cannot exceed total input');
      return;
    }

    const thresholdNum = parseInt(threshold);
    if (thresholdNum < 1 || thresholdNum > validPubkeys.length) {
      alert('Threshold must be between 1 and the number of public keys');
      return;
    }

    const lock: Lock = {
      pkh: {
        threshold: thresholdNum,
        pubkeys: validPubkeys.map(pk => ({ value: pk.trim() })),
      },
    };

    const output: Output = {
      recipient,
      value: outputValue,
      lock,
    };

    setOutputs([...outputs, output]);
    
    // Reset form
    setRecipient('');
    setValue('');
    setThreshold('1');
    setPubkeys(['']);
  };

  const removeOutput = (index: number) => {
    setOutputs(outputs.filter((_, i) => i !== index));
  };

  const buildTransaction = () => {
    if (remaining !== 0) {
      alert('Total output must equal total input. Add outputs or change values.');
      return;
    }
    if (outputs.length === 0) {
      alert('Please add at least one output');
      return;
    }
    onOutputsCreated(outputs);
  };

  return (
    <div className="output-builder">
      <h2>Step 2: Create Outputs</h2>
      
      <div className="balance-info">
        <div className="balance-row">
          <span>Total Input:</span>
          <strong>{totalInput}</strong>
        </div>
        <div className="balance-row">
          <span>Total Output:</span>
          <strong>{totalOutput}</strong>
        </div>
        <div className={`balance-row ${remaining < 0 ? 'error' : ''}`}>
          <span>Remaining:</span>
          <strong>{remaining}</strong>
        </div>
      </div>

      <div className="add-output-form">
        <h3>Add Output</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Recipient Name"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <input
            type="number"
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            max={remaining}
          />
        </div>

        <div className="multisig-config">
          <h4>Lock Configuration</h4>
          <div className="threshold-input">
            <label>
              Threshold (M-of-N):
              <input
                type="number"
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </label>
          </div>

          <div className="pubkeys-list">
            <label>Public Keys:</label>
            {pubkeys.map((pk, idx) => (
              <div key={idx} className="pubkey-input">
                <input
                  type="text"
                  placeholder={`Public Key ${idx + 1}`}
                  value={pk}
                  onChange={(e) => updatePubkey(idx, e.target.value)}
                />
                {pubkeys.length > 1 && (
                  <button onClick={() => removePubkey(idx)} className="btn-small">
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button onClick={addPubkeyField} className="btn-secondary">
              + Add Public Key
            </button>
          </div>
        </div>

        <button onClick={addOutput} className="btn-primary" disabled={remaining <= 0 && outputs.length > 0}>
          Add Output
        </button>
      </div>

      {outputs.length > 0 && (
        <div className="outputs-list">
          <h3>Outputs</h3>
          {outputs.map((output, idx) => (
            <div key={idx} className="output-card">
              <div className="output-header">
                <strong>{output.recipient}</strong>
                <button onClick={() => removeOutput(idx)} className="btn-small">
                  Remove
                </button>
              </div>
              <div className="output-details">
                <p>Value: {output.value}</p>
                <p>
                  Lock: {output.lock.pkh.threshold}-of-{output.lock.pkh.pubkeys.length}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="action-buttons">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button
          onClick={buildTransaction}
          className="btn-primary"
          disabled={remaining !== 0 || outputs.length === 0}
        >
          Build Transaction →
        </button>
      </div>
    </div>
  );
};
