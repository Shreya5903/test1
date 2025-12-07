import os
import sqlite3
import json
import re
from datetime import datetime
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai

# -------------------------
# Environment & Gemini setup
# -------------------------

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in environment or .env")

client = genai.Client(api_key=GEMINI_API_KEY)

# -------------------------
# FastAPI app + CORS
# -------------------------

app = FastAPI(title="AI Feedback Backend")

# Simple, robust CORS: allow all origins.
# (No cookies / auth, so this is safe for your use case.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # allow all frontends (Vercel, localhost, etc.)
    allow_credentials=False,  # must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# SQLite setup
# -------------------------

DB_PATH = "reviews.db"
conn = sqlite3.connect(DB_PATH, check_same_thread=False)

# Improve concurrency & avoid "database is locked" issues
conn.execute("PRAGMA journal_mode=WAL;")
conn.execute("PRAGMA busy_timeout = 5000;")  # wait up to 5 seconds if locked

init_cursor = conn.cursor()
init_cursor.execute(
    """
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        review_text TEXT NOT NULL,
        ai_user_response TEXT NOT NULL,
        ai_summary TEXT NOT NULL,
        ai_actions TEXT NOT NULL
    )
    """
)
conn.commit()


# -------------------------
# Pydantic models
# -------------------------

class ReviewCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    review_text: str = Field(..., min_length=1, max_length=2000)


class ReviewOut(BaseModel):
    id: int
    created_at: str
    name: str
    rating: int
    review_text: str
    ai_user_response: str
    ai_summary: str
    ai_actions: str


# -------------------------
# Gemini helper
# -------------------------

def generate_ai_feedback(rating: int, review_text: str) -> dict:
    """
    Call Gemini 2.5 Flash to generate:
    - user_response
    - summary
    - actions
    """
    prompt = f"""
You are an AI assistant helping a product team understand customer feedback.

User rating: {rating} (1-5)
User review: {review_text}

Return a JSON object with these keys:
- "user_response": a short friendly message addressed to the user (max 2 sentences).
- "summary": a concise, neutral 1-2 sentence summary of the feedback.
- "actions": 2-3 bullet points (string with each bullet on a new line) suggesting actions the team can take.

Important:
- Respond with ONLY valid JSON.
- Do not include any markdown, code fences (```), or extra text.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip()

        # If it accidentally returns ```json ... ``` remove those wrappers
        if text.startswith("```"):
            text = re.sub(r"^```(json)?", "", text, flags=re.IGNORECASE).strip()
            if text.endswith("```"):
                text = text[:-3].strip()

        data = json.loads(text)

        user_response = data.get("user_response") or "Thank you for your feedback!"
        summary = data.get("summary") or "User shared their experience with the product."
        actions = data.get("actions") or "- Review this feedback with the team."

        # 🔑 Normalize to strings so SQLite accepts them
        if isinstance(user_response, list):
            user_response = " ".join(str(x) for x in user_response)
        else:
            user_response = str(user_response)

        if isinstance(summary, list):
            summary = " ".join(str(x) for x in summary)
        else:
            summary = str(summary)

        # actions might be a list of bullet points – join them with newlines
        if isinstance(actions, list):
            actions = "\n".join(str(x) for x in actions)
        else:
            actions = str(actions)

        return {
            "user_response": user_response,
            "summary": summary,
            "actions": actions,
        }

    except Exception as e:
        # Fallback if JSON parsing or API fails
        print("Gemini error:", e)
        fallback_actions = (
            "- Review this feedback.\n"
            "- Consider reaching out to the user.\n"
            "- Check if similar feedback exists."
        )
        return {
            "user_response": "Thank you for your feedback! Our team will review it.",
            "summary": "User shared feedback about their experience.",
            "actions": fallback_actions,
        }


# -------------------------
# Endpoints
# -------------------------

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/reviews", response_model=ReviewOut)
def create_review(review: ReviewCreate):
    ai_data = generate_ai_feedback(review.rating, review.review_text)
    created_at = datetime.utcnow().isoformat() + "Z"

    # fresh cursor for this request
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO reviews (
            created_at,
            name,
            rating,
            review_text,
            ai_user_response,
            ai_summary,
            ai_actions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            created_at,
            review.name,
            review.rating,
            review.review_text,
            ai_data["user_response"],
            ai_data["summary"],
            ai_data["actions"],
        ),
    )
    conn.commit()
    review_id = cur.lastrowid

    return ReviewOut(
        id=review_id,
        created_at=created_at,
        name=review.name,
        rating=review.rating,
        review_text=review.review_text,
        ai_user_response=ai_data["user_response"],
        ai_summary=ai_data["summary"],
        ai_actions=ai_data["actions"],
    )


@app.get("/reviews", response_model=List[ReviewOut])
def list_reviews():
    cur = conn.cursor()
    cur.execute(
        """
        SELECT
            id,
            created_at,
            name,
            rating,
            review_text,
            ai_user_response,
            ai_summary,
            ai_actions
        FROM reviews
        ORDER BY datetime(created_at) DESC
        """
    )
    rows = cur.fetchall()

    result: List[ReviewOut] = []
    for row in rows:
        result.append(
            ReviewOut(
                id=row[0],
                created_at=row[1],
                name=row[2],
                rating=row[3],
                review_text=row[4],
                ai_user_response=row[5],
                ai_summary=row[6],
                ai_actions=row[7],
            )
        )
    return result
