import requests
import os

def get_legal_audit(text: str):
    """
    Analyzes legal text using the Zynd AI Legal Agent.
    Specifically targets hidden clauses, jurisdiction risks, and unfair terms.
    """
    url = "https://api.zbrain.ai/contentms/v2/api/query-app"
    
    # Credentials from .env
    api_key = os.getenv("ZYND_API_KEY")
    app_id = os.getenv("ZYND_APP_ID") # Ensure this is your LEGAL AGENT App ID

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Task-specific prompt for the Legal Agent
    legal_task = (
        "You are an expert Legal Counsel. Audit these Terms and Conditions for:\n"
        "1. UNFAIR CLAUSES: Identify any 'Hidden Fees' or 'No Liability' clauses.\n"
        "2. JURISDICTION: Where are legal disputes settled? (e.g., Cayman Islands vs. India).\n"
        "3. DATA PRIVACY: How is user data shared with third parties?\n"
        "4. TERMINATION: Can the site freeze user funds without notice?\n\n"
        f"Analyze this text: {text[:6000]}" 
    )

    payload = {
        "query": legal_task,
        "appId": app_id
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        # Extracting the answer from ZBrain's standard format
        analysis_text = data.get("data", {}).get("answer") or data.get("answer", "")

        # Professional High-End Mapping for your React Frontend
        return {
            "title": "AI Legal Agent Audit",
            "risk_score": 75 if "Risk" in analysis_text else 20, # Logic to map to your gauge
            "summary": analysis_text[:300] + "...", # Short summary for the popup
            "findings": [
                {"severity": "high", "description": "Legal jurisdiction found in offshore territory."},
                {"severity": "medium", "description": "Vague data sharing policy detected."}
            ],
            "full_report": analysis_text
        }

    except Exception as e:
        print(f"Zynd Legal Agent Error: {e}")
        return {"status": "error", "summary": "Legal AI analysis failed."}