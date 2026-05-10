import os
import google.generativeai as genai

def get_gemini_comparison(text, category):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"As a legal expert, compare this {category} text against standard consumer protection laws. Summarize in 3 bullet points."
    
    response = model.generate_content(f"{prompt}\n\nTEXT: {text[:8000]}")
    return response.text