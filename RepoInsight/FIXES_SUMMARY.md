# Backend 500 Error Fixes - Summary

## 📋 Issues Found & Fixed

### **Issue #1: No Request Body Validation**
**Before:**
```javascript
const { topic } = req.body;
// No check if topic exists or is valid
```

**After:**
```javascript
if (!topic || typeof topic !== "string" || topic.trim() === "") {
  console.warn("[generateQuiz] Validation failed: topic is missing or invalid");
  return res.status(400).json({
    error: "Bad Request",
    message: "topic is required and must be a non-empty string",
  });
}
```

**Why:** Without validation, missing `topic` causes axios to send `undefined` to the AI service, which rejects it and returns a 500 error. Now you get a clear 400 error instead.

---

### **Issue #2: Missing Timeout Configuration**
**Before:**
```javascript
const response = await axios.post(`${AI_SERVICE_URL}/query`, {...});
```

**After:**
```javascript
const aiService = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000, // 30 second timeout
  headers: { "Content-Type": "application/json" }
});

const response = await aiService.post("/query", {...});
```

**Why:** If the AI service hangs, your request hangs indefinitely. Now it fails after 30 seconds with a 504 error.

---

### **Issue #3: No Error Differentiation**
**Before:**
```javascript
catch (err) {
  res.status(500).json({ error: err.message });
}
```
This treats all errors the same - it could be a network issue, AI service error, or a bug.

**After:**
```javascript
catch (axiosErr) {
  if (axiosErr.code === "ECONNREFUSED") {
    // 503 - Service is down
    return res.status(503).json({...});
  } else if (axiosErr.response) {
    // 502 - Service returned error
    return res.status(502).json({...});
  } else if (axiosErr.message === "timeout of 30000ms exceeded") {
    // 504 - Service is slow
    return res.status(504).json({...});
  }
  throw axiosErr; // Other unexpected error
}
```

**Why:** Different HTTP status codes tell the client what went wrong:
- **400** = Client's fault (bad request)
- **502** = AI service error
- **503** = AI service down
- **504** = Timeout
- **500** = Backend bug

---

### **Issue #4: No Response Validation**
**Before:**
```javascript
res.json(response.data.quiz);
// What if response.data.quiz doesn't exist?
```

**After:**
```javascript
if (!response.data || !response.data.quiz) {
  console.error("[generateQuiz] Invalid response structure from AI service:", response.data);
  return res.status(502).json({
    error: "Bad Gateway",
    message: "AI service returned unexpected data format",
  });
}
res.json(response.data.quiz);
```

**Why:** If the AI service changes response format or returns an error object instead of quiz data, you won't crash - you'll return a meaningful error.

---

### **Issue #5: No Debug Logging**
**Before:**
```javascript
// Only catch block had logging, very minimal
const response = await axios.post(...);
res.json(response.data.quiz);
```

**After:**
```javascript
console.log(`[generateQuiz] Generating quiz for topic: "${topic}"`);
try {
  response = await aiService.post("/query", {...});
  console.log("[generateQuiz] AI service response received successfully");
} catch (axiosErr) {
  console.error("[generateQuiz] AI Service Connection Failed: ...", axiosErr);
  // ...
}
console.log(`[generateQuiz] Quiz generated successfully with ${response.data.quiz.length || 0} questions`);
```

**Why:** Now you can trace exactly where a request fails by looking at the console logs. Each step is logged with context `[functionName]`.

---

### **Issue #6: Hard-coded Localhost in submitQuiz**
**Before:**
```javascript
const evalRes = await axios.post("http://localhost:8000/evaluate", {
  answers,
});
```

**After:**
```javascript
const aiService = axios.create({
  baseURL: AI_SERVICE_URL, // Uses environment variable
  timeout: 30000,
});

const evalRes = await aiService.post("/evaluate", { answers });
```

**Why:** Hard-coding localhost breaks in production or if AI service runs on a different port. Using `AI_SERVICE_URL` from environment makes it configurable.

---

### **Issue #7: No Async/Await Error Handling in submitQuiz**
**Before:**
```javascript
export const submitQuiz = async (req, res) => {
  const { answers, userId, topic } = req.body;
  const evalRes = await axios.post(...);
  for (let i = 0; i < answers.length; i++) {
    await saveQuizResult(...); // If this fails, no error handling!
  }
  res.json(evalRes.data);
};
```

**After:**
```javascript
export const submitQuiz = async (req, res) => {
  try {
    // Validation first...
    // Then AI service call with error handling...
    // Then DB save with error handling...
    
    try {
      console.log(`[submitQuiz] Saving ${answers.length} results to database...`);
      for (let i = 0; i < answers.length; i++) {
        await saveQuizResult(...);
      }
      console.log("[submitQuiz] All results saved to database successfully");
    } catch (dbErr) {
      console.error("[submitQuiz] Database error while saving results:", dbErr);
      return res.status(500).json({
        error: "Partial Error",
        message: "Evaluation completed but failed to save results",
        evaluationData: evalRes.data,
      });
    }
    
    res.json(evalRes.data);
  } catch (err) {
    // Catch unexpected errors
  }
};
```

**Why:** Database errors were completely unhandled. Now they're caught and you return a `500` with a meaningful message. Client knows evaluation succeeded but storage failed.

---

### **Issue #8: Routes Missing submitQuiz**
**Before:**
```javascript
import { generateQuiz } from "../controllers/quizController.js";
const router = express.Router();
router.post("/", generateQuiz);
export default router;
```

**After:**
```javascript
import { generateQuiz, submitQuiz } from "../controllers/quizController.js";
const router = express.Router();
router.post("/", generateQuiz);
router.post("/submit", submitQuiz);
export default router;
```

**Why:** `submitQuiz` was defined but had no route, so calling it would have returned 404 or no endpoint existed.

---

## 📍 URL Endpoints

### Generate Quiz
```
POST http://localhost:5000/api/quiz/
Content-Type: application/json

{
  "topic": "Artificial Intelligence"
}
```

### Submit Quiz
```
POST http://localhost:5000/api/quiz/submit
Content-Type: application/json

{
  "userId": "user123",
  "topic": "Artificial Intelligence",
  "answers": [
    {
      "question": "What is AI?",
      "user_answer": "A",
      "correct_answer": "A"
    }
  ]
}
```

---

## ✅ Verification Checklist

- [x] Request validation for all endpoints
- [x] Proper HTTP status codes (400, 500, 502, 503, 504)
- [x] Console logs with function context `[functionName]`
- [x] Axios timeout (30 seconds)
- [x] Error differentiation (connection vs timeout vs service error)
- [x] Response structure validation
- [x] Environment variable usage for AI_SERVICE_URL
- [x] Database error handling
- [x] Meaningful error messages for client
- [x] Routes properly defined for all endpoints

---

## 🚀 Files Modified

1. **backend/src/controllers/quizController.js** - Complete refactor
2. **backend/src/routes/quizRoutes.js** - Added submitQuiz route

---

## 🔧 Environment Setup

Create/update `.env` file in backend directory:
```
AI_SERVICE_URL=http://localhost:8000
```

For production, set it to your actual AI service URL:
```
AI_SERVICE_URL=https://api.your-domain.com/ai
```

