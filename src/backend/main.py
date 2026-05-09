import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from apify_client import ApifyClient
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

app = FastAPI(title="LegalGuard AI Agent")

# Middleware configuration for Frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure API Keys from Environment
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
ZYND_API_KEY = os.getenv("ZYND_API_KEY")
ZYND_APP_ID = os.getenv("ZYND_APP_ID")

# Initialize Client
apify_client = ApifyClient(APIFY_API_TOKEN)

# Data Models
class AnalysisRequest(BaseModel):
    url: str

class Finding(BaseModel):
    severity: str
    description: str

class AnalysisResponse(BaseModel):
    title: str
    risk_score: int
    summary: str
    findings: List[Finding]

def get_scraped_text(url: str):
    """Sourcing Layer: Uses Apify to extract text from modern JS-heavy sites."""
    # Using 'apify/website-content-crawler' as it is optimized for LLM input (Markdown)
    run_input = {
        "startUrls": [{"url": url}],
        "maxCrawlPages": 1,
        "crawlerType": "playwright:firefox",
    }
    
    try:
        run = apify_client.actor("apify/website-content-crawler").call(run_input=run_input)
        dataset = apify_client.dataset(run["defaultDatasetId"]).list_items().items
        # Prefer Markdown for better AI analysis, fallback to text
        return dataset[0].get("markdown", dataset[0].get("text", "")) if dataset else ""
    except Exception as e:
        print(f"Scraping Error: {e}")
        return ""

def get_zynd_audit(text: str):
    """Auditing Layer: Uses Zynd AI (ZBrain) for semantic legal analysis."""
    url = "https://api.zbrain.ai/contentms/v2/api/query-app"
    headers = {
        "Authorization": f"Bearer {ZYND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Payload targets your specific Legal Agent App ID
    payload = {
        "query": f"Act as a legal auditor. Analyze this text for risks, privacy issues, and hidden fees. Return a JSON with 'risk_score' (0-100), a 'summary', and a list of 'findings' with 'severity' and 'description': {text[:10000]}",
        "appId": ZYND_APP_ID 
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Zynd AI Error: {e}")
        return None

@app.post("/analyze-single", response_model=AnalysisResponse)
async def analyze_single(request: AnalysisRequest):
    # 1. Real-time Sourcing
    scraped_text = get_scraped_text(request.url)
    if not scraped_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the provided URL.")

    # 2. Agentic Audit
    audit_raw = get_zynd_audit(scraped_text)
    
    if not audit_raw:
        raise HTTPException(status_code=500, detail="The AI Agent failed to analyze the document.")

    # 3. Formulate Dynamic Response
    # This parses the AI response dynamically
    # Fallbacks included to prevent frontend crashes if keys are missing
    return {
        "title": "Agentic Real-time Audit",
        "risk_score": audit_raw.get("risk_score", 50),
        "summary": audit_raw.get("summary", "Analysis complete. Review findings below."),
        "findings": audit_raw.get("findings", [
            {"severity": "info", "description": "No high-risk clauses were explicitly flagged."}
        ])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)