def get_comparison(risk_score: int, category: str):
    """
    Generates a structured comparison metric for the frontend.
    """
    # Industry benchmarks based on standard risk assessments
    standards = {
        "Financial Services": 30, # Low baseline due to high regulation
        "General Terms": 45       # Higher baseline for general tech/SaaS
    }
    
    baseline = standards.get(category, 40)
    difference = risk_score - baseline
    
    # Calculate relative percentage difference
    # Formula: ((Risk - Baseline) / Baseline) * 100
    percentage_diff = round((difference / baseline) * 100) if baseline != 0 else 0

    if difference > 0:
        return {
            "comparison_text": f"{percentage_diff}% riskier than the {category} industry average.",
            "status": "warning",
            "difference_value": percentage_diff
        }
    elif difference < 0:
        return {
            "comparison_text": f"{abs(percentage_diff)}% safer than the {category} industry average.",
            "status": "safe",
            "difference_value": abs(percentage_diff)
        }
    else:
        return {
            "comparison_text": "Aligned with industry standard risks.",
            "status": "info",
            "difference_value": 0
        }