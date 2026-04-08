import axios from "axios";

const AI_SERVICE_URL = "http://127.0.0.1:8000/query";
const AI_SERVICE_TIMEOUT_MS = 60000;

export async function queryAI({ message, mode = "work" }) {
  try {
    const response = await axios.post(
      AI_SERVICE_URL,
      { message, mode },
      { timeout: AI_SERVICE_TIMEOUT_MS }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      const apiError = error.response.data?.error;
      const message =
        apiError?.message || error.response.data?.detail || "FastAPI error";

      const serviceError = new Error(message);
      serviceError.statusCode = error.response.status;
      serviceError.details = apiError?.details;
      throw serviceError;
    }

    if (error.request) {
      const serviceError = new Error("FastAPI not responding");
      serviceError.statusCode = 503;
      throw serviceError;
    }

    throw error;
  }
}
