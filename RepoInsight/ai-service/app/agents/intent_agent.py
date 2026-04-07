from app.utils.llm import generate_response

def detect_intent(message: str):
    prompt = f"""
    Classify user intent into:
    - learning
    - work
    - project

    Message: {message}
    """

    return generate_response(prompt)