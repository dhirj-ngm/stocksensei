import React, { useEffect, useRef, useState } from 'react';
import '../styles/chat.css';
import { PATTERN_THEORY } from '../constants/patterns';

export default function SenseiChat({
  scenario,
  messages,
  inputText,
  setInputText,
  onSend,
  agentThinking,
  selectedModel,
  setSelectedModel
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

      {/* Agent header with model selector */}
      <div className="agent-header">
        <div className="agent-avatar">🤖</div>
        <div className="agent-info">
          <h3>Sensei</h3>
          <span>● AI Trading Coach</span>
        </div>
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          style={{
            marginLeft: 'auto',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            padding: '4px 8px',
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
          placeholder="Ask Sensei anything..."
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