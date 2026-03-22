import React, { useState } from 'react';
import HintPanel from './HintPanel';
import '../styles/challenge.css';

export default function PredictionPanel({
  answered,
  revealed,
  result,
  bonusResult,
  pattern,
  onPredict,
  onReveal,
  onBack,
  onPointsCost
}) {
  const [reasoning, setReasoning] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleReasoningSubmit() {
    if (!reasoning.trim()) return;
    onBack && onBack(reasoning);
    setSubmitted(true);
  }

  if (!answered) {
    return (
      <div className="prediction-panel">
        <HintPanel pattern={pattern} onPointsCost={onPointsCost} />
        <h3>Your Prediction — What happens next?</h3>
        <div className="prediction-buttons">
          <button
            className="btn-predict btn-bullish"
            onClick={() => onPredict('bullish')}
          >
            📈 Bullish
          </button>
          <button
            className="btn-predict btn-neutral-pred"
            onClick={() => onPredict('neutral')}
          >
            ➡️ Neutral
          </button>
          <button
            className="btn-predict btn-bearish"
            onClick={() => onPredict('bearish')}
          >
            📉 Bearish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prediction-panel">
      <div className="post-answer">

        {/* Reasoning box */}
        {!submitted && !bonusResult && (
          <div className="reasoning-wrap">
            <span className="reasoning-label">
              🎁 Explain your reasoning for bonus points
            </span>
            <div className="reasoning-input-row">
              <input
                className="reasoning-input"
                type="text"
                placeholder="e.g. Long lower wick after downtrend = buyers stepping in..."
                value={reasoning}
                onChange={e => setReasoning(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReasoningSubmit()}
              />
              <button
                className="btn-bonus"
                onClick={handleReasoningSubmit}
              >
                +Bonus
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="action-row">
          <button
            className="btn-run"
            onClick={onReveal}
            disabled={revealed}
          >
            {revealed ? '✅ Revealed' : '▶ RUN — See What Happened'}
          </button>
          {revealed && (
            <button className="btn-back-scenarios" onClick={onBack}>
              ← All Scenarios
            </button>
          )}
        </div>

        {/* Points feedback */}
        {result && (
          <div className={`points-feedback ${result.correct ? 'correct' : 'wrong'}`}>
            {result.correct ? '✅ +500 pts' : '❌ -300 pts'}
            {bonusResult && (
              <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>
                🎁 +{bonusResult.bonus_points} bonus
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}