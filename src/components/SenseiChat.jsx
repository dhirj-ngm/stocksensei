import React, { useEffect, useRef } from 'react';
import '../styles/chat.css';
import { PATTERN_THEORY } from '../constants/patterns';

export default function SenseiChat({
  scenario,
  messages,
  inputText,
  setInputText,
  onSend,
  agentThinking
}) {
  const messagesEndRef = useRef(null);
  const theory = scenario ? PATTERN_THEORY[scenario.pattern] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="right-panel">

      {/* Scenario description + pattern theory */}
      {scenario && (
        <div className="scenario-description">
          <h3>📋 Scenario Context</h3>
          <div className="context-box">{scenario.context}</div>
          {theory && (
            <div className="pattern-theory-box">
              <span className="pattern-name">
                {theory.emoji} {theory.name}
              </span>
              {' — '}
              <span
                className="pattern-signal"
                style={{ color: theory.color }}
              >
                {theory.signal}
              </span>
              <br />
              <span style={{ fontSize: '0.8rem' }}>
                {theory.description}
              </span>
              <br /><br />
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                Reliability:
              </strong>
              {' '}
              <span style={{ fontSize: '0.8rem' }}> 
                {theory.reliability}
              </span>
            </div>
          )}
          {scenario.institution_reference && (
            <div className="institution-ref">
              📚 {scenario.institution_reference}
            </div>
          )}
        </div>
      )}

      {/* Agent header */}
      <div className="agent-header">
        <div className="agent-avatar">🤖</div>
        <div className="agent-info">
          <h3>Sensei</h3>
          <span>● AI Trading Coach — Real Market Scenarios</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${
              msg.role === 'agent'  ? 'message-agent'  :
              msg.role === 'result'
                ? `message-result ${msg.correct ? '' : 'wrong'}`
                : 'message-user'
            }`}
          >
            {msg.role === 'agent' && (
              <div className="avatar-sm">🤖</div>
            )}
            <div className="bubble">{msg.text}</div>
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
      <div className="chat-input-area">
        <input
          className="chat-input"
          type="text"
          placeholder="Ask Sensei about this chart..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKey}
          disabled={agentThinking}
        />
        <button
          className="btn-send"
          onClick={onSend}
          disabled={agentThinking || !inputText.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}