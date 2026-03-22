import React from 'react';
import '../styles/navbar.css';

const TICKER_DATA = [
  { name: 'RELIANCE', price: '2847.30', change: '+1.2%', up: true },
  { name: 'TCS',      price: '3921.15', change: '+0.8%', up: true },
  { name: 'HDFCBANK', price: '1623.40', change: '-0.4%', up: false },
  { name: 'INFY',     price: '1456.75', change: '+1.5%', up: true },
  { name: 'ICICIBANK',price: '1089.20', change: '+0.6%', up: true },
  { name: 'WIPRO',    price: '478.90',  change: '-0.9%', up: false },
  { name: 'BAJFIN',   price: '6734.50', change: '+2.1%', up: true },
  { name: 'MARUTI',   price: '10234.00',change: '+0.3%', up: true },
  { name: 'TATASTEEL',price: '142.80',  change: '-1.2%', up: false },
  { name: 'ADANIENT', price: '2456.30', change: '+0.7%', up: true },
];

export default function Navbar({ trend, points, showBack, onBack }) {
  const trendClass = trend
    ? trend.direction === 'uptrend' ? 'up'
    : trend.direction === 'downtrend' ? 'down'
    : 'sideways'
    : '';

  const trendLabel = trend
    ? `${trend.direction === 'uptrend' ? '↑' : trend.direction === 'downtrend' ? '↓' : '→'} ${trend.direction?.toUpperCase()} (${trend.change_percent}%)`
    : null;

  // Double the ticker for seamless loop
  const tickerItems = [...TICKER_DATA, ...TICKER_DATA];

  return (
    <nav className="navbar">
      {/* Left — back button or logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {showBack && (
          <button className="btn-back" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="navbar-logo">
          <div className="navbar-logo-icon">📈</div>
          <span className="navbar-logo-text">StockSensei</span>
        </div>
      </div>

      {/* Center — ticker tape */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {tickerItems.map((item, i) => (
            <div key={i} className="ticker-item">
              <span className="ticker-name">{item.name}</span>
              <span className="mono" style={{ color: 'var(--text-primary)' }}>
                ₹{item.price}
              </span>
              <span className={item.up ? 'ticker-up' : 'ticker-down'}>
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — trend + points */}
      <div className="navbar-right">
        {trend && (
          <span className={`navbar-trend ${trendClass}`}>
            {trendLabel}
          </span>
        )}
        <div className="navbar-points">
          💰 {points?.toLocaleString() || '10,000'} pts
        </div>
      </div>
    </nav>
  );
}