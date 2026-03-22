import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const PATTERN_THEORY = {
  hammer: {
    name: "Hammer",
    signal: "Bullish Reversal",
    description: "A Hammer has a small body at the top with a long lower wick (at least 2x the body). It forms after a downtrend when sellers push prices down sharply but buyers step in strongly and push it back up.",
    reliability: "High when at support level with above-average volume",
    color: "#3fb950"
  },
  doji: {
    name: "Doji",
    signal: "Indecision",
    description: "A Doji forms when open and close prices are nearly equal. Long wicks on both sides show that both buyers and sellers tried to dominate but neither succeeded.",
    reliability: "Most reliable after extended trends with high volume",
    color: "#f0b429"
  },
  engulfing: {
    name: "Engulfing Pattern",
    signal: "Strong Reversal",
    description: "A Bullish Engulfing occurs when a green candle completely engulfs the previous red candle body. Buyers overpowered sellers completely.",
    reliability: "Very high — especially after a clear downtrend",
    color: "#3fb950"
  },
  shooting_star: {
    name: "Shooting Star",
    signal: "Bearish Reversal",
    description: "A Shooting Star has a small body at the bottom with a long upper wick. Forms after an uptrend when buyers push prices high but sellers reject those levels.",
    reliability: "High when at resistance level with above-average volume",
    color: "#f85149"
  },
  morning_star: {
    name: "Morning Star",
    signal: "Bullish Reversal",
    description: "A 3-candle pattern: large bearish candle, small indecision candle, large bullish candle. Confirms a trend reversal with multiple sessions of evidence.",
    reliability: "Very high — requires 3 candle confirmation",
    color: "#3fb950"
  }
};

function CandlestickChart({ candles, srLevels, revealCandles }) {
  const canvasRef = useRef(null);
  const safeSR = srLevels || [];
  const safeReveal = revealCandles || [];

  useEffect(() => {
    if (!candles || candles.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const volH = 70;
    const chartH = H - volH - 20;
    const padTop = 40;
    const padBot = 40;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const allCandles = [...candles, ...safeReveal];
    const allPrices = allCandles.flatMap(function(c) { return [c.high, c.low]; });
    const minPrice = Math.min.apply(null, allPrices);
    const maxPrice = Math.max.apply(null, allPrices);
    const priceRange = maxPrice - minPrice || 1;

    function toY(val) {
      return padTop + ((maxPrice - val) / priceRange) * (chartH - padTop - padBot);
    }

    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;
    for (var gi = 0; gi <= 5; gi++) {
      var gy = padTop + (chartH - padTop - padBot) * (gi / 5);
      var gp = maxPrice - (priceRange * gi / 5);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W - 65, gy);
      ctx.stroke();
      ctx.fillStyle = '#8b949e';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(gp.toFixed(0), W - 60, gy + 4);
    }

    safeSR.forEach(function(level) {
      var lineY = toY(level.price);
      if (lineY < padTop || lineY > chartH - padBot) return;
      ctx.strokeStyle = level.type === 'resistance' ? '#f8514933' : '#3fb95033';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(W - 65, lineY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = level.type === 'resistance' ? '#f85149' : '#3fb950';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        (level.type === 'resistance' ? 'R' : 'S') + ' ' + level.price,
        W - 67, lineY - 2
      );
    });

    var spacing = (W - 80) / allCandles.length;
    var candleW = Math.max(4, spacing - 3);
    var maxVol = Math.max.apply(null, allCandles.map(function(c) { return c.volume || 0; }));

    allCandles.forEach(function(candle, idx) {
      var cx = 20 + idx * spacing + spacing / 2;
      var barH = ((candle.volume || 0) / maxVol) * (volH - 10);
      var isBull = candle.close >= candle.open;
      var isReveal = idx >= candles.length;
      ctx.fillStyle = isReveal ? '#58a6ff44' : (isBull ? '#3fb95044' : '#f8514944');
      ctx.fillRect(cx - candleW / 2, H - barH - 5, candleW, barH);
    });

    ctx.fillStyle = '#484f58';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VOL', 4, H - 5);

    allCandles.forEach(function(candle, idx) {
      var cx = 20 + idx * spacing + spacing / 2;
      var openY = toY(candle.open);
      var closeY = toY(candle.close);
      var highY = toY(candle.high);
      var lowY = toY(candle.low);
      var isBull = candle.close >= candle.open;
      var isReveal = idx >= candles.length;
      var color = isReveal ? '#58a6ff' : (isBull ? '#3fb950' : '#f85149');

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, highY);
      ctx.lineTo(cx, lowY);
      ctx.stroke();

      var bodyTop = Math.min(openY, closeY);
      var bodyH = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(cx - candleW / 2, bodyTop, candleW, bodyH);
    });

    if (safeReveal.length > 0) {
      var divX = 20 + candles.length * spacing;
      ctx.strokeStyle = '#f0b429';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(divX, padTop);
      ctx.lineTo(divX, chartH - padBot);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f0b429';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PREDICTION DATE', divX + 50, padTop - 8);
    }

    if (candles.length > 1) {
      var fx = 20 + 0 * spacing + spacing / 2;
      var lx = 20 + (candles.length - 1) * spacing + spacing / 2;
      var fy = toY(candles[0].close);
      var ly = toY(candles[candles.length - 1].close);
      ctx.strokeStyle = '#f0b42966';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [candles, safeSR, safeReveal]);

  return (
    <canvas
      ref={canvasRef}
      width={750}
      height={400}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    />
  );
}

function HomeScreen({ onSelect }) {
  const [scenarios, setScenarios] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ attempted: 0, correct: 0 });

  useEffect(function() {
    fetchScenarios('all');
    var saved = localStorage.getItem('stocksensei_stats');
    if (saved) setSessionStats(JSON.parse(saved));
  }, []);

  function fetchScenarios(category) {
    setLoading(true);
    fetch(API + '/scenarios/category/' + category)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setScenarios(data.scenarios || []);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }

  function handleFilter(cat) {
    setFilter(cat);
    fetchScenarios(cat);
  }

  var categories = ['all', 'crash', 'rally', 'earnings', 'geopolitical'];
  var accuracy = sessionStats.attempted > 0
    ? Math.round((sessionStats.correct / sessionStats.attempted) * 100) : 0;

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-logo">📈 StockSensei</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>Learn to read real market charts</span>
          <div className="navbar-points">💰 {(10000 + sessionStats.correct * 500).toLocaleString()} pts</div>
        </div>
      </nav>
      <div className="home-screen">
        <div className="home-header">
          <h1>Market Scenarios</h1>
          <p>Real historical events from Indian markets. Study the chart, predict what happened next.</p>
        </div>
        <div className="home-stats">
          <div className="stat-card"><div className="stat-number">{scenarios.length || 30}</div><div className="stat-label">Scenarios</div></div>
          <div className="stat-card"><div className="stat-number">{sessionStats.attempted}</div><div className="stat-label">Attempted</div></div>
          <div className="stat-card"><div className="stat-number" style={{ color: accuracy >= 60 ? '#3fb950' : '#f85149' }}>{accuracy}%</div><div className="stat-label">Accuracy</div></div>
          <div className="stat-card"><div className="stat-number" style={{ color: '#3fb950' }}>{sessionStats.correct}</div><div className="stat-label">Correct</div></div>
        </div>
        <div className="filter-bar">
          {categories.map(function(cat) {
            return (
              <button key={cat} className={'filter-btn' + (filter === cat ? ' active' : '')} onClick={function() { handleFilter(cat); }}>
                {cat === 'all' ? '🌐 All' : cat === 'crash' ? '📉 Crash' : cat === 'rally' ? '📈 Rally' : cat === 'earnings' ? '📊 Earnings' : '🌍 Geopolitical'}
              </button>
            );
          })}
        </div>
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><p>Loading scenarios...</p></div>
        ) : (
          <table className="scenarios-table">
            <thead>
              <tr>
                <th>#</th><th>Stock</th><th>Date</th><th>Pattern</th><th>Category</th><th>Difficulty</th><th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(function(s, i) {
                return (
                  <tr key={s.id} onClick={function() { onSelect(s.id); }}>
                    <td style={{ color: '#484f58' }}>{i + 1}</td>
                    <td className="scenario-stock">{s.stock}</td>
                    <td style={{ color: '#8b949e', fontSize: '0.85rem' }}>{s.date}</td>
                    <td><span className="pattern-tag">{s.pattern ? s.pattern.replace('_', ' ') : ''}</span></td>
                    <td><span className={'category-badge ' + s.category}>{s.category}</span></td>
                    <td><span className={'difficulty-badge ' + s.difficulty}>{s.difficulty}</span></td>
                    <td className="institution-ref">{s.institution_reference ? s.institution_reference.split('—')[0].trim() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ChallengeScreen({ scenarioId, onBack, onUpdateStats }) {
  const [scenario, setScenario] = useState(null);
  const [candles, setCandles] = useState([]);
  const [revealCandles, setRevealCandles] = useState([]);
  const [srLevels, setSrLevels] = useState([]);
  const [trend, setTrend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [answered, setAnswered] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentThinking, setAgentThinking] = useState(false);
  const [reasoning, setReasoning] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [bonusResult, setBonusResult] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const messagesEndRef = useRef(null);

  var theory = scenario ? PATTERN_THEORY[scenario.pattern] : null;

  useEffect(function() {
    loadScenario();
  }, [scenarioId]);

  useEffect(function() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  function loadScenario() {
    setLoading(true);
    setRevealed(false);
    setRevealCandles([]);
    setAnswered(false);
    setResult(null);
    setBonusResult(null);
    setMessages([]);
    setShowReasoning(false);
    setStartTime(Date.now());

    fetch(API + '/scenario/' + scenarioId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setScenario(data);
        setCandles(data.candles || []);
        setSrLevels(data.support_resistance || []);
        setTrend(data.trend || null);
        setTimeout(function() {
          setMessages([{
            role: 'agent',
            text: '📅 ' + data.date + ' — ' + data.stock + '\n\n' + data.context + '\n\nStudy the chart carefully. What do you notice about the most recent candle on the right?'
          }]);
        }, 400);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }

  function sendMessage() {
    if (!inputText.trim() || agentThinking) return;
    var userMsg = inputText.trim();
    setInputText('');
    setMessages(function(prev) { return [...prev, { role: 'user', text: userMsg }]; });
    setAgentThinking(true);

    fetch(API + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMsg,
        pattern: scenario ? scenario.pattern : '',
        stock: scenario ? scenario.stock : '',
        scenario_context: scenario ? scenario.context : '',
        trend: trend ? trend.direction : '',
        history: messages,
        mode: 'teaching'
      })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setMessages(function(prev) { return [...prev, { role: 'agent', text: data.reply }]; });
        setAgentThinking(false);
      })
      .catch(function() {
        setMessages(function(prev) { return [...prev, { role: 'agent', text: 'Look at the relationship between the candle body and its wicks. What stands out to you?' }]; });
        setAgentThinking(false);
      });
  }

  function handlePrediction(prediction) {
    if (answered) return;
    setAnswered(true);
    var correct = prediction === scenario.correct_answer;
    var pointChange = correct ? 500 : -300;
    var timeTaken = Math.round((Date.now() - startTime) / 1000);

    setMessages(function(prev) { return [...prev, { role: 'user', text: 'My prediction: ' + prediction.toUpperCase() + ' 📊' }]; });

    setTimeout(function() {
      setMessages(function(prev) {
        return [...prev, {
          role: 'result',
          correct: correct,
          text: correct
            ? '✅ Correct! Now click RUN to see what actually happened in the real market.'
            : '❌ Not quite. Click RUN to see what actually happened — learning from real outcomes is the best teacher.'
        }];
      });
      setShowReasoning(true);
      setResult({ correct: correct, pointChange: pointChange });

      fetch(API + '/session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: localStorage.getItem('session_id') || 'anonymous',
          scenario_id: scenarioId,
          prediction: prediction,
          was_correct: correct,
          points_earned: pointChange,
          time_taken_seconds: timeTaken
        })
      }).catch(function() {});

      onUpdateStats(correct);
    }, 600);
  }

  function handleReveal() {
    if (revealed) return;
    setRevealed(true);
    fetch(API + '/scenario/' + scenarioId + '/reveal')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setRevealCandles(data.next_candles || []);
        setMessages(function(prev) {
          return [...prev, { role: 'agent', text: '📈 What actually happened:\n\n' + data.what_happened }];
        });
      })
      .catch(function() {});
  }

  function submitReasoning() {
    if (!reasoning.trim()) return;
    setMessages(function(prev) { return [...prev, { role: 'user', text: 'My reasoning: ' + reasoning }]; });

    fetch(API + '/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reasoning: reasoning,
        pattern: scenario ? scenario.pattern : '',
        is_correct: result ? result.correct : false
      })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setBonusResult(data);
        setMessages(function(prev) {
          return [...prev, { role: 'agent', text: data.evaluation + '\n\n🎁 Bonus: +' + data.bonus_points + ' points!' }];
        });
      })
      .catch(function() {});

    setShowReasoning(false);
    setReasoning('');
  }

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><p>Loading real market data...</p></div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{ background: 'none', border: '1px solid #30363d', borderRadius: '8px', padding: '4px 12px', color: '#8b949e', cursor: 'pointer', fontSize: '0.85rem' }}>← Back</button>
          <div className="navbar-logo">📈 StockSensei</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {trend && (
            <span style={{ color: trend.direction === 'uptrend' ? '#3fb950' : trend.direction === 'downtrend' ? '#f85149' : '#8b949e', fontSize: '0.85rem', fontWeight: 600 }}>
              {trend.direction === 'uptrend' ? '↑' : trend.direction === 'downtrend' ? '↓' : '→'} {trend.direction ? trend.direction.toUpperCase() : ''} ({trend.change_percent}%)
            </span>
          )}
        </div>
      </nav>

      <div className="main-layout">
        <div className="left-panel">
          <div className="chart-header">
            <div className="stock-info">
              <h2>{scenario ? scenario.stock : ''}</h2>
              <span>NSE • Nifty 50 • Daily Chart • {scenario ? scenario.date : ''}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {revealed && <span style={{ fontSize: '0.75rem', color: '#58a6ff', background: '#1f2d3d', padding: '3px 10px', borderRadius: '10px', border: '1px solid #58a6ff' }}>🔵 Reveal Mode</span>}
              <span className={'difficulty-badge ' + (scenario ? scenario.difficulty : '')}>{scenario ? scenario.difficulty : ''}</span>
            </div>
          </div>

          <div className="description-panel">
            <h3>📋 Scenario Context</h3>
            <div className="scenario-context-box">{scenario ? scenario.context : ''}</div>
            {theory && (
              <div className="pattern-theory">
                <strong>{theory.name}</strong> — <span style={{ color: theory.color }}>{theory.signal}</span><br />
                {theory.description}<br /><br />
                <strong>Reliability:</strong> {theory.reliability}
              </div>
            )}
            {scenario && scenario.institution_reference && (
              <div className="institution-box">📚 Studied by: {scenario.institution_reference}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', padding: '6px 20px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: '0.75rem' }}>
            <span style={{ color: '#f85149' }}>— Resistance</span>
            <span style={{ color: '#3fb950' }}>— Support</span>
            <span style={{ color: '#f0b429' }}>— Trend Line</span>
            <span style={{ color: '#8b949e' }}>▪ Volume</span>
          </div>

          <div className="chart-container">
            <CandlestickChart candles={candles} srLevels={srLevels} revealCandles={revealCandles} />
          </div>

          <div className="prediction-panel">
            {!answered ? (
              <div>
                <h3>Your Prediction — What happens next?</h3>
                <div className="prediction-buttons">
                  <button className="btn-bullish" onClick={function() { handlePrediction('bullish'); }}>📈 Bullish</button>
                  <button className="btn-neutral" onClick={function() { handlePrediction('neutral'); }}>➡️ Neutral</button>
                  <button className="btn-bearish" onClick={function() { handlePrediction('bearish'); }}>📉 Bearish</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {showReasoning && !bonusResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3>Explain your reasoning for bonus points 🎁</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="e.g. Long lower wick after downtrend = buyers stepping in..." value={reasoning} onChange={function(e) { setReasoning(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') submitReasoning(); }} style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', borderRadius: '8px', padding: '8px 14px', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }} />
                      <button onClick={submitReasoning} style={{ background: '#f0b429', border: 'none', borderRadius: '8px', padding: '8px 16px', color: '#0d1117', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>+Bonus</button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleReveal} disabled={revealed} style={{ flex: 1, padding: '10px', background: revealed ? '#21262d' : '#1f6feb', border: 'none', borderRadius: '8px', color: revealed ? '#484f58' : 'white', fontWeight: 700, fontSize: '0.95rem', cursor: revealed ? 'not-allowed' : 'pointer' }}>
                    {revealed ? '✅ Revealed' : '▶ RUN — See What Happened'}
                  </button>
                  {revealed && (
                    <button onClick={onBack} style={{ flex: 1, padding: '10px', background: '#238636', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>← Back to Scenarios</button>
                  )}
                </div>
                {result && (
                  <div style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: result.correct ? '#3fb950' : '#f85149' }}>
                    {result.correct ? '✅ +500 pts' : '❌ -300 pts'}
                    {bonusResult && <span style={{ color: '#f0b429', marginLeft: '8px' }}>🎁 +{bonusResult.bonus_points} bonus</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="agent-header">
            <div className="agent-avatar">🤖</div>
            <div><h3>Sensei</h3><span>● AI Trading Coach — Real Market Scenarios</span></div>
          </div>
          <div className="chat-messages">
            {messages.map(function(msg, i) {
              return (
                <div key={i} className={'message ' + (msg.role === 'agent' ? 'message-agent' : msg.role === 'result' ? ('message-result ' + (msg.correct ? '' : 'wrong')) : 'message-user')}>
                  {msg.role === 'agent' && <div className="avatar-sm">🤖</div>}
                  <div className="bubble" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                </div>
              );
            })}
            {agentThinking && (
              <div className="message message-agent">
                <div className="avatar-sm">🤖</div>
                <div className="bubble" style={{ color: '#8b949e' }}>Sensei is thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area">
            <input type="text" placeholder="Ask Sensei about this chart..." value={inputText} onChange={function(e) { setInputText(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') sendMessage(); }} disabled={agentThinking} />
            <button className="btn-send" onClick={sendMessage} disabled={agentThinking || !inputText.trim()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [sessionStats, setSessionStats] = useState({ attempted: 0, correct: 0 });

  useEffect(function() {
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', 'sess_' + Math.random().toString(36).substr(2, 9));
    }
    var saved = localStorage.getItem('stocksensei_stats');
    if (saved) setSessionStats(JSON.parse(saved));
  }, []);

  function handleSelect(id) {
    setSelectedId(id);
    setScreen('challenge');
  }

  function handleBack() {
    setScreen('home');
    setSelectedId(null);
  }

  function handleUpdateStats(correct) {
    setSessionStats(function(prev) {
      var updated = { attempted: prev.attempted + 1, correct: prev.correct + (correct ? 1 : 0) };
      localStorage.setItem('stocksensei_stats', JSON.stringify(updated));
      return updated;
    });
  }

  if (screen === 'home') {
    return <HomeScreen onSelect={handleSelect} />;
  }

  return <ChallengeScreen scenarioId={selectedId} onBack={handleBack} onUpdateStats={handleUpdateStats} />;
}