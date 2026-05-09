import os
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

# Securely initialize the client
client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

def harvest_website_text(url: str):
    """
    Sourcing Layer: Uses Apify Cloud to bypass bot detection.
    Optimized for modern JS-heavy financial sites.
    """
    run_input = {
        "startUrls": [{"url": url}],
        "maxCrawlPages": 1,
        "crawlerType": "playwright:firefox",
    }
    
    try:
        # Trigger the cloud actor
        run = client.actor("apify/website-content-crawler").call(run_input=run_input)
        
        # Fetch the results from the cloud dataset
        dataset = client.dataset(run["defaultDatasetId"]).list_items().items
        
        # Return Markdown (better for AI) or plain text
        if dataset:
            return dataset[0].get("markdown", dataset[0].get("text", ""))
        return ""
    except Exception as e:
        print(f"Cloud Harvesting Error: {e}")
        return ""