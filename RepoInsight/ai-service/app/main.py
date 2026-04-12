from dotenv import load_dotenv
import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.agents.intent_agent import detect_intent
from app.agents.retriever_agent import retrieve_context
from app.agents.reasoning_agent import build_prompt
from app.agents.quiz_agent import generate_quiz
from app.utils.llm import generate_response
from app.agents.evaluation_agent import evaluate_answer
from app.graph.flow import run_flow
from app.rag.ingest import ingest_pdf, ingest_text
from app.utils.llm import LLMConfigurationError, LLMError, LLMRateLimitError

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()


class QueryRequest(BaseModel):
    message: str = Field(..., min_length=1)
    mode: str = Field(default="work")


class IngestTextRequest(BaseModel):
    text: str = Field(..., min_length=1)


class IngestPdfRequest(BaseModel):
    path: str = Field(..., min_length=1)


def build_error_response(exc: LLMError) -> JSONResponse:
    """Keep API errors structured and consistent across routes."""
    content = {
        "error": {
            "code": exc.error_code,
            "message": exc.message,
        }
    }

    if exc.details:
        content["error"]["details"] = exc.details

    headers = {}
    retry_after = exc.details.get("retry_after") if exc.details else None
    if retry_after is not None:
        headers["Retry-After"] = str(retry_after)

    return JSONResponse(status_code=exc.status_code, content=content, headers=headers)


@app.post("/query")
async def query(data: QueryRequest):
    try:
        return run_flow(data.message, data.mode)
    except (LLMRateLimitError, LLMConfigurationError, LLMError) as exc:
        return build_error_response(exc)


@app.post("/ingest/text")
async def ingest_text_api(data: IngestTextRequest):
    return ingest_text(data.text)


@app.post("/ingest/pdf")
async def ingest_pdf_api(file_path: IngestPdfRequest):
    return ingest_pdf(file_path.path)

@app.post("/evaluate")
async def evaluate(data: dict):
    results = []

    for q in data["answers"]:
        is_correct = evaluate_answer(q["user_answer"], q["correct_answer"])

        results.append({
            "question": q["question"],
            "is_correct": is_correct
        })

    return {"results": results}