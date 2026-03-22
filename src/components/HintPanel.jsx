import React, { useState } from 'react';
import { PATTERN_THEORY } from '../constants/patterns';
import '../styles/challenge.css';

export default function HintPanel({ pattern, onPointsCost }) {
  const [open,      setOpen]      = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  const theory = PATTERN_THEORY[pattern];
  if (!theory) return null;

  const hints = [theory.hint1, theory.hint2, theory.hint3];

  function toggleHint() {
    if (!open) {
      setOpen(true);
      setHintLevel(1);
      // First hint is free
    }
  }

  function nextHint() {
    if (hintLevel < 3) {
      setHintLevel(prev => prev + 1);
      onPointsCost && onPointsCost(100);
    }
  }

  if (!open) {
    return (
      <button className="hint-toggle" onClick={toggleHint}>
        💡 Need a hint?
        <span className="hint-cost">(free)</span>
      </button>
    );
  }

  return (
    <div>
      <button
        className="hint-toggle"
        onClick={() => setOpen(false)}
      >
        💡 Hide hint
      </button>
      <div className="hint-panel">
        {hints.slice(0, hintLevel).map((hint, i) => (
          <div key={i} className="hint-text">
            <strong>Hint {i + 1}:</strong> {hint}
          </div>
        ))}
        {hintLevel < 3 && (
          <button className="btn-next-hint" onClick={nextHint}>
            Next hint
            <span className="hint-cost">(-100 pts)</span>
          </button>
        )}
        {hintLevel === 3 && (
          <div className="hint-text" style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
            No more hints — trust your analysis! 💪
          </div>
        )}
      </div>
    </div>
  );
}