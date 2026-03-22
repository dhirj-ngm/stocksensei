"""
StockSensei - FastAPI Backend v3
==================================
- Supabase database integration
- 30 real historical scenarios
- SQLite candle cache layer
- AI Sensei with Mixtral upgrade
- User session analytics
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import sqlite3
import json
import uuid

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Clients ───────────────────────────────────────────────────────────────────
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# ── SQLite Cache ──────────────────────────────────────────────────────────────
DB_PATH = "cache.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS candle_cache (
            scenario_id INTEGER PRIMARY KEY,
            candle_data TEXT NOT NULL,
            reveal_data TEXT,
            sr_levels   TEXT,
            trend_data  TEXT,
            cached_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def get_cache(scenario_id):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT * FROM candle_cache WHERE scenario_id = ?",
        (scenario_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return {
        "candle_data": json.loads(row[1]),
        "reveal_data": json.loads(row[2]) if row[2] else None,
        "sr_levels":   json.loads(row[3]) if row[3] else [],
        "trend_data":  json.loads(row[4]) if row[4] else {}
    }

def set_cache(scenario_id, candle_data=None,
              reveal_data=None, sr_levels=None, trend_data=None):
    conn = sqlite3.connect(DB_PATH)
    existing = conn.execute(
        "SELECT scenario_id FROM candle_cache WHERE scenario_id = ?",
        (scenario_id,)
    ).fetchone()

    if existing:
        conn.execute("""
            UPDATE candle_cache SET
                candle_data = COALESCE(?, candle_data),
                reveal_data = COALESCE(?, reveal_data),
                sr_levels   = COALESCE(?, sr_levels),
                trend_data  = COALESCE(?, trend_data)
            WHERE scenario_id = ?
        """, (
            json.dumps(candle_data) if candle_data else None,
            json.dumps(reveal_data) if reveal_data else None,
            json.dumps(sr_levels)   if sr_levels   else None,
            json.dumps(trend_data)  if trend_data  else None,
            scenario_id
        ))
    else:
        conn.execute("""
            INSERT INTO candle_cache
            (scenario_id, candle_data, reveal_data, sr_levels, trend_data)
            VALUES (?, ?, ?, ?, ?)
        """, (
            scenario_id,
            json.dumps(candle_data or []),
            json.dumps(reveal_data or []),
            json.dumps(sr_levels   or []),
            json.dumps(trend_data  or {})
        ))
    conn.commit()
    conn.close()

init_db()
print("✅ SQLite cache initialized")

# ── Market Data Helpers ───────────────────────────────────────────────────────
def calculate_support_resistance(df, window=10):
    highs  = df['High'].values
    lows   = df['Low'].values
    levels = []
    for i in range(window, len(df) - window):
        if highs[i] == max(highs[i-window:i+window]):
            levels.append({"price": round(float(highs[i]), 2), "type": "resistance"})
        if lows[i] == min(lows[i-window:i+window]):
            levels.append({"price": round(float(lows[i]), 2), "type": "support"})
    levels = sorted(levels, key=lambda x: x["price"])
    filtered = []
    for level in levels:
        if not filtered or abs(level["price"] - filtered[-1]["price"]) > df['Close'].mean() * 0.02:
            filtered.append(level)
    return filtered[-8:]

def calculate_trend(df):
    closes = df['Close'].values
    first  = closes[0]
    last   = closes[-1]
    change = ((last - first) / first) * 100
    if change > 3:
        trend = "uptrend"
    elif change < -3:
        trend = "downtrend"
    else:
        trend = "sideways"
    return {
        "direction":     trend,
        "change_percent": round(change, 2),
        "start_price":   round(float(first), 2),
        "end_price":     round(float(last), 2)
    }

def format_candles(df):
    candles = []
    for _, row in df.iterrows():
        candles.append({
            "open":   round(float(row['Open']),  2),
            "high":   round(float(row['High']),  2),
            "low":    round(float(row['Low']),   2),
            "close":  round(float(row['Close']), 2),
            "volume": int(row['Volume']),
            "date":   str(row.name.date())
        })
    return candles

# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "StockSensei backend v3 running — Supabase connected"}

@app.get("/scenarios")
async def get_all_scenarios():
    """
    Returns all scenarios from Supabase.
    Used for the home/problem list screen.
    """
    response = supabase.table("scenarios").select(
        "id, stock, date, pattern, difficulty, category, institution_reference"
    ).order("id").execute()
    return {"scenarios": response.data}

@app.get("/scenarios/category/{category}")
async def get_scenarios_by_category(category: str):
    """Filter scenarios by category."""
    if category == "all":
        response = supabase.table("scenarios").select("*").order("id").execute()
    else:
        response = supabase.table("scenarios").select("*").eq(
            "category", category
        ).order("id").execute()
    return {"scenarios": response.data}

@app.get("/scenario/{scenario_id}")
async def get_scenario(scenario_id: int):
    """
    Returns full scenario with real candle data.
    Checks SQLite cache first — fetches from yFinance if not cached.
    """
    # Get scenario metadata from Supabase
    response = supabase.table("scenarios").select("*").eq(
        "id", scenario_id
    ).execute()

    if not response.data:
        return {"error": "Scenario not found"}

    scenario = response.data[0]

    # Check candle cache
    cached = get_cache(scenario_id)
    if cached and cached["candle_data"]:
        print(f"✅ Serving scenario {scenario_id} from cache")
        return {
            **scenario,
            "candles":            cached["candle_data"],
            "support_resistance": cached["sr_levels"],
            "trend":              cached["trend_data"]
        }

    # Fetch from yFinance
    print(f"📡 Fetching scenario {scenario_id} from yFinance...")
    end_date   = datetime.strptime(str(scenario["date"]), "%Y-%m-%d")
    start_date = end_date - timedelta(days=90)

    ticker = yf.Ticker(scenario["ticker"])
    df = ticker.history(
        start=start_date.strftime("%Y-%m-%d"),
        end=end_date.strftime("%Y-%m-%d")
    )

    if df.empty:
        return {"error": "No market data found"}

    df        = df.tail(30)
    candles   = format_candles(df)
    sr_levels = calculate_support_resistance(df)
    trend     = calculate_trend(df)

    # Cache it
    set_cache(scenario_id,
              candle_data=candles,
              sr_levels=sr_levels,
              trend_data=trend)
    print(f"📦 Cached scenario {scenario_id}")

    return {
        **scenario,
        "candles":            candles,
        "support_resistance": sr_levels,
        "trend":              trend
    }

@app.get("/scenario/{scenario_id}/reveal")
async def reveal_outcome(scenario_id: int):
    """Returns next 10 candles showing what actually happened."""
    cached = get_cache(scenario_id)
    if cached and cached["reveal_data"]:
        print(f"✅ Serving reveal {scenario_id} from cache")
        response = supabase.table("scenarios").select(
            "what_happened, correct_answer"
        ).eq("id", scenario_id).execute()
        scenario = response.data[0]
        return {
            "next_candles":   cached["reveal_data"],
            "what_happened":  scenario["what_happened"],
            "correct_answer": scenario["correct_answer"]
        }

    # Get scenario from Supabase
    response = supabase.table("scenarios").select("*").eq(
        "id", scenario_id
    ).execute()
    if not response.data:
        return {"error": "Scenario not found"}

    scenario   = response.data[0]
    start_date = datetime.strptime(str(scenario["date"]), "%Y-%m-%d")
    end_date   = start_date + timedelta(days=30)

    ticker = yf.Ticker(scenario["ticker"])
    df = ticker.history(
        start=start_date.strftime("%Y-%m-%d"),
        end=end_date.strftime("%Y-%m-%d")
    )

    if df.empty:
        return {"error": "No data found"}

    df      = df.head(10)
    candles = format_candles(df)

    set_cache(scenario_id, reveal_data=candles)
    print(f"📦 Cached reveal {scenario_id}")

    return {
        "next_candles":   candles,
        "what_happened":  scenario["what_happened"],
        "correct_answer": scenario["correct_answer"]
    }

@app.post("/session/save")
async def save_session(data: dict):
    """Save user session analytics to Supabase."""
    try:
        supabase.table("user_sessions").insert({
            "session_id":          data.get("session_id", str(uuid.uuid4())),
            "scenario_id":         data.get("scenario_id"),
            "prediction":          data.get("prediction"),
            "was_correct":         data.get("was_correct"),
            "reasoning":           data.get("reasoning", ""),
            "bonus_points":        data.get("bonus_points", 0),
            "points_earned":       data.get("points_earned", 0),
            "time_taken_seconds":  data.get("time_taken_seconds", 0)
        }).execute()
        return {"status": "saved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/analytics")
async def get_analytics():
    """
    Returns aggregated analytics across all user sessions.
    Shows which scenarios are hardest, accuracy rates etc.
    """
    response = supabase.table("user_sessions").select("*").execute()
    sessions = response.data

    if not sessions:
        return {"message": "No sessions yet"}

    total      = len(sessions)
    correct    = sum(1 for s in sessions if s["was_correct"])
    accuracy   = round((correct / total) * 100, 1) if total > 0 else 0

    # Per scenario accuracy
    scenario_stats = {}
    for s in sessions:
        sid = s["scenario_id"]
        if sid not in scenario_stats:
            scenario_stats[sid] = {"total": 0, "correct": 0}
        scenario_stats[sid]["total"]   += 1
        scenario_stats[sid]["correct"] += 1 if s["was_correct"] else 0

    hardest = sorted(
        scenario_stats.items(),
        key=lambda x: x[1]["correct"] / x[1]["total"]
    )[:3]

    return {
        "total_attempts": total,
        "overall_accuracy": accuracy,
        "hardest_scenarios": hardest
    }

    # ── Model options ─────────────────────────────────────────────────────────────
    AVAILABLE_MODELS = {
        "mixtral":  "mixtral-8x7b-32768",
        "llama3":   "llama-3.1-8b-instant",
        "llama70b": "llama-3.3-70b-versatile",
    }

    # ── Sensei System Prompt ──────────────────────────────────────────────────────
    SENSEI_PROMPT = """
        You are Sensei — a knowledgeable, friendly trading mentor for young Indian investors.

        Your personality:
        - Talk like a smart friend, not a professor. Casual, warm, direct.
        - Short replies. Never more than 3-4 sentences unless asked to explain more.
        - Use Indian market context naturally — Nifty 50, NSE, BSE, INR amounts.
        - React naturally — excited when user gets it right, encouraging when wrong.

        How you behave:
        - If the user hasn't predicted yet — ask ONE guiding question about what they see on the chart. Don't give away the answer.
        - If the user has predicted and seen the outcome — explain freely. Tell the full story. Answer everything directly.
        - If the user asks any question — just answer it. Directly and clearly. No need to always ask back.
        - Match the energy. If they're curious, go deep. If they're confused, simplify.

        You know deeply:
        - All candlestick patterns — Hammer, Doji, Engulfing, Shooting Star, Morning Star
        - Support and Resistance, Volume analysis, Trend reading
        - Indian market history — COVID crash 2020, Adani-Hindenburg 2023, RBI policy events
        - How retail investors think and what mistakes they commonly make

        Keep it conversational. Keep it real.
        """

    class ChatRequest(BaseModel):
        message:          str
        pattern:          str
        stock:            str
        scenario_context: str = ""
        trend:            str = ""
        history:          list
        mode:             str = "teaching"
        model_key:        str = "mixtral"

    @app.post("/chat")
    async def chat(req: ChatRequest):
        model = AVAILABLE_MODELS.get(req.model_key, AVAILABLE_MODELS["mixtral"])

        messages = [{"role": "system", "content": SENSEI_PROMPT}]

        context = f"""Current chart: {req.stock} — NSE Nifty 50
    Pattern: {req.pattern}
    Trend: {req.trend}
    Has user predicted yet: {"Yes — explain freely now" if req.mode == "explanation" else "No — guide with questions"}"""

        messages.append({"role": "user", "content": context})
        messages.append({"role": "assistant", "content": "Got it."})

        for msg in req.history[-8:]:
            role = "assistant" if msg["role"] == "agent" else "user"
            messages.append({"role": role, "content": msg["text"]})

        messages.append({"role": "user", "content": req.message})

        response = groq_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.75,
            max_tokens=250
        )

        return {
            "reply": response.choices[0].message.content,
            "model": model
        }

        @app.get("/models")
        async def get_models():
            return {
                "models": [
                    { "key": "mixtral",  "name": "Sensei Classic",  "desc": "Mixtral 8x7b — balanced and reliable" },
                    { "key": "llama3",   "name": "Sensei Fast",     "desc": "Llama 3.1 8b — quick responses" },
                    { "key": "llama70b", "name": "Sensei Pro",      "desc": "Llama 3.3 70b — deeper reasoning" },
                ]
            }

@app.post("/evaluate")
async def evaluate_reasoning(req: dict):
    reasoning  = req.get("reasoning", "")
    pattern    = req.get("pattern", "")
    is_correct = req.get("is_correct", False)

    prompt = f"""
User identified a {pattern} pattern.
Their reasoning: "{reasoning}"
Prediction was {"correct" if is_correct else "incorrect"}.

Evaluate in ONE sentence. Award 0-300 bonus points for quality of thinking.
Respond ONLY in JSON: {{"evaluation": "...", "bonus_points": 0, "quality": "poor/good/excellent"}}
"""
    response = groq_client.chat.completions.create(
        model="mixtral-8x7b-32768",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=100
    )

    import json as jsonlib
    try:
        result = jsonlib.loads(response.choices[0].message.content)
    except:
        result = {
            "evaluation":  "Good thinking!",
            "bonus_points": 100,
            "quality":     "good"
        }
    return result