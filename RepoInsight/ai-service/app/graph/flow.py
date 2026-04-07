from app.agents.intent_agent import detect_intent
from app.agents.retriever_agent import retrieve_context
from app.agents.reasoning_agent import build_prompt
from app.agents.quiz_agent import generate_quiz
from app.utils.llm import generate_response


def run_flow(message, mode):
    intent = detect_intent(message)

    context = retrieve_context(message)

    prompt = build_prompt(message, context)

    answer = generate_response(prompt)

    response = {
        "answer": answer,
        "intent": intent,
        "context_used": context
    }

    if mode == "learning":
        response["quiz"] = generate_quiz(message)

    return response