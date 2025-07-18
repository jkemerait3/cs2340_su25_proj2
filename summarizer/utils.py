# summarizer/utils.py
import requests
from django.conf import settings
import os
import environ
from pathlib import Path

def summarize_reviews_hf(review_texts, shop_name = None):
   # Hugging Face summarization
    BART_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
    BASE_DIR = Path(__file__).resolve().parent.parent


    # Kimi‑K2 via OpenRouter
    K2_URL = "https://openrouter.ai/api/v1/chat/completions"
    K2_MODEL = "moonshotai/kimi-k2"
    OPENROUTER_HEADERS = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"
    }
    if len(review_texts) == 0:
        prompt = (
            "You are a coffee expert. Here's the name of the coffee shop:\n\n"
            f"{shop_name}\n\n"
            "recommend 2–3 popular drinks someone might enjoy at this coffee shop, using no more than four sentences."
        )
    if len(review_texts) == 1:
        # Use Kimi‑K2 for single review
        prompt = (
            "You are a coffee expert. Here's a customer review for the coffee shop:\n\n"
            f"{review_texts[0]}\n\n"
            "Summarize it and recommend 2–3 popular drinks someone might enjoy at this coffee shop, using no more than four sentences."
        )
    elif len(review_texts) > 1: 
        joined = "\n".join(review_texts[:10])[:1024]
        prompt = (
            "Summarize these customer reviews in no more than four sentences, "
            "highlighting overall sentiment, praise, and any common complaints:\n\n"
            f"{joined}"
        )
    payload = {
            "model": K2_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200,
            "temperature": 0.7
        }
    response = requests.post(K2_URL, headers=OPENROUTER_HEADERS, json=payload)
    if response.status_code == 200:
        return response.json()[0]['summary_text']
    else:
        return "Could not generate summary at this time."
