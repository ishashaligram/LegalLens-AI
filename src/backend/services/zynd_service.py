import os
import requests
import json

def analyze_with_zynd(text, category):
    """
    Directly targets the Zynd API with category-specific logic.
    """
    url = "https://api.zbrain.ai/contentms/v2/api/query-app"
    api_key = os.getenv("ZYND_API_KEY")
    app_id = os.getenv("ZYND_APP_ID")

    # Financial-specific comparison prompt
    if category == "Financial Services":
        query = (
            f"Analyze this financial document: {text[:10000]}. "
            "1. Extract interest rates (APR). "
            "2. Identify hidden penalties. "
            "3. Compare these terms against standard fair-lending practices. "
            "Return JSON: {risk_score, summary, findings: [{severity, description}]}"
        )
    else:
        query = f"Audit these Terms and Conditions for privacy and data risks: {text[:10000]}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": query,
        "appId": app_id
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        return {"error": str(e)}