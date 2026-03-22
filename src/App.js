import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import ChallengeScreen from './components/ChallengeScreen';

export default function App() {
  const [screen,       setScreen]       = useState('home');
  const [selectedId,   setSelectedId]   = useState(null);
  const [sessionStats, setSessionStats] = useState({ attempted: 0, correct: 0 });
  const [points,       setPoints]       = useState(10000);

  useEffect(() => {
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem(
        'session_id',
        'sess_' + Math.random().toString(36).substr(2, 9)
      );
    }
    const saved = localStorage.getItem('stocksensei_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessionStats(parsed);
      setPoints(10000 + parsed.correct * 500);
    }
  }, []);

  function handleSelect(id) {
    setSelectedId(id);
    setScreen('challenge');
  }

  function handleBack() {
    setScreen('home');
    setSelectedId(null);
  }

  function handleUpdateStats(correct, bonusDelta) {
    setSessionStats(prev => {
      const updated = {
        attempted: prev.attempted + (bonusDelta ? 0 : 1),
        correct:   prev.correct   + (correct && !bonusDelta ? 1 : 0)
      };
      localStorage.setItem('stocksensei_stats', JSON.stringify(updated));
      return updated;
    });
    setPoints(prev => {
      if (bonusDelta) return prev + bonusDelta;
      return prev + (correct ? 500 : -300);
    });
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        onSelect={handleSelect}
        sessionStats={sessionStats}
      />
    );
  }

  return (
    <ChallengeScreen
      scenarioId={selectedId}
      onBack={handleBack}
      onUpdateStats={handleUpdateStats}
      points={points}
    />
  );
}