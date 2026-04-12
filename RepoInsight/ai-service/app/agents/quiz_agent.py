from app.utils.llm import generate_response, LLMServiceError
import json
import logging

logger = logging.getLogger(__name__)

# Fallback quiz when generation completely fails
FALLBACK_QUIZ = [
    {
        "question": "What is the main topic we just discussed?",
        "options": ["Topic A", "Topic B", "Topic C", "Topic D"],
        "answer": "Topic A"
    },
    {
        "question": "Which of the following is a key concept?",
        "options": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
        "answer": "Concept 1"
    },
    {
        "question": "What would be the best application?",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "answer": "Option 1"
    }
]


def generate_quiz(topic: str, max_retries: int = 2) -> list:
    """
    Generate quiz questions using Gemini with JSON mode enforcement.
    
    Args:
        topic: The topic to generate quiz questions for
        max_retries: Maximum number of retries (default: 2)
    
    Returns:
        List of quiz question dictionaries, always returns a valid array
    """
    if not topic or not topic.strip():
        logger.warning("Empty topic provided to generate_quiz, using fallback")
        return FALLBACK_QUIZ

    # Strong, detailed prompt with strict formatting
    prompt = f"""Generate exactly 3 multiple choice quiz questions on the topic: "{topic}"

STRICT REQUIREMENTS:
1. Return ONLY valid JSON array format - no markdown, no code blocks, no extra text
2. Each question must have: "question", "options" (array of 4), "answer" (one of the options)
3. Answer must be the EXACT text from options array
4. No explanations before or after

Example format:
[
  {{
    "question": "What is X?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option B"
  }},
  {{
    "question": "What does Y mean?",
    "options": ["Definition 1", "Definition 2", "Definition 3", "Definition 4"],
    "answer": "Definition 3"
  }},
  {{
    "question": "Which is Z?",
    "options": ["Choice W", "Choice X", "Choice Y", "Choice Z"],
    "answer": "Choice X"
  }}
]

Now generate the quiz on "{topic}":"""

    for attempt in range(max_retries + 1):
        try:
            logger.debug(f"Quiz generation attempt {attempt + 1}/{max_retries + 1} for topic: {topic}")
            
            # Use JSON mode enforcement via response_mime_type
            response_text = generate_response(
                prompt,
                response_mime_type="application/json"
            )
            
            # Clean response in case it has markdown blocks
            response_text = response_text.strip()
            if response_text.startswith("```"):
                # Extract JSON from markdown code block
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            logger.debug(f"Raw Gemini response: {response_text[:200]}...")
            
            # Parse JSON
            quiz_data = json.loads(response_text)
            
            # Validate it's an array
            if not isinstance(quiz_data, list):
                logger.warning(f"Gemini returned non-array JSON, retrying... (attempt {attempt + 1})")
                continue
            
            # Validate each question has required fields
            for q in quiz_data:
                if not all(key in q for key in ["question", "options", "answer"]):
                    logger.warning(f"Invalid question structure, retrying... (attempt {attempt + 1})")
                    raise ValueError("Missing required fields in question")
                
                # Ensure answer is in options
                if q["answer"] not in q["options"]:
                    logger.warning(f"Answer not in options, retrying... (attempt {attempt + 1})")
                    raise ValueError(f"Answer '{q['answer']}' not in options")
            
            logger.info(f"Successfully generated {len(quiz_data)} quiz questions for topic: {topic}")
            return quiz_data
            
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed (attempt {attempt + 1}/{max_retries + 1}): {str(e)}")
            if attempt < max_retries:
                continue
            logger.error(f"Quiz generation failed after {max_retries + 1} attempts, using fallback")
            return FALLBACK_QUIZ
            
        except (ValueError, KeyError) as e:
            logger.warning(f"Validation failed (attempt {attempt + 1}/{max_retries + 1}): {str(e)}")
            if attempt < max_retries:
                continue
            logger.error(f"Quiz validation failed after {max_retries + 1} attempts, using fallback")
            return FALLBACK_QUIZ
            
        except LLMServiceError as e:
            logger.error(f"LLM service error (attempt {attempt + 1}/{max_retries + 1}): {str(e)}")
            if attempt < max_retries:
                continue
            logger.error(f"LLM service failed after {max_retries + 1} attempts, using fallback")
            return FALLBACK_QUIZ
            
        except Exception as e:
            logger.error(f"Unexpected error in quiz generation (attempt {attempt + 1}/{max_retries + 1}): {str(e)}")
            if attempt < max_retries:
                continue
            logger.error(f"Unexpected error after {max_retries + 1} attempts, using fallback")
            return FALLBACK_QUIZ
    
    # Final fallback if all retries exhausted
    return FALLBACK_QUIZ