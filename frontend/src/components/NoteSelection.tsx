import React, { useState } from 'react';
import type { Note, Lock } from '../types/nockchain';

interface NoteSelectionProps {
  onNotesSelected: (notes: Note[]) => void;
}

export const NoteSelection: React.FC<NoteSelectionProps> = ({ onNotesSelected }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());

  // Form state for adding a new note
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [value, setValue] = useState('');
  const [threshold, setThreshold] = useState('2');
  const [pubkeys, setPubkeys] = useState<string[]>(['', '']);

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

  const addNote = () => {
    const validPubkeys = pubkeys.filter(pk => pk.trim() !== '');
    
    if (!firstName || !lastName || !value || validPubkeys.length === 0) {
      alert('Please fill all fields and add at least one public key');
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

    const note: Note = {
      name: { first: firstName, last: lastName },
      value: parseInt(value),
      lock,
    };

    setNotes([...notes, note]);
    
    // Reset form
    setFirstName('');
    setLastName('');
    setValue('');
    setThreshold('2');
    setPubkeys(['', '']);
  };

  const toggleNoteSelection = (index: number) => {
    const updated = new Set(selectedNotes);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setSelectedNotes(updated);
  };

  const confirmSelection = () => {
    const selected = notes.filter((_, idx) => selectedNotes.has(idx));
    if (selected.length === 0) {
      alert('Please select at least one note');
      return;
    }
    onNotesSelected(selected);
  };

  return (
    <div className="note-selection">
      <h2>Step 1: Select Notes to Spend</h2>
      
      <div className="add-note-form">
        <h3>Add a Note</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="multisig-config">
          <h4>Multisig Configuration</h4>
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

        <button onClick={addNote} className="btn-primary">
          Add Note
        </button>
      </div>

      {notes.length > 0 && (
        <div className="notes-list">
          <h3>Available Notes</h3>
          <div className="notes-grid">
            {notes.map((note, idx) => (
              <div
                key={idx}
                className={`note-card ${selectedNotes.has(idx) ? 'selected' : ''}`}
                onClick={() => toggleNoteSelection(idx)}
              >
                <div className="note-header">
                  <input
                    type="checkbox"
                    checked={selectedNotes.has(idx)}
                    onChange={() => {}}
                  />
                  <strong>
                    [{note.name.first}, {note.name.last}]
                  </strong>
                </div>
                <div className="note-details">
                  <p>Value: {note.value}</p>
                  <p>
                    Multisig: {note.lock.pkh.threshold}-of-{note.lock.pkh.pubkeys.length}
                  </p>
                  <details>
                    <summary>Public Keys</summary>
                    <ul>
                      {note.lock.pkh.pubkeys.map((pk, i) => (
                        <li key={i} className="pubkey-display">
                          {pk.value.substring(0, 20)}...
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={confirmSelection}
            className="btn-primary"
            disabled={selectedNotes.size === 0}
          >
            Proceed with {selectedNotes.size} Selected Note(s)
          </button>
        </div>
      )}
    </div>
  );
};
