import os
import requests
import json

def analyze_with_dify(text: str, category: str):
    url = f"{os.getenv('DIFY_API_BASE')}/workflows/run"
    headers = {
        "Authorization": f"Bearer {os.getenv('DIFY_API_KEY')}",
        "Content-Type": "application/json"
    }
    
    # We send the raw text and the category to your Dify Workflow
    payload = {
        "inputs": {
            "document_text": text[:20000], # Dify handles long text well
            "category": category
        },
        "response_mode": "blocking",
        "user": "legalguard_user_001"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        # Dify returns data in a 'data' block
        outputs = result.get('data', {}).get('outputs', {})
        return outputs
    except Exception as e:
        print(f"Dify Error: {e}")
        return None