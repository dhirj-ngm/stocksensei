import React, { useState, useRef, useEffect } from 'react';
import Navbar from './Navbar';
import '../styles/learn.css';
import '../styles/chat.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const PATTERNS = [
  {
    emoji: '🔨',
    name: 'Hammer',
    signal: 'Bullish Reversal',
    signalClass: 'signal-bull',
    body: 'A Hammer has a small body at the top with a long lower wick — at least 2x the body length. It forms after a downtrend when sellers push prices down sharply during the day, but buyers step in strongly and push it back up before the close. The long lower wick is the key — it shows buyers rejected the lower prices.',
    tip: 'Best signal: Hammer at a known support level with above-average volume. The stronger the volume, the more conviction behind the buyers.'
  },
  {
    emoji: '⚖️',
    name: 'Doji',
    signal: 'Indecision',
    signalClass: 'signal-neutral',
    body: 'A Doji forms when the open and close prices are nearly equal, leaving almost no body. Long wicks on both sides show that buyers pushed prices up AND sellers pushed prices down during the day — but neither side won. It signals a pause or potential reversal in the current trend.',
    tip: 'Most powerful after a long trend. A Doji at the top of an uptrend or bottom of a downtrend is a warning sign that the trend may be losing steam.'
  },
  {
    emoji: '🌊',
    name: 'Bullish Engulfing',
    signal: 'Strong Reversal',
    signalClass: 'signal-bull',
    body: 'A two-candle pattern. The first candle is bearish (red). The second candle is bullish (green) and its body completely engulfs the first candle\'s body. This means buyers overpowered sellers so completely that they reversed the entire previous day\'s move and then some. One of the strongest reversal signals.',
    tip: 'The bigger the engulfing candle relative to the previous one, the stronger the signal. High volume on the engulfing candle confirms institutions are buying.'
  },
  {
    emoji: '💫',
    name: 'Shooting Star',
    signal: 'Bearish Reversal',
    signalClass: 'signal-bear',
    body: 'The opposite of a Hammer. Small body at the bottom with a long upper wick. Forms after an uptrend when buyers push prices up aggressively during the day, but sellers step in and reject those high prices, pushing it back down before close. The long upper wick shows sellers won the day.',
    tip: 'Most reliable at resistance levels — price zones where the stock has struggled before. If the stock couldn\'t break above resistance and forms a Shooting Star, sellers are clearly in control.'
  },
  {
    emoji: '⭐',
    name: 'Morning Star',
    signal: 'Bullish Reversal',
    signalClass: 'signal-bull',
    body: 'A 3-candle pattern: Day 1 is a large bearish candle (sellers in full control). Day 2 is a small indecision candle (neither side wins). Day 3 is a large bullish candle (buyers take over). This confirmation across 3 sessions makes it more reliable than single-candle patterns.',
    tip: 'The gap between Day 1 and Day 2 (if present) strengthens the signal. The bigger the Day 3 bullish candle, the stronger the reversal confirmation.'
  },
];

const CONCEPTS = [
  {
    icon: '📊',
    title: 'Support Level',
    body: 'A price zone where a falling stock tends to stop and bounce back up. Think of it as a floor — buyers step in at this price because they believe the stock is cheap. The more times a stock bounces off a level, the stronger that support is.',
    tip: '✅ Bullish pattern at support = strong buy signal',
    tipClass: ''
  },
  {
    icon: '🚧',
    title: 'Resistance Level',
    body: 'A price zone where a rising stock tends to stop and fall back down. Think of it as a ceiling — sellers step in at this price because they believe the stock is expensive. The more times a stock fails to break above a level, the stronger that resistance is.',
    tip: '⚠️ Bearish pattern at resistance = strong sell signal',
    tipClass: 'bear'
  },
  {
    icon: '📈',
    title: 'Trend Lines',
    body: 'A line connecting the highs (downtrend) or lows (uptrend) of a chart. Uptrend = higher highs and higher lows. Downtrend = lower highs and lower lows. Sideways = price bouncing between a range. Context matters — the same pattern means different things in different trends.',
    tip: '💡 Pattern in trend direction = continuation. Pattern against trend = potential reversal.',
    tipClass: 'gold'
  },
  {
    icon: '📦',
    title: 'Volume Analysis',
    body: 'Volume is the number of shares traded in a session. High volume means strong conviction — many participants agree on direction. Low volume means weak conviction. A bullish candle on high volume is much more reliable than the same candle on low volume.',
    tip: '✅ Pattern + High Volume = confirmed signal. Pattern + Low Volume = treat with caution.',
    tipClass: ''
  },
];

const QUICK_QUESTIONS = [
  'What is a candlestick?',
  'How do I identify a Hammer?',
  'What does high volume mean?',
  'Difference between support and resistance?',
  'What is a trend reversal?',
  'How reliable are these patterns?',
];

const LEARN_PROMPT = `You are Sensei — a friendly trading mentor for young Indian investors.

The user is on the Learn page studying candlestick patterns and chart concepts.
Answer ALL questions directly, clearly, and in simple language.
Use Indian market examples (Nifty 50, NSE, INR) where relevant.
Keep answers concise — 3-4 sentences max unless they ask for more detail.
No Socratic questioning here — just answer directly and helpfully.`;

export default function LearnScreen({ onBack, points }) {
  const [messages,      setMessages]      = useState([{
    role: 'agent',
    text: "Hi! I'm Sensei. Ask me anything about candlestick patterns, support & resistance, volume, or any trading concept. I'll explain it simply! 👋"
  }]);
  const [inputText,     setInputText]     = useState('');
  const [agentThinking, setAgentThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama70b');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(text) {
    const msg = text || inputText.trim();
    if (!msg || agentThinking) return;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setAgentThinking(true);

    fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:          msg,
        pattern:          '',
        stock:            '',
        scenario_context: LEARN_PROMPT,
        trend:            '',
        history:          messages.slice(-6),
        mode:             'explanation',
        model_key:        selectedModel
      })
    })
      .then(res => res.json())
      .then(data => {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: data.reply || 'Let me think about that...'
        }]);
        setAgentThinking(false);
      })
      .catch(() => {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: 'Something went wrong. Try asking again!'
        }]);
        setAgentThinking(false);
      });
  }

  return (
    <div>
      <Navbar points={points} showBack={true} onBack={onBack} />

      <div className="learn-screen">

        {/* LEFT — Content */}
        <div className="learn-content">
          <div className="learn-header">
            <h1>📚 Trading Concepts</h1>
            <p>Everything you need to read a candlestick chart — explained simply.</p>
          </div>

          {/* Candlestick Patterns */}
          <div className="learn-section">
            <div className="learn-section-title">
              🕯️ Candlestick Patterns
            </div>
            <div className="pattern-cards">
              {PATTERNS.map((p, i) => (
                <div key={i} className="pattern-card"
                  onClick={() => sendMessage(`Explain the ${p.name} pattern in simple terms`)}>
                  <div className="pattern-card-header">
                    <div className="pattern-emoji">{p.emoji}</div>
                    <div className="pattern-card-info">
                      <h3>{p.name}</h3>
                      <span className={`pattern-signal-tag ${p.signalClass}`}>
                        {p.signal}
                      </span>
                    </div>
                  </div>
                  <div className="pattern-card-body">{p.body}</div>
                  <div className="pattern-card-tip">
                    <strong>Pro tip:</strong> {p.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Concepts */}
          <div className="learn-section">
            <div className="learn-section-title">
              🧠 Core Concepts
            </div>
            <div className="concept-cards">
              {CONCEPTS.map((c, i) => (
                <div key={i} className="concept-card"
                  onClick={() => sendMessage(`Explain ${c.title} in simple terms`)}>
                  <div className="concept-icon">{c.icon}</div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                  <div className={`tip ${c.tipClass}`}>{c.tip}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT — Sensei Chat */}
        <div className="learn-chat">
          <div className="learn-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div className="agent-avatar" style={{ width: 28, height: 28, fontSize: '0.8rem' }}>🤖</div>
              <h3>Ask Sensei</h3>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                  marginLeft: 'auto',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: 'var(--font-ui)'
                }}
              >
                <option value="mixtral">Mixtral 8x7b</option>
                <option value="llama3">Llama 3.1 8b</option>
                <option value="llama70b">Llama 3.3 70b</option>
              </select>
            </div>
            <p>Click any card or ask your own question</p>
          </div>

          {/* Quick questions */}
          <div className="quick-questions">
            {QUICK_QUESTIONS.map((q, i) => (
              <button key={i} className="quick-btn" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="learn-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role === 'agent' ? 'message-agent' : 'message-user'}`}>
                {msg.role === 'agent' && <div className="avatar-sm">🤖</div>}
                <div className="bubble" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
              </div>
            ))}
            {agentThinking && (
              <div className="message message-agent">
                <div className="avatar-sm">🤖</div>
                <div className="thinking-bubble">
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="learn-input-area">
            <input
              className="chat-input"
              type="text"
              placeholder="Ask anything about trading..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={agentThinking}
            />
            <button
              className="btn-send"
              onClick={() => sendMessage()}
              disabled={agentThinking || !inputText.trim()}
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}