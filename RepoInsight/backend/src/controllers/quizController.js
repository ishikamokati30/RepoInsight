import axios from "axios";
import { saveQuizResult } from "../db/queries.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Axios instance with timeout and error interceptors
const aiService = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Generate a quiz based on the provided topic
 * POST /api/quiz/
 * Body: { topic: "string" }
 */
export const generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;

    // 1. Validate request body
    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      console.warn("[generateQuiz] Validation failed: topic is missing or invalid");
      return res.status(400).json({
        error: "Bad Request",
        message: "topic is required and must be a non-empty string",
      });
    }

    console.log(`[generateQuiz] Generating quiz for topic: "${topic}"`);

    // 2. Call AI service
    let response;
    try {
      response = await aiService.post("/query", {
        message: topic.trim(),
        mode: "learning",
      });
      console.log("[generateQuiz] AI service response received successfully");
    } catch (axiosErr) {
      // Handle axios-specific errors
      if (axiosErr.code === "ECONNREFUSED") {
        console.error(
          `[generateQuiz] AI Service Connection Failed: ${AI_SERVICE_URL} is unreachable`
        );
        return res.status(503).json({
          error: "Service Unavailable",
          message: "AI service is currently unavailable. Please try again later.",
          details: `Could not connect to ${AI_SERVICE_URL}`,
        });
      } else if (axiosErr.code === "ENOTFOUND") {
        console.error(
          `[generateQuiz] AI Service DNS Error: Cannot resolve ${AI_SERVICE_URL}`
        );
        return res.status(503).json({
          error: "Service Unavailable",
          message: "AI service configuration error.",
        });
      } else if (axiosErr.response) {
        // AI service responded with error status
        console.error(
          `[generateQuiz] AI Service Error: ${axiosErr.response.status}`,
          axiosErr.response.data
        );
        return res.status(502).json({
          error: "Bad Gateway",
          message: "AI service returned an error",
          aiServiceStatus: axiosErr.response.status,
          details: axiosErr.response.data,
        });
      } else if (axiosErr.message === "timeout of 30000ms exceeded") {
        console.error("[generateQuiz] AI Service Timeout");
        return res.status(504).json({
          error: "Gateway Timeout",
          message: "AI service took too long to respond. Please try again.",
        });
      } else {
        throw axiosErr; // Re-throw to general catch block
      }
    }

    // 3. Validate response structure
    if (!response.data || !response.data.quiz) {
      console.error(
        "[generateQuiz] Invalid response structure from AI service:",
        response.data
      );
      return res.status(502).json({
        error: "Bad Gateway",
        message: "AI service returned unexpected data format",
      });
    }

    console.log(`[generateQuiz] Quiz generated successfully with ${response.data.quiz.length || 0} questions`);
    res.json(response.data.quiz);
  } catch (err) {
    console.error("[generateQuiz] Unexpected error:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred while generating the quiz",
    });
  }
};

/**
 * Submit quiz answers and get evaluation
 * POST /api/quiz/submit
 * Body: { answers: [], userId: string, topic: string }
 */
export const submitQuiz = async (req, res) => {
  try {
    const { answers, userId, topic } = req.body;

    // 1. Validate request body
    if (!Array.isArray(answers) || answers.length === 0) {
      console.warn("[submitQuiz] Validation failed: answers must be a non-empty array");
      return res.status(400).json({
        error: "Bad Request",
        message: "answers is required and must be a non-empty array",
      });
    }

    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      console.warn("[submitQuiz] Validation failed: userId is missing or invalid");
      return res.status(400).json({
        error: "Bad Request",
        message: "userId is required and must be a non-empty string",
      });
    }

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      console.warn("[submitQuiz] Validation failed: topic is missing or invalid");
      return res.status(400).json({
        error: "Bad Request",
        message: "topic is required and must be a non-empty string",
      });
    }

    console.log(
      `[submitQuiz] Processing ${answers.length} answers for userId: ${userId}, topic: ${topic}`
    );

    // 2. Call AI service to evaluate
    let evalRes;
    try {
      evalRes = await aiService.post("/evaluate", { answers });
      console.log("[submitQuiz] AI service evaluation completed successfully");
    } catch (axiosErr) {
      if (axiosErr.code === "ECONNREFUSED") {
        console.error(
          `[submitQuiz] AI Service Connection Failed: ${AI_SERVICE_URL} is unreachable`
        );
        return res.status(503).json({
          error: "Service Unavailable",
          message: "AI service is currently unavailable. Please try again later.",
        });
      } else if (axiosErr.response) {
        console.error(
          `[submitQuiz] AI Service Error: ${axiosErr.response.status}`,
          axiosErr.response.data
        );
        return res.status(502).json({
          error: "Bad Gateway",
          message: "AI service evaluation failed",
        });
      } else if (axiosErr.message === "timeout of 30000ms exceeded") {
        console.error("[submitQuiz] AI Service Timeout");
        return res.status(504).json({
          error: "Gateway Timeout",
          message: "AI service took too long to respond.",
        });
      } else {
        throw axiosErr;
      }
    }

    // 3. Validate evaluation response
    if (!evalRes.data || !Array.isArray(evalRes.data.results)) {
      console.error(
        "[submitQuiz] Invalid evaluation response structure:",
        evalRes.data
      );
      return res.status(502).json({
        error: "Bad Gateway",
        message: "AI service returned unexpected evaluation format",
      });
    }

    // 4. Save results to database
    try {
      console.log(
        `[submitQuiz] Saving ${answers.length} results to database...`
      );
      for (let i = 0; i < answers.length; i++) {
        if (!evalRes.data.results[i]) {
          console.warn(
            `[submitQuiz] Missing evaluation result for answer ${i}`
          );
          continue;
        }

        await saveQuizResult(
          userId,
          topic,
          answers[i].question,
          answers[i].user_answer,
          answers[i].correct_answer,
          evalRes.data.results[i].is_correct
        );
      }
      console.log("[submitQuiz] All results saved to database successfully");
    } catch (dbErr) {
      console.error("[submitQuiz] Database error while saving results:", {
        message: dbErr.message,
        stack: dbErr.stack,
      });
      // Return partial success - evaluation succeeded but storage failed
      return res.status(500).json({
        error: "Partial Error",
        message: "Evaluation completed but failed to save results",
        evaluationData: evalRes.data,
      });
    }

    res.json(evalRes.data);
  } catch (err) {
    console.error("[submitQuiz] Unexpected error:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred while submitting the quiz",
    });
  }
};