import express from "express";
import { generateQuiz, submitQuiz } from "../controllers/quizController.js";

const router = express.Router();

// POST /api/quiz/ - Generate a new quiz
router.post("/", generateQuiz);

// POST /api/quiz/submit - Submit quiz answers for evaluation
router.post("/submit", submitQuiz);

export default router;