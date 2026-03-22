import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/chart.css';

export default function CandlestickChart({
  candles,
  srLevels,
  revealCandles,
  difficulty,
  stock,
  date
}) {
  const canvasRef     = useRef(null);
  const wrapRef       = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const layoutRef     = useRef({});

  const safeReveal = revealCandles || [];
  const safeSR     = srLevels     || [];

  const draw = useCallback(() => {
    if (!candles || candles.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wrap = wrapRef.current;
    if (wrap) {
      canvas.width  = wrap.clientWidth  * window.devicePixelRatio;
      canvas.height = wrap.clientHeight * window.devicePixelRatio;
      canvas.style.width  = wrap.clientWidth  + 'px';
      canvas.style.height = wrap.clientHeight + 'px';
    }

    const ctx    = canvas.getContext('2d');
    const dpr    = window.devicePixelRatio;
    const W      = canvas.width  / dpr;
    const H      = canvas.height / dpr;
    ctx.scale(dpr, dpr);

    const volH   = 60;
    const chartH = H - volH - 8;
    const padT   = 32;
    const padB   = 32;
    const padR   = 70;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1923';
    ctx.fillRect(0, 0, W, H);

    const allCandles = [...candles, ...safeReveal];
    const allPrices  = allCandles.flatMap(c => [c.high, c.low]);
    const minPrice   = Math.min(...allPrices);
    const maxPrice   = Math.max(...allPrices);
    const range      = maxPrice - minPrice || 1;

    function toY(val) {
      return padT + ((maxPrice - val) / range) * (chartH - padT - padB);
    }

    const spacing = (W - padR - 20) / allCandles.length;
    const candleW = Math.max(3, spacing * 0.6);

    // Store layout for tooltip
    layoutRef.current = { toY, spacing, padR, W, H, chartH, padT, padB, volH, maxPrice, minPrice, range, candleW, candles, allCandles };

    // Grid lines
    const gridCount = 5;
    for (let i = 0; i <= gridCount; i++) {
      const y     = padT + (chartH - padT - padB) * (i / gridCount);
      const price = maxPrice - (range * i / gridCount);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.fillStyle  = 'rgba(138,155,176,0.7)';
      ctx.font       = `10px DM Mono, monospace`;
      ctx.textAlign  = 'left';
      ctx.fillText(price.toFixed(0), W - padR + 6, y + 4);
    }

    // S&R levels
    safeSR.forEach(level => {
      const ly = toY(level.price);
      if (ly < padT || ly > chartH - padB) return;
      ctx.strokeStyle = level.type === 'resistance'
        ? 'rgba(231,76,60,0.25)'
        : 'rgba(0,179,134,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(W - padR, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle  = level.type === 'resistance' ? '#e74c3c' : '#00b386';
      ctx.font       = '9px DM Mono, monospace';
      ctx.textAlign  = 'right';
      ctx.fillText(
        (level.type === 'resistance' ? 'R ' : 'S ') + level.price,
        W - padR - 4, ly - 3
      );
    });

    // Volume bars
    const maxVol = Math.max(...allCandles.map(c => c.volume || 1));
    allCandles.forEach((candle, idx) => {
      const cx    = 20 + idx * spacing + spacing / 2;
      const barH  = ((candle.volume || 0) / maxVol) * (volH - 8);
      const isBull   = candle.close >= candle.open;
      const isReveal = idx >= candles.length;
      ctx.fillStyle = isReveal
        ? 'rgba(88,166,255,0.3)'
        : isBull
          ? 'rgba(0,179,134,0.25)'
          : 'rgba(231,76,60,0.25)';
      ctx.fillRect(cx - candleW / 2, H - barH - 4, candleW, barH);
    });

    ctx.fillStyle = 'rgba(138,155,176,0.4)';
    ctx.font      = '9px DM Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VOL', 4, H - 4);

    // Candles
    allCandles.forEach((candle, idx) => {
      const cx       = 20 + idx * spacing + spacing / 2;
      const openY    = toY(candle.open);
      const closeY   = toY(candle.close);
      const highY    = toY(candle.high);
      const lowY     = toY(candle.low);
      const isBull   = candle.close >= candle.open;
      const isReveal = idx >= candles.length;

      let color;
      if (isReveal) color = '#58a6ff';
      else if (isBull) color = '#00b386';
      else color = '#e74c3c';

      // Glow effect on last candle
      if (idx === candles.length - 1 && !isReveal) {
        ctx.shadowColor = color;
        ctx.shadowBlur  = 8;
      }

      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
      ctx.lineWidth   = 1.5;

      // Wick
      ctx.beginPath();
      ctx.moveTo(cx, highY);
      ctx.lineTo(cx, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyH   = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(cx - candleW / 2, bodyTop, candleW, bodyH);

      ctx.shadowBlur = 0;
    });

    // Prediction divider
    if (safeReveal.length > 0) {
      const divX = 20 + candles.length * spacing;
      ctx.strokeStyle = 'rgba(240,180,41,0.6)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(divX, padT);
      ctx.lineTo(divX, chartH - padB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle  = '#f0b429';
      ctx.font       = 'bold 9px DM Sans, sans-serif';
      ctx.textAlign  = 'center';
      ctx.fillText('PREDICTION DATE', divX + 48, padT - 10);
    }

    // Trend line
    if (candles.length > 1) {
      const fx = 20 + spacing / 2;
      const lx = 20 + (candles.length - 1) * spacing + spacing / 2;
      const fy = toY(candles[0].close);
      const ly = toY(candles[candles.length - 1].close);
      ctx.strokeStyle = 'rgba(240,180,41,0.35)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [candles, safeSR, safeReveal]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw]);

  // Hover tooltip
  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const { spacing, allCandles, H, volH } = layoutRef.current;
    if (!spacing || !allCandles) return;

    // Don't show tooltip in volume area
    if (my > H - volH) { setTooltip(null); return; }

    const idx = Math.floor((mx - 20) / spacing);
    if (idx < 0 || idx >= allCandles.length) { setTooltip(null); return; }

    const candle    = allCandles[idx];
    const isReveal  = idx >= (candles?.length || 0);
    const isBull    = candle.close >= candle.open;

    setTooltip({
      x: e.clientX - rect.left,
      y: my,
      candle,
      isBull,
      isReveal
    });
  }

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div className="chart-stock-info">
          <h2>{stock || 'Chart'}</h2>
          <span>NSE • Nifty 50 • Daily Chart • {date || ''}</span>
        </div>
        <div className="chart-badges">
          {safeReveal.length > 0 && (
            <span className="reveal-badge">🔵 Reveal Mode</span>
          )}
          <span className={`badge badge-${difficulty}`}>{difficulty}</span>
        </div>
      </div>

      <div className="chart-legend">
        <span style={{ color: 'var(--bear)' }}>— Resistance</span>
        <span style={{ color: 'var(--bull)' }}>— Support</span>
        <span style={{ color: 'var(--gold)' }}>— Trend Line</span>
        <span>▪ Volume</span>
      </div>

      <div
        ref={wrapRef}
        className="chart-canvas-wrap"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <canvas ref={canvasRef} />

        {tooltip && (
          <div
            className="chart-tooltip"
            style={{
              left: tooltip.x + 16 > (wrapRef.current?.clientWidth || 0) - 180
                ? tooltip.x - 176
                : tooltip.x + 16,
              top: Math.max(8, tooltip.y - 80)
            }}
          >
            <div className="tooltip-date">{tooltip.candle.date || 'Historical'}</div>
            <div className="tooltip-row">
              <span className="tooltip-label">O</span>
              <span className="tooltip-value">₹{tooltip.candle.open?.toFixed(2)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">H</span>
              <span className={`tooltip-value bull`}>₹{tooltip.candle.high?.toFixed(2)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">L</span>
              <span className={`tooltip-value bear`}>₹{tooltip.candle.low?.toFixed(2)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">C</span>
              <span className={`tooltip-value ${tooltip.isBull ? 'bull' : 'bear'}`}>
                ₹{tooltip.candle.close?.toFixed(2)}
              </span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Vol</span>
              <span className="tooltip-value">
                {tooltip.candle.volume
                  ? (tooltip.candle.volume / 100000).toFixed(2) + 'L'
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}