# summarizer/utils.py
import requests
from django.conf import settings

def summarize_reviews_hf(review_texts, shop_name = None):
   # Hugging Face summarization
    BART_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

    # Kimi‑K2 via OpenRouter
    K2_URL = "https://openrouter.ai/api/v1/chat/completions"
    K2_MODEL = "moonshotai/kimi-k2"
    HEADERS = {
        "Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"
    }
    OPENROUTER_HEADERS = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}"
    }
    if len(review_texts) == 0:
        print(f"{shop_name}") 
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
        return response.json()["choices"][0]["message"]["content"].strip()
    else:
        print("K2 API error:", response.status_code, response.text)
        return "Could not generate summary at this time."
