import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

# Import updated services
from services.apify_service import harvest_website_text
from services.dify_service import analyze_with_dify
from services.gemini_service import get_gemini_comparison
from utils.categorizer import get_comparison

# Load environment variables
load_dotenv()

app = FastAPI(title="LegalGuard AI: Multi-Agent Auditor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    url: str

class AnalysisResponse(BaseModel):
    documentTitle: str
    documentUrl: str
    category: str
    overallRisk: str
    risk_score: int
    summary: str
    categories: List[Dict[str, Any]]
    quickChecks: List[Dict[str, Any]]
    analyzedAt: str
    comparison_text: str
    agentic_insight: Optional[str] = None

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_site(request: AnalysisRequest):
    # 1. Sourcing Layer (Apify)
    raw_text = harvest_website_text(request.url)
    if not raw_text:
        raise HTTPException(status_code=400, detail="Failed to extract content.")

    # 2. Automated Categorization
    financial_keywords = ["loan", "bank", "interest", "apr", "credit", "mortgage", "investment", "finance"]
    is_financial = any(word in raw_text.lower() for word in financial_keywords)
    category_label = "Financial Services" if is_financial else "General Terms"

    # 3. Structural Audit (Dify Layer)
    # We pass the category so Dify's brain knows which legal standards to apply
    audit_data = analyze_with_dify(raw_text, category_label)
    
    if not audit_data:
        raise HTTPException(status_code=500, detail="Dify agent failed to analyze the document.")

    # 4. Reasoning Layer (Gemini)
    gemini_insight = get_gemini_comparison(raw_text, category_label)

    # 5. Benchmark Calculation
    # Ensure your Dify workflow outputs a key named 'risk_score'
    risk_val = int(audit_data.get("risk_score", 50)) 
    comparison_result = get_comparison(risk_val, category_label)

    # 6. Formulate Final Response
    return {
        "documentTitle": f"LegalGuard Audit: {request.url.split('//')[-1].split('/')[0]}",
        "documentUrl": request.url,
        "category": category_label,
        "overallRisk": "high" if risk_val > 70 else "medium" if risk_val > 30 else "low",
        "risk_score": risk_val,
        "summary": audit_data.get("summary", "Analysis complete."),
        "categories": audit_data.get("categories", []), # List of risk categories from Dify
        "quickChecks": audit_data.get("quickChecks", []), # Specific flag checks from Dify
        "analyzedAt": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "comparison_text": comparison_result["comparison_text"],
        "agentic_insight": gemini_insight
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)