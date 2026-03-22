import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import CandlestickChart from './CandlestickChart';
import SenseiChat from './SenseiChat';
import PredictionPanel from './PredictionPanel';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function ChallengeScreen({
  scenarioId,
  onBack,
  onUpdateStats,
  points
}) {
  const [scenario,      setScenario]      = useState(null);
  const [candles,       setCandles]       = useState([]);
  const [revealCandles, setRevealCandles] = useState([]);
  const [srLevels,      setSrLevels]      = useState([]);
  const [trend,         setTrend]         = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [inputText,     setInputText]     = useState('');
  const [answered,      setAnswered]      = useState(false);
  const [revealed,      setRevealed]      = useState(false);
  const [result,        setResult]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [agentThinking, setAgentThinking] = useState(false);
  const [bonusResult,   setBonusResult]   = useState(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    loadScenario();
  }, [scenarioId]);

  function loadScenario() {
    setLoading(true);
    setRevealed(false);
    setRevealCandles([]);
    setAnswered(false);
    setResult(null);
    setBonusResult(null);
    setMessages([]);
    startTimeRef.current = Date.now();

    fetch(`${API}/scenario/${scenarioId}`)
      .then(res => res.json())
      .then(data => {
        setScenario(data);
        setCandles(data.candles || []);
        setSrLevels(data.support_resistance || []);
        setTrend(data.trend || null);
        setTimeout(() => {
          setMessages([{
            role: 'agent',
            text: `📅 ${data.date} — ${data.stock}\n\n${data.context}\n\nStudy the chart carefully. What do you notice about the most recent candle on the right?`
          }]);
        }, 400);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function sendMessage() {
    if (!inputText.trim() || agentThinking) return;
    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAgentThinking(true);

    fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:          userMsg,
        pattern:          scenario?.pattern  || '',
        stock:            scenario?.stock    || '',
        scenario_context: scenario?.context  || '',
        trend:            trend?.direction   || '',
        history:          messages,
        mode: revealed ? 'explanation' : 'teaching'
      })
    })
      .then(res => res.json())
      .then(data => {
        setMessages(prev => [...prev, { role: 'agent', text: data.reply }]);
        setAgentThinking(false);
      })
      .catch(() => {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: 'Look at the relationship between the candle body and its wicks. What stands out to you?'
        }]);
        setAgentThinking(false);
      });
  }

  function handlePrediction(prediction) {
    if (answered) return;
    setAnswered(true);
    const correct     = prediction === scenario.correct_answer;
    const pointChange = correct ? 500 : -300;
    const timeTaken   = Math.round((Date.now() - startTimeRef.current) / 1000);

    setMessages(prev => [...prev, {
      role: 'user',
      text: `My prediction: ${prediction.toUpperCase()} 📊`
    }]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role:    'result',
        correct,
        text: correct
          ? ' Correct! Now click RUN to see what actually happened in the real market.'
          : ' Not quite. Click RUN to see what actually happened — learning from real outcomes is the best teacher.'
      }]);
    }, 600);

    setResult({ correct, pointChange });
    onUpdateStats(correct);

    fetch(`${API}/session/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id:         localStorage.getItem('session_id') || 'anonymous',
        scenario_id:        scenarioId,
        prediction,
        was_correct:        correct,
        points_earned:      pointChange,
        time_taken_seconds: timeTaken
      })
    }).catch(() => {});
  }

  function handleReveal() {
  if (revealed) return;
  setRevealed(true);

  fetch(`${API}/scenario/${scenarioId}/reveal`)
    .then(res => res.json())
    .then(data => {
      const nextCandles = data.next_candles || [];

      // Animate candles in one by one
      nextCandles.forEach((candle, i) => {
        setTimeout(() => {
          setRevealCandles(prev => [...prev, candle]);
        }, i * 180);
      });

      // Show what actually happened
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `📈 What actually happened:\n\n${data.what_happened}`
        }]);
      }, nextCandles.length * 180 + 200);

      // Switch to explanation mode
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `Now that you've seen the real outcome — ask me anything! Why did this pattern work? What confirmed it? What should you watch for next time? I'll explain everything fully now. 🎓`
        }]);
      }, nextCandles.length * 180 + 1200);
    })
    .catch(() => {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: 'Loading real market outcome...'
      }]);
    });
}

  function handleReasoning(reasoning) {
    if (!reasoning?.trim()) return;

    setMessages(prev => [...prev, {
      role: 'user',
      text: `My reasoning: ${reasoning}`
    }]);

    fetch(`${API}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reasoning,
        pattern:    scenario?.pattern,
        is_correct: result?.correct
      })
    })
      .then(res => res.json())
      .then(data => {
        setBonusResult(data);
        setMessages(prev => [...prev, {
          role: 'agent',
          text: `${data.evaluation}\n\n🎁 Bonus: +${data.bonus_points} points for quality thinking!`
        }]);
      })
      .catch(() => {});
  }

  function handlePointsCost(amount) {
    onUpdateStats && onUpdateStats(false, -amount);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading real market data...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar
        trend={trend}
        points={points}
        showBack={true}
        onBack={onBack}
      />

      <div className="challenge-layout">
        {/* LEFT — Chart + Prediction */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <CandlestickChart
            candles={candles}
            srLevels={srLevels}
            revealCandles={revealCandles}
            difficulty={scenario?.difficulty}
            stock={scenario?.stock}
            date={scenario?.date}
          />

          <PredictionPanel
            answered={answered}
            revealed={revealed}
            result={result}
            bonusResult={bonusResult}
            pattern={scenario?.pattern}
            onPredict={handlePrediction}
            onReveal={handleReveal}
            onBack={answered && revealed ? onBack : handleReasoning}
            onPointsCost={handlePointsCost}
          />
        </div>

        {/* RIGHT — Description + Chat */}
        <SenseiChat
          scenario={scenario}
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          onSend={sendMessage}
          agentThinking={agentThinking}
        />
      </div>
    </div>
  );
}