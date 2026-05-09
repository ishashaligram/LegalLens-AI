import os
import requests
from fastapi import FastAPI, HTTPException
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# Initialize Apify for deep legal text extraction
apify_client = ApifyClient(os.getenv("APIFY_TOKEN"))

def get_unique_scrape(url: str):
    """Uses Apify to extract rendered text that standard scrapers miss."""
    run_input = {
        "startUrls": [{"url": url}],
        "maxCrawlPages": 1,
        "crawlerType": "playwright:firefox", # Handles heavy React/FinTech sites
    }
    try:
        # Using the Website Content Crawler optimized for LLMs
        run = apify_client.actor("apify/website-content-crawler").call(run_input=run_input)
        dataset = apify_client.dataset(run["defaultDatasetId"]).list_items().items
        # Return unique markdown/text for THIS specific site
        return dataset[0].get("markdown", dataset[0].get("text", "")) if dataset else ""
    except Exception as e:
        return f"Scraping Error: {e}"

def get_zynd_legal_audit(text: str, url: str):
    """Calls Zynd.ai Agent with site-specific anchoring."""
    domain = url.split("//")[-1].split("/")[0]
    
    # THE KEY FIX: We include the domain and a 'Direct Quote' mandate
    query = (
        f"Auditing Website: {domain}\n"
        "Analyze the provided text for: 1. Predatory Interest, 2. Hidden Fees, 3. Data Privacy.\n"
        "STRICT RULE: Every finding MUST include a 'Direct Quote' from the text below.\n"
        "If you cannot find site-specific evidence, say 'No specific risks found'.\n\n"
        f"TEXT:\n{text[:12000]}"
    )
    
    headers = {"Authorization": f"Bearer {os.getenv('ZYND_API_KEY')}"}
    payload = {"query": query, "appId": os.getenv("ZYND_APP_ID")}
    
    response = requests.post("https://api.zbrain.ai/contentms/v2/api/query-app", json=payload, headers=headers)
    return response.json()

@app.post("/analyze")
async def analyze(url: str):
    # 1. Get unique data per site
    raw_text = get_unique_scrape(url)
    # 2. Audit that unique data
    result = get_zynd_legal_audit(raw_text, url)
    return result
from fastapi.middleware.cors import CORSMiddleware

# Add this after initializing your FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow everything
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)