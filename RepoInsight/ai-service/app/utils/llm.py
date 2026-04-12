import os
import time
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.api_core.exceptions import GoogleAPICallError, ResourceExhausted

load_dotenv()

MODEL_NAME = "gemini-2.5-flash"
MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 30


class LLMError(Exception):
    """Base application error for Gemini failures."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        error_code: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class LLMConfigurationError(LLMError):
    def __init__(self, message: str) -> None:
        super().__init__(
            message,
            status_code=500,
            error_code="gemini_configuration_error",
        )


class LLMRateLimitError(LLMError):
    def __init__(self, message: str, *, retry_after: int) -> None:
        super().__init__(
            message,
            status_code=429,
            error_code="gemini_rate_limited",
            details={"retry_after": retry_after},
        )


class LLMServiceError(LLMError):
    def __init__(
        self,
        message: str,
        *,
        details: dict[str, Any] | None = None,
        status_code: int = 502,
    ) -> None:
        super().__init__(
            message,
            status_code=status_code,
            error_code="gemini_service_error",
            details=details,
        )


@lru_cache(maxsize=1)
def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise LLMConfigurationError("GEMINI_API_KEY is not configured.")

    return genai.Client(api_key=api_key)


def generate_response(prompt: str, response_mime_type: str = "text/plain") -> str:
    """Generate text with Gemini and translate provider errors into app errors.
    
    Args:
        prompt: The prompt to send to Gemini
        response_mime_type: MIME type for response format (text/plain, application/json, etc.)
    """
    if not prompt.strip():
        raise LLMServiceError(
            "Prompt cannot be empty.",
            status_code=400,
            details={"field": "prompt"},
        )

    client = _get_client()

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config={
                    "response_mime_type": response_mime_type
                }
            )
            text = (response.text or "").strip()
            if not text:
                raise LLMServiceError("Gemini returned an empty response.")
            return text
        except ResourceExhausted as exc:
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS)
                continue

            raise LLMRateLimitError(
                "Gemini quota or rate limit was exceeded. Please retry later.",
                retry_after=RETRY_DELAY_SECONDS,
            ) from exc
        except GoogleAPICallError as exc:
            status_code = getattr(exc, "code", None) or 502
            if status_code == 429:
                raise LLMRateLimitError(
                    "Gemini quota or rate limit was exceeded. Please retry later.",
                    retry_after=RETRY_DELAY_SECONDS,
                ) from exc

            raise LLMServiceError(
                "Gemini request failed.",
                status_code=int(status_code),
                details={"provider_error": str(exc)},
            ) from exc
        except LLMError:
            raise
        except Exception as exc:
            raise LLMServiceError(
                "Unexpected error while generating Gemini response.",
                details={"provider_error": str(exc)},
            ) from exc
