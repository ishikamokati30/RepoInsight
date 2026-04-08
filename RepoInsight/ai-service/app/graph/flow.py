from app.agents.intent_agent import detect_intent
from app.agents.retriever_agent import retrieve_context
from app.agents.reasoning_agent import build_prompt
from app.agents.quiz_agent import generate_quiz
from app.utils.llm import generate_response
from app.agents.evaluation_agent import evaluate_answer

def run_flow(message, mode):
    intent = detect_intent(message)
    context_data = retrieve_context(message)

    context_text = "\n".join([c["text"] for c in context_data])
    prompt = build_prompt(message, context_text)

    answer = generate_response(prompt)

    response = {
        "answer": answer,
        "sources": context_data
    }

    if mode == "learning":
        quiz = generate_quiz(message)
        response["quiz"] = quiz

    return response