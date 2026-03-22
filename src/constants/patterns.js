export const PATTERN_THEORY = {
  hammer: {
    name: "Hammer",
    signal: "Bullish Reversal",
    emoji: "🔨",
    description: "A Hammer has a small body at the top with a long lower wick (at least 2x the body). It forms after a downtrend when sellers push prices down sharply but buyers step in strongly and push it back up. The long lower wick shows buyer strength.",
    reliability: "High when at support level with above-average volume",
    color: "var(--bull)",
    hint1: "Look at the lower wick — how long is it compared to the body?",
    hint2: "Where in the trend does this candle appear? Downtrend or uptrend?",
    hint3: "Who won the battle between buyers and sellers on this day?"
  },
  doji: {
    name: "Doji",
    signal: "Indecision",
    emoji: "⚖️",
    description: "A Doji forms when open and close prices are nearly equal. Long wicks on both sides show that both buyers and sellers tried to dominate but neither succeeded. It signals a pause or potential reversal in the current trend.",
    reliability: "Most reliable after extended trends with high volume",
    color: "var(--gold)",
    hint1: "Look at the open and close prices — how different are they?",
    hint2: "What do the wicks on both sides tell you about the day's trading?",
    hint3: "If neither buyers nor sellers won, what might happen next?"
  },
  engulfing: {
    name: "Engulfing Pattern",
    signal: "Strong Reversal",
    emoji: "🌊",
    description: "A Bullish Engulfing occurs when a green candle completely engulfs the previous red candle body. Buyers overpowered sellers so completely that they reversed the entire previous move and more.",
    reliability: "Very high — especially after a clear downtrend",
    color: "var(--bull)",
    hint1: "Compare the size of the last two candles — which one is bigger?",
    hint2: "Does the second candle's body completely cover the first candle's body?",
    hint3: "What does it mean when buyers reverse an entire day's selling in one session?"
  },
  shooting_star: {
    name: "Shooting Star",
    signal: "Bearish Reversal",
    emoji: "💫",
    description: "A Shooting Star has a small body at the bottom with a long upper wick. Forms after an uptrend when buyers push prices high but sellers reject those levels and push it back down. The long upper wick shows seller strength.",
    reliability: "High when at resistance level with above-average volume",
    color: "var(--bear)",
    hint1: "Look at the upper wick — how long is it compared to the body?",
    hint2: "Where in the trend does this candle appear? After a rise or a fall?",
    hint3: "Buyers tried to push prices up — what happened to those gains by close?"
  },
  morning_star: {
    name: "Morning Star",
    signal: "Bullish Reversal",
    emoji: "⭐",
    description: "A 3-candle pattern: large bearish candle, small indecision candle (gap down), large bullish candle. Confirms a trend reversal with multiple sessions of evidence. More reliable than single-candle patterns.",
    reliability: "Very high — requires 3 candle confirmation",
    color: "var(--bull)",
    hint1: "Count the last 3 candles — what direction is each one?",
    hint2: "Is the middle candle significantly smaller than the others?",
    hint3: "What story do 3 candles together tell that one candle cannot?"
  }
};

export const CATEGORIES = [
  { key: 'all',          label: '🌐 All',          color: 'var(--text-secondary)' },
  { key: 'crash',        label: '📉 Crash',        color: 'var(--bear)' },
  { key: 'rally',        label: '📈 Rally',        color: 'var(--bull)' },
  { key: 'earnings',     label: '📊 Earnings',     color: '#58a6ff' },
  { key: 'geopolitical', label: '🌍 Geopolitical', color: 'var(--gold)' },
];