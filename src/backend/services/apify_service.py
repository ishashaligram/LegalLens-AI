from apify_client import ApifyClient
import os

# Initialize with your token
client = ApifyClient(os.getenv("APIFY_API_TOKEN"))

def scrape_financial_site(url: str):
    """
    Scrapes high-security sites (Banking/Crypto) using a headless 
    browser and residential proxies to avoid detection.
    """
    
    # Configuration for high-security environments
    run_input = {
        "startUrls": [{"url": url}],
        "maxCrawlPages": 1,           # Focus on the specific T&C or landing page
        "crawlerType": "playwright:firefox", # Firefox is often better at bypassing bank anti-bots
        "useSitemaps": False,         # Skip sitemaps to save time and stay on target
        "proxyConfiguration": {
            "useApifyProxy": True,    # Uses Apify's rotated proxy network
            "groups": ["RESIDENTIAL"] # Residential IPs look like real home users to banks
        },
        "renderingType": "browser",   # Forces full browser rendering for JS-heavy crypto sites
        "removeElementsCssSelector": "nav, footer, script, style, .ads, .cookie-banner" # Clean the noise
    }

    try:
        # Call the Website Content Crawler Actor
        run = client.actor("apify/website-content-crawler").call(run_input=run_input)
        
        # Fetch the results from the dataset
        results = client.dataset(run["defaultDatasetId"]).list_items().items
        
        if results:
            # We prefer 'markdown' for AI analysis as it preserves headers/structure
            # but 'text' is a reliable fallback.
            return results[0].get("markdown") or results[0].get("text", "")
        
        return "No content found on the page."

    except Exception as e:
        print(f"Scraping error: {e}")
        return ""