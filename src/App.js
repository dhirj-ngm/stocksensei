import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API = 'http://localhost:8000';

// ── Pattern Theory Database ───────────────────────────────────────────────────
const PATTERN_THEORY = {
  hammer: {
    name: "Hammer",
    signal: "Bullish Reversal",
    description: "A Hammer has a small body at the top with a long lower wick (at least 2x the body). It forms after a downtrend when sellers push prices down sharply but buyers step in strongly and push it back up. The long lower wick shows buyer strength.",
    reliability: "High when at support level with above-average volume",
    color: "#3fb950"
  },
  doji: {
    name: "Doji",
    signal: "Indecision",
    description: "A Doji forms when open and close prices are nearly equal. Long wicks on both sides show that both buyers and sellers tried to dominate but neither succeeded. It signals a pause or potential reversal in the current trend.",
    reliability: "Most reliable after extended trends with high volume",
    color: "#f0b429"
  },
  engulfing: {
    name: "Engulfing Pattern",
    signal: "Strong Reversal",
    description: "A Bullish Engulfing occurs when a green candle completely engulfs the previous red candle's body. It means buyers overpowered sellers so completely that they reversed the entire previous move. One of the strongest reversal signals.",
    reliability: "Very high — especially after a clear downtrend",
    color: "#3fb950"
  },
  shooting_star: {
    name: "Shooting Star",
    signal: "Bearish Reversal",
    description: "A Shooting Star has a small body at the bottom with a long upper wick. It forms after an uptrend when buyers push prices high but sellers reject those levels and push it back down. The long upper wick shows seller strength.",
    reliability: "High when at resistance level with above-average volume",
    color: "#f85149"
  },
  morning_star: {
    name: "Morning Star",
    signal: "Bullish Reversal",
    description: "A 3-candle pattern: large bearish candle, small indecision candle (gap down), large bullish candle. Confirms a trend reversal with multiple sessions of evidence. More reliable than single-candle patterns.",
    reliability: "Very high — requires 3 candle confirmation",
    color: "#3fb950"
  }
};

// ── Candlestick Chart ─────────────────────────────────────────────────────────
function CandlestickChart({ candles, srLevels = [], revealCandles = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!candles || candles.length === 0) return;
    const canvas  = canvasRef.current;
    const ctx     = canvas.getContext('2d');
    const W       = canvas.width;
    const H       = canvas.height;
    const volumeH = 70;
    const chartH  = H - volumeH - 20;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const allCandles = [...candles, ...revealCandles];
    const prices = allCandles.flatMap(c => [c.high, c.low]);
    const minP   = Math.min(...prices);
    const maxP   = Math.max(...prices);
    const range  = maxP - minP || 1;
    const pad    = 40;

    const toY = p => pad + ((maxP - p) / range) * (chartH - pad * 2);

    // Grid
    ctx.strokeStyle = '#21262d';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 5; i++) {
      const y     = pad + (chartH - pad * 2) * (i / 5);
      const price = maxP - (range * i / 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W - 65, y);
      ctx.stroke();
      ctx.fillStyle  = '#8b949e';
      ctx.font       = '10px monospace';
      ctx.textAlign  = 'left';
      ctx.fillText(price.toFixed(0), W - 60, y + 4);
    }

    // S&R Lines
    srLevels.forEach(level => {
      const y = toY(level.price);
      if (y < pad || y > chartH - pad) return;
      ctx.strokeStyle = level.type === 'resistance' ? '#f8514933' : '#3fb95033';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W - 65, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle  = level.type === 'resistance' ? '#f85149' : '#3fb950';
      ctx.font       = '9px monospace';
      ctx.textAlign  = 'right';
      ctx.fillText(
        `${level.type === 'resistance' ? 'R' : 'S'} ${level.price}`,
        W - 67, y - 2
      );
    });

    const spacing = (W - 80) / allCandles.length;
    const candleW = Math.max(4, spacing - 3);

    // Volume bars
    const maxVol = Math.max(...allCandles.map(c => c.volume || 0));
    allCandles.forEach((c, i) => {
      const x    = 20 + i * spacing + spacing / 2;
      const volH = ((c.volume || 0) / maxVol) * (volumeH - 10);
      ctx.fillStyle = i >= candles.length
        ? '#58a6ff44'
        : (c.close >= c.open ? '#3fb95044' : '#f8514944');
      ctx.fillRect(x - candleW / 2, H - volH - 5, candleW, volH);
    });
    ctx.fillStyle = '#484f58';
    ctx.font      = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VOL', 4, H - 5);

    // Candles
    allCandles.forEach((c, i) => {
      const x        = 20 + i * spacing + spacing / 2;
      const openY    = toY(c.open);
      const closeY   = toY(c.close);
      const highY    = toY(c.high);
      const lowY     = toY(c.low);
      const bull     = c.close >= c.open;
      const isReveal = i >= candles.length;
      const color    = isReveal ? '#58a6ff' : bull ? '#3fb950' : '#f85149';

      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      const bodyTop = Math.min(openY, closeY);
      const bodyH   = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    });

    // Prediction divider
    if (revealCandles.length > 0) {
      const divX = 20 + candles.length * spacing;
      ctx.strokeStyle = '#f0b429';
      ctx.lineWidth   = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(divX, pad);
      ctx.lineTo(divX, chartH - pad);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle  = '#f0b429';
      ctx.font       = 'bold 10px monospace';
      ctx.textAlign  = 'center';
      ctx.fillText('← PREDICTION DATE →', divX + 60, pad - 8);
    }

    // Trend line
    if (candles.length > 1) {
      const fx = 20 + 0 * spacing + spacing / 2;
      const lx = 20 + (candles.length - 1) * spacing + spacing / 2;
      const fy = toY(candles[0].close);
      const ly = toY(candles[candles.length - 1].close);
      ctx.strokeStyle = '#f0b42966';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [candles, srLevels, revealCandles]);

  return (
    <canvas
      ref={canvasRef}
      width={750}
      height={400}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    />
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────
function HomeScreen({ onSelect }) {
  const [scenarios, setScenarios]     = useState([]);
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(true);
  const [sessionStats, setSessionStats] = useState({
    attempted: 0, correct: 0
  });

  useEffect(() => {
    fetchScenarios('all');
    const saved = localStorage.getItem('stocksensei_stats');
    if (saved) setSessionStats(JSON.parse(saved));
  }, []);

  const fetchScenarios = async (category) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/scenarios/category/${category}`);
      const data = await res.json();
      setScenarios(data.scenarios || []);
    } catch {
      console.error('Failed to fetch scenarios');
    }
    setLoading(false);
  };

  const handleFilter = (cat) => {
    setFilter(cat);
    fetchScenarios(cat);
  };

  const categories = ['all', 'crash', 'rally', 'earnings', 'geopolitical'];
  const accuracy   = sessionStats.attempted > 0
    ? Math.round((sessionStats.correct / sessionStats.attempted) * 100)
    : 0;

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-logo">📈 StockSensei</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>
            Learn to read real market charts
          </span>
          <div className="navbar-points">
            💰 {(10000 + sessionStats.correct * 500).toLocaleString()} pts
          </div>
        </div>
      </nav>

      <div className="home-screen">
        <div className="home-header">
          <h1>Market Scenarios</h1>
          <p>
            Real historical events from Indian markets.
            Study the chart, predict what happened next.
          </p>
        </div>

        {/* Stats */}
        <div className="home-stats">
          <div className="stat-card">
            <div className="stat-number">{scenarios.length || 30}</div>
            <div className="stat-label">Scenarios</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{sessionStats.attempted}</div>
            <div className="stat-label">Attempted</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{
              color: accuracy >= 60 ? '#3fb950' : '#f85149'
            }}>
              {accuracy}%
            </div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#3fb950' }}>
              {sessionStats.correct}
            </div>
            <div className="stat-label">Correct</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => handleFilter(cat)}
            >
              {cat === 'all'         ? '🌐 All'
               : cat === 'crash'    ? '📉 Crash'
               : cat === 'rally'    ? '📈 Rally'
               : cat === 'earnings' ? '📊 Earnings'
               : '🌍 Geopolitical'}
            </button>
          ))}
        </div>

        {/* Scenarios Table */}
        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            <p>Loading scenarios...</p>
          </div>
        ) : (
          <table className="scenarios-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Stock</th>
                <th>Date</th>
                <th>Pattern</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={s.id} onClick={() => onSelect(s.id)}>
                  <td style={{ color: '#484f58' }}>{i + 1}</td>
                  <td className="scenario-stock">{s.stock}</td>
                  <td style={{ color: '#8b949e', fontSize: '0.85rem' }}>
                    {s.date}
                  </td>
                  <td>
                    <span className="pattern-tag">
                      {s.pattern?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`category-badge ${s.category}`}>
                      {s.category}
                    </span>
                  </td>
                  <td>
                    <span className={`difficulty-badge ${s.difficulty}`}>
                      {s.difficulty}
                    </span>
                  </td>
                  <td className="institution-ref">
                    {s.institution_reference?.split('—')[0]?.trim() || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Challenge Screen ──────────────────────────────────────────────────────────
function ChallengeScreen({ scenarioId, onBack, onUpdateStats }) {
  const [scenario,       setScenario]       = useState(null);
  const [candles,        setCandles]        = useState([]);
  const [revealCandles,  setRevealCandles]  = useState([]);
  const [srLevels,       setSrLevels]       = useState([]);
  const [trend,          setTrend]          = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [inputText,      setInputText]      = useState('');
  const [answered,       setAnswered]       = useState(false);
  const [revealed,       setRevealed]       = useState(false);
  const [result,         setResult]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [agentThinking,  setAgentThinking]  = useState(false);
  const [reasoning,      setReasoning]      = useState('');
  const [showReasoning,  setShowReasoning]  = useState(false);
  const [bonusResult,    setBonusResult]    = useState(null);
  const [startTime,      setStartTime]      = useState(null);
  const messagesEndRef = useRef(null);

  const theory = scenario ? PATTERN_THEORY[scenario.pattern] : null;

  useEffect(() => {
    loadScenario();
  }, [scenarioId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadScenario = async () => {
    setLoading(true);
    setRevealed(false);
    setRevealCandles([]);
    setAnswered(false);
    setResult(null);
    setBonusResult(null);
    setMessages([]);
    setShowReasoning(false);
    setStartTime(Date.now());

    try {
      const res  = await fetch(`${API}/scenario/${scenarioId}`);
      const data = await res.json();
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
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || agentThinking) return;
    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAgentThinking(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:          userMsg,
          pattern:          scenario?.pattern || '',
          stock:            scenario?.stock   || '',
          scenario_context: scenario?.context || '',
          trend:            trend?.direction  || '',
          history:          messages,
          mode:             'teaching'
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'agent', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: 'Look at the relationship between the candle body and its wicks. What stands out to you?'
      }]);
    }
    setAgentThinking(false);
  };

  const handlePrediction = async (prediction) => {
    if (answered) return;
    setAnswered(true);
    const correct     = prediction === scenario.correct_answer;
    const pointChange = correct ? 500 : -300;
    const timeTaken   = Math.round((Date.now() - startTime) / 1000);

    setMessages(prev => [...prev,
      { role: 'user', text: `My prediction: ${prediction.toUpperCase()} 📊` }
    ]);

    setAgentThinking(true);
    await new Promise(r => setTimeout(r, 600));
    setMessages(prev => [...prev, {
      role:    'result',
      correct,
      text: correct
        ? `✅ Correct! Now click RUN to see what actually happened in the real market.`
        : `❌ Not quite. Click RUN to see what actually happened — learning from real outcomes is the best teacher.`
    }]);
    setAgentThinking(false);
    setShowReasoning(true);
    setResult({ correct, pointChange });

    // Save to Supabase analytics
    try {
      await fetch(`${API}/session/save`, {
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
      });
    } catch {}

    onUpdateStats(correct);
  };

  const handleReveal = async () => {
    if (revealed) return;
    setRevealed(true);
    try {
      const res  = await fetch(`${API}/scenario/${scenarioId}/reveal`);
      const data = await res.json();
      setRevealCandles(data.next_candles || []);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: `📈 What actually happened:\n\n${data.what_happened}`
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: 'Loading real market outcome...'
      }]);
    }
  };

  const submitReasoning = async () => {
    if (!reasoning.trim()) return;
    setMessages(prev => [...prev, {
      role: 'user',
      text: `My reasoning: ${reasoning}`
    }]);

    try {
      const res = await fetch(`${API}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reasoning,
          pattern:    scenario?.pattern,
          is_correct: result?.correct
        })
      });
      const data = await res.json();
      setBonusResult(data);
      setMessages(prev => [...prev, {
        role: 'agent',
        text: `${data.evaluation}\n\n🎁 Bonus: +${data.bonus_points} points for quality thinking!`
      }]);

      // Save reasoning to Supabase
      await fetch(`${API}/session/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id:   localStorage.getItem('session_id') || 'anonymous',
          scenario_id:  scenarioId,
          reasoning,
          bonus_points: data.bonus_points
        })
      });
    } catch {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: 'Good reasoning! Keep thinking like a trader.'
      }]);
    }
    setShowReasoning(false);
    setReasoning('');
  };

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
      {/* NAVBAR */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: '1px solid #30363d',
              borderRadius: '8px', padding: '4px 12px',
              color: '#8b949e', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            ← Back
          </button>
          <div className="navbar-logo">📈 StockSensei</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {trend && (
            <span style={{
              color: trend.direction === 'uptrend' ? '#3fb950'
                : trend.direction === 'downtrend' ? '#f85149' : '#8b949e',
              fontSize: '0.85rem', fontWeight: 600
            }}>
              {trend.direction === 'uptrend' ? '↑'
                : trend.direction === 'downtrend' ? '↓' : '→'}
              {' '}{trend.direction?.toUpperCase()} ({trend.change_percent}%)
            </span>
          )}
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <div className="main-layout">
        {/* LEFT */}
        <div className="left-panel">

          {/* Chart header */}
          <div className="chart-header">
            <div className="stock-info">
              <h2>{scenario?.stock}</h2>
              <span>NSE • Nifty 50 • Daily Chart • {scenario?.date}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {revealed && (
                <span style={{
                  fontSize: '0.75rem', color: '#58a6ff',
                  background: '#1f2d3d', padding: '3px 10px',
                  borderRadius: '10px', border: '1px solid #58a6ff'
                }}>
                  🔵 Reveal Mode
                </span>
              )}
              <span className={`difficulty-badge ${scenario?.difficulty}`}>
                {scenario?.difficulty}
              </span>
            </div>
          </div>

          {/* Description panel */}
          <div className="description-panel">
            <h3>📋 Scenario Context</h3>
            <div className="scenario-context-box">
              {scenario?.context}
            </div>
            {theory && (
              <div className="pattern-theory">
                <strong>{theory.name}</strong> —
                <span style={{ color: theory.color }}> {theory.signal}</span>
                <br />
                {theory.description}
                <br /><br />
                <strong>Reliability:</strong> {theory.reliability}
              </div>
            )}
            {scenario?.institution_reference && (
              <div className="institution-box">
                📚 Studied by: {scenario.institution_reference}
              </div>
            )}
          </div>

          {/* S&R Legend */}
          <div style={{
            display: 'flex', gap: '16px', padding: '6px 20px',
            background: '#161b22', borderBottom: '1px solid #30363d',
            fontSize: '0.75rem'
          }}>
            <span style={{ color: '#f85149' }}>— Resistance</span>
            <span style={{ color: '#3fb950' }}>— Support</span>
            <span style={{ color: '#f0b429' }}>— Trend Line</span>
            <span style={{ color: '#8b949e' }}>▪ Volume</span>
          </div>

          <div className="chart-container">
            <CandlestickChart
              candles={candles}
              srLevels={srLevels}
              revealCandles={revealCandles}
            />
          </div>

          {/* Prediction panel */}
          <div className="prediction-panel">
            {!answered ? (
              <>
                <h3>Your Prediction — What happens next?</h3>
                <div className="prediction-buttons">
                  <button className="btn-bullish"
                    onClick={() => handlePrediction('bullish')}>
                    📈 Bullish
                  </button>
                  <button className="btn-neutral"
                    onClick={() => handlePrediction('neutral')}>
                    ➡️ Neutral
                  </button>
                  <button className="btn-bearish"
                    onClick={() => handlePrediction('bearish')}>
                    📉 Bearish
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {showReasoning && !bonusResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3>Explain your reasoning for bonus points 🎁</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="e.g. Long lower wick after downtrend = buyers stepping in..."
                        value={reasoning}
                        onChange={e => setReasoning(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitReasoning()}
                        style={{
                          flex: 1, background: '#21262d',
                          border: '1px solid #30363d', borderRadius: '8px',
                          padding: '8px 14px', color: '#e6edf3',
                          fontSize: '0.85rem', outline: 'none'
                        }}
                      />
                      <button onClick={submitReasoning} style={{
                        background: '#f0b429', border: 'none',
                        borderRadius: '8px', padding: '8px 16px',
                        color: '#0d1117', fontWeight: 700,
                        cursor: 'pointer', fontSize: '0.85rem'
                      }}>
                        +Bonus
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleReveal}
                    disabled={revealed}
                    style={{
                      flex: 1, padding: '10px',
                      background: revealed ? '#21262d' : '#1f6feb',
                      border: 'none', borderRadius: '8px',
                      color: revealed ? '#484f58' : 'white',
                      fontWeight: 700, fontSize: '0.95rem',
                      cursor: revealed ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {revealed ? '✅ Revealed' : '▶ RUN — See What Happened'}
                  </button>
                  {revealed && (
                    <button onClick={onBack} style={{
                      flex: 1, padding: '10px',
                      background: '#238636', border: 'none',
                      borderRadius: '8px', color: 'white',
                      fontWeight: 700, fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}>
                      ← Back to Scenarios
                    </button>
                  )}
                </div>
                {result && (
                  <div style={{
                    textAlign: 'center', fontSize: '0.9rem',
                    fontWeight: 600,
                    color: result.correct ? '#3fb950' : '#f85149'
                  }}>
                    {result.correct ? '✅ +500 pts' : '❌ -300 pts'}
                    {bonusResult && (
                      <span style={{ color: '#f0b429', marginLeft: '8px' }}>
                        🎁 +{bonusResult.bonus_points} bonus
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Sensei */}
        <div className="right-panel">
          <div className="agent-header">
            <div className="agent-avatar">🤖</div>
            <div>
              <h3>Sensei</h3>
              <span>● AI Trading Coach — Real Market Scenarios</span>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${
                msg.role === 'agent' ? 'message-agent' :
                msg.role === 'result'
                  ? `message-result ${msg.correct ? '' : 'wrong'}`
                  : 'message-user'
              }`}>
                {msg.role === 'agent' && <div className="avatar-sm">🤖</div>}
                <div className="bubble" style={{ whiteSpace: 'pre-line' }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {agentThinking && (
              <div className="message message-agent">
                <div className="avatar-sm">🤖</div>
                <div className="bubble" style={{ color: '#8b949e' }}>
                  Sensei is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask Sensei about this chart..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={agentThinking}
            />
            <button
              className="btn-send"
              onClick={sendMessage}
              disabled={agentThinking || !inputText.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,       setScreen]       = useState('home');
  const [selectedId,   setSelectedId]   = useState(null);
  const [sessionStats, setSessionStats] = useState({ attempted: 0, correct: 0 });

  // Generate session ID once
  useEffect(() => {
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id',
        'sess_' + Math.random().toString(36).substr(2, 9));
    }
    const saved = localStorage.getItem('stocksensei_stats');
    if (saved) setSessionStats(JSON.parse(saved));
  }, []);

  const handleSelect = (id) => {
    setSelectedId(id);
    setScreen('challenge');
  };

  const handleBack = () => {
    setScreen('home');
    setSelectedId(null);
  };

  const handleUpdateStats = (correct) => {
    setSessionStats(prev => {
      const updated = {
        attempted: prev.attempted + 1,
        correct:   prev.correct + (correct ? 1 : 0)
      };
      localStorage.setItem('stocksensei_stats', JSON.stringify(updated));
      return updated;
    });
  };

  if (screen === 'home') {
    return <HomeScreen onSelect={handleSelect} />;
  }

  return (
    <ChallengeScreen
      scenarioId={selectedId}
      onBack={handleBack}
      onUpdateStats={handleUpdateStats}
    />
  );
}