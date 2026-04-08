from app.utils.llm import generate_response
import json

def generate_quiz(topic):
    prompt = f"""
    Generate 3 MCQs on: {topic}

    Return in JSON format:
    [
      {{
        "question": "...",
        "options": ["A","B","C","D"],
        "answer": "correct option"
      }}
    ]
    """

    res = generate_response(prompt)

    try:
        return json.loads(res)
    except:
        return {"raw": res}