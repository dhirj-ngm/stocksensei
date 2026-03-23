import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import '../styles/home.css';
import { CATEGORIES } from '../constants/patterns';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function HomeScreen({ onSelect, sessionStats, onLearn }) {
  const [scenarios, setScenarios] = useState([]);
  const [filter,    setFilter]    = useState('all');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetchScenarios('all');
  }, []);

  function fetchScenarios(category) {
    setLoading(true);
    fetch(`${API}/scenarios/category/${category}`)
      .then(res => res.json())
      .then(data => {
        setScenarios(data.scenarios || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function handleFilter(cat) {
    setFilter(cat);
    fetchScenarios(cat);
  }

  const accuracy = sessionStats?.attempted > 0
    ? Math.round((sessionStats.correct / sessionStats.attempted) * 100)
    : 0;

  const points = 10000 + (sessionStats?.correct || 0) * 500;

  return (
    <div>
      <Navbar points={points} />

      <div className="home-screen">
        <div className="home-header">
          <h1>Market Scenarios</h1>
          <p>
            Real historical events from Indian markets.
            Study the chart, predict what happened next.
          </p>
          <button
            onClick={onLearn}
            style={{
                marginTop: '12px',
                background: 'rgba(240,180,41,0.08)',
                border: '1px solid rgba(240,180,41,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 20px',
                color: 'var(--gold)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                transition: 'var(--transition)'
            }}
            >
            📚 Study Concepts →
        </button>
        </div>

        {/* Stats */}
        <div className="home-stats">
          <div className="stat-card">
            <div className="stat-number">{scenarios.length || 30}</div>
            <div className="stat-label">Scenarios</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{sessionStats?.attempted || 0}</div>
            <div className="stat-label">Attempted</div>
          </div>
          <div className="stat-card">
            <div
              className="stat-number"
              style={{ color: accuracy >= 60 ? 'var(--bull)' : 'var(--bear)' }}
            >
              {accuracy}%
            </div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: 'var(--bull)' }}>
              {sessionStats?.correct || 0}
            </div>
            <div className="stat-label">Correct</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`filter-btn ${filter === cat.key ? 'active' : ''}`}
              onClick={() => handleFilter(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '40px 0' }}>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  height: '44px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  opacity: 1 - i * 0.1
                }}
              />
            ))}
          </div>
        ) : scenarios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No scenarios found for this category.</p>
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
                  <td className="row-num">{i + 1}</td>
                  <td className="stock-name">{s.stock}</td>
                  <td className="date-cell">{s.date}</td>
                  <td>
                    <span className="pattern-tag">
                      {s.pattern?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`cat-badge cat-${s.category}`}>
                      {s.category}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${s.difficulty}`}>
                      {s.difficulty}
                    </span>
                  </td>
                  <td className="ref-cell">
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