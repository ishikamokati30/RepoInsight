from app.utils.llm import generate_response

def generate_quiz(topic):
    prompt = f"""
    Create 3 MCQs on: {topic}
    Provide options and correct answer.
    """
    return generate_response(prompt)