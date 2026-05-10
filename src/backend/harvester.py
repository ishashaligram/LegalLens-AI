import os
from apify_client import ApifyClient
from dotenv import load_dotenv

# 1. Load the variables from your .env file
load_dotenv()

# 2. Initialize the client using your API key
# Make sure "APIFY_API_TOKEN" is inside your .env file!
client = ApifyClient(os.getenv("APIFY_API_TOKEN"))
def harvest_website_text(url: str):
    """
    Sourcing Layer: Uses Apify Cloud to bypass bot detection.
    Optimized for modern JS-heavy financial sites.
    """
    # Configuration for dynamic crawling
    run_input = {
        "startUrls": [{"url": url}],
        "maxCrawlPages": 1,
        "crawlerType": "playwright:firefox", # Handles dynamic JS content
    }
    
    try:
        # Trigger the cloud actor dynamically for the specific URL
        run = client.actor("apify/website-content-crawler").call(run_input=run_input)
        
        # Fetch results from the cloud dataset
        dataset = client.dataset(run["defaultDatasetId"]).list_items().items
        
        if dataset:
            # Prefer Markdown as it helps the AI understand legal structure
            return dataset[0].get("markdown") or dataset[0].get("text") or ""
        return ""
    except Exception as e:
        print(f"Cloud Harvesting Error: {e}")
        return ""