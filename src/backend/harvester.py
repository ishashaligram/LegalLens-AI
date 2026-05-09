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