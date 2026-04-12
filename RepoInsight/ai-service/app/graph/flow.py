from app.agents.intent_agent import detect_intent
from app.agents.retriever_agent import retrieve_context
from app.agents.reasoning_agent import build_prompt
from app.agents.quiz_agent import generate_quiz
from app.utils.llm import generate_response
from app.agents.evaluation_agent import evaluate_answer
import logging

logger = logging.getLogger(__name__)

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
        logger.info(f"Learning mode detected, generating quiz for: {message[:100]}")
        quiz = generate_quiz(message)
        
        # Ensure quiz is always a list (never undefined)
        if not isinstance(quiz, list):
            logger.warning(f"Quiz is not a list, got {type(quiz)}, using empty array")
            quiz = []
        
        response["quiz"] = quiz
        logger.info(f"Quiz generated with {len(quiz)} questions")

    return response