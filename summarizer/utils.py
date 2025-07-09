# summarizer/utils.py
import requests
from django.conf import settings

def summarize_reviews_hf(review_texts):
    joined_reviews = "\n".join(review_texts[:10])[:1024]

    prompt = (
        "Summarize the following customer reviews into at most two sentences that capture the overall sentiment, "
        "common praises, and any recurring complaints:\n\n"
        f"{joined_reviews}"
    )
    API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}"}
    payload = {"inputs": prompt}

    response = requests.post(API_URL, headers=headers, json=payload)

    if response.status_code == 200:
        return response.json()[0]['summary_text']
    else:
        return "Could not generate summary at this time."
