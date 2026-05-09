import os
import requests
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from apify_client import ApifyClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="LegalGuard AI: Financial & T&C Auditor")

# Middleware for Chrome Extension connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Extension environment is often dynamic
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
ZYND_API_KEY = os.getenv("ZYND_API_KEY")
ZYND_APP_ID = os.getenv("ZYND_APP_ID")

apify_client = ApifyClient(APIFY_API_TOKEN)

# --- Data Models ---
class AnalysisRequest(BaseModel):
    url: str

class Finding(BaseModel):
    severity: str
    description: str

class AnalysisResponse(BaseModel):
    title: str
    category: str
    risk_score: int
    summary: str
    findings: List[Finding]
    comparison_data: Optional[Dict[str, Any]] = None # For Financial Comparisons

# --- Core Functions ---

def get_dynamic_text(url: str):
    """Dynamically harvests text using Playwright to handle JS-heavy sites."""
    run_input = {
        "startUrls": [{"url": url}],
        "maxCrawlPages": 1,
        "crawlerType": "playwright:firefox",
    }
    try:
        run = apify_client.actor("apify/website-content-crawler").call(run_input=run_input)
        dataset = apify_client.dataset(run["defaultDatasetId"]).list_items().items
        if dataset:
            # We prioritize Markdown for the AI to understand structure
            return dataset[0].get("markdown") or dataset[0].get("text") or ""
        return ""
    except Exception as e:
        print(f"Scraping Error: {e}")
        return ""

def perform_agentic_audit(text: str, is_financial: bool = False):
    """Sends the scraped text to Zynd AI for Audit."""
    url = "https://api.zbrain.ai/contentms/v2/api/query-app"
    headers = {
        "Authorization": f"Bearer {ZYND_API_KEY}",
        "Content-Type": "application/json"
    }

    # Dynamic Prompting based on Category
    prompt = (
        "Analyze this text for financial risks, interest rates, and hidden fees. "
        if is_financial else 
        "Analyze this text for privacy risks, data sharing, and termination clauses. "
    )
    
    prompt += "Return a JSON with 'risk_score' (0-100), 'summary', and 'findings' (list of {severity, description})."

    payload = {
        "query": f"{prompt} TEXT: {text[:12000]}", # Limit text to stay within context windows
        "appId": ZYND_APP_ID 
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        # Parse the nested response string from Zynd if necessary
        return response.json()
    except Exception as e:
        print(f"Zynd AI Error: {e}")
        return None

# --- API Routes ---

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_site(request: AnalysisRequest):
    # 1. Harvest Fresh Data (Fixes the 'data doesn't change' issue)
    raw_text = get_dynamic_text(request.url)
    if not raw_text:
        raise HTTPException(status_code=400, detail="Failed to scrape text from URL.")

    # 2. Determine Category (Financial vs General)
    # This logic checks if the site is a bank/fintech based on keywords
    financial_keywords = ["loan", "bank", "interest", "apr", "credit", "mortgage", "investment"]
    is_financial = any(word in raw_text.lower() for word in financial_keywords)
    category_label = "Financial Services" if is_financial else "General Terms of Service"

    # 3. Perform the Audit
    audit_data = perform_agentic_audit(raw_text, is_financial)
    
    if not audit_data:
        raise HTTPException(status_code=500, detail="AI Analysis failed.")

    # 4. Return Combined Analysis
    return {
    "documentTitle": f"Audit for {request.url.split('//')[-1].split('/')[0]}",
    "documentUrl": request.url,
    "category": category_label,
    "overallRisk": "high" if audit_raw.get("risk_score", 0) > 70 else "medium",
    "risk_score": audit_raw.get("risk_score", 50),
    "summary": audit_raw.get("summary", ""),
    "categories": audit_raw.get("categories", []), # Ensure Zynd returns this list
    "quickChecks": audit_raw.get("quickChecks", []), # Ensure Zynd returns this list
    "analyzedAt": "2026-05-10", # Use dynamic date in production
    "comparison_text": get_comparison(audit_raw.get("risk_score", 50), category_label)
}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)