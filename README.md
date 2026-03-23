# 📈 StockSensei

> **LeetCode for Stock Market Learning** — Gamified candlestick pattern recognition using real Nifty 50 historical data and an AI Socratic coach.

🌐 **Live App:** [stocksensei-gamma.vercel.app](https://stocksensei-gamma.vercel.app)

---

## What is StockSensei?

StockSensei teaches young Indian investors to read stock charts through real historical market scenarios. Instead of passive reading, users study real candlestick charts, predict what happened next, and learn from actual market outcomes — guided by an AI mentor called Sensei.

---

## Features

- **30 Real Scenarios** — Historical Nifty 50 events (COVID crash, Adani-Hindenburg, earnings surprises) across 5 categories
- **AI Sensei** — Socratic teaching coach powered by Llama 3.3 70b via Groq. Guides before prediction, explains fully after reveal
- **3 Model Options** — Mixtral 8x7b, Llama 3.1 8b, Llama 3.3 70b
- **Real Market Data** — yFinance fetches actual OHLCV data from NSE
- **Custom Chart Engine** — Built on HTML5 Canvas with hover tooltips, Support/Resistance overlays, trend lines, volume bars
- **Animated Reveal** — Click RUN to see real next candles animate in one by one
- **Gamified Points** — +500 correct, -300 wrong, +300 bonus for quality reasoning
- **Hint System** — 3 progressive hints, first free
- **Session Analytics** — All interactions saved to Supabase for Phase 2 fine-tuning

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, HTML5 Canvas |
| Backend | FastAPI (Python) |
| AI | Llama 3.3 70b / Mixtral 8x7b via Groq |
| Market Data | yFinance — NSE Nifty 50 |
| Database | Supabase (PostgreSQL) |
| Cache | SQLite |
| Deploy | Vercel + Render |

---

## Running Locally

**Frontend:**
```bash
cd stocksensei
npm install
npm start
```

**Backend:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

**Environment variables** — create `backend/.env`:
```
GROQ_API_KEY=your_groq_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://stocksensei-gamma.vercel.app |
| Backend API | https://stocksensei-backend-sqy6.onrender.com |
| Health Check | https://stocksensei-backend-sqy6.onrender.com/health |

> **Note:** Backend runs on Render free tier. Open the health check URL 2 minutes before demoing to wake it up.

---

## Phase 2 Roadmap

- Fine-tune Llama 3.1 8b on collected user sessions using NVIDIA NeMo on Nebius AI
- Flutter mobile app
- Live market mode — predict next week on real current data
- Support & Resistance dedicated challenges
- Community leaderboard

---

## Built With

AIML Mini Project 2025–26
