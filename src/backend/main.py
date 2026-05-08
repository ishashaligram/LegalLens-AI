from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os

app = FastAPI()

# CRITICAL: Allow your extension to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, you'd restrict this
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_text(request: AnalysisRequest):
    # This matches your AnalysisResult interface in types.ts
    return {
        "summary": "This document has been analyzed by Gemini AI...",
        "overallRisk": "medium",
        "documentTitle": "Analyzed Terms",
        "documentUrl": "https://example.com",
        "analyzedAt": "2026-05-08T12:00:00Z",
        "categories": [
            {
                "id": "privacy",
                "title": "Privacy & Safety",
                "subtitle": "Data usage",
                "riskLevel": "medium",
                "points": ["Point 1 from AI", "Point 2 from AI"]
            }
        ],
        "quickChecks": [
            {
                "id": "sell",
                "question": "Will my personal details be sold?",
                "answer": "YES", # Now a string!
                "risk": "high"
            }
        ]
    }