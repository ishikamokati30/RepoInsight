# Backend Error Handling & Testing Guide

## 🔧 What Was Fixed

### Issues Fixed:
1. ✅ **No Request Validation** → Added checks for required fields with helpful error messages
2. ✅ **No Error Logging** → Added detailed console logs with timestamps/context
3. ✅ **Poor Error Handling** → Separated axios errors (connection, timeout, service errors) from application errors
4. ✅ **Missing Timeout** → Added 30-second axios timeout to prevent hanging requests
5. ✅ **Unsafe Data Access** → Added validation of response structure before accessing nested properties
6. ✅ **Hard-coded localhost** → Using environment variable `AI_SERVICE_URL` consistently
7. ✅ **No AI Service Health Check** → Different HTTP status codes for different failure types (503 for unavailable, 502 for bad gateway)

### HTTP Status Codes Used:
- **400** - Bad Request (validation failed)
- **500** - Internal Server Error (unexpected application error)
- **502** - Bad Gateway (AI service returned error)
- **503** - Service Unavailable (AI service is down)
- **504** - Gateway Timeout (AI service too slow)

---

## 🧪 Testing Steps

### Prerequisites:
```bash
# Make sure both services are running
# Terminal 1 - Start Node.js backend:
cd backend
npm install
npm start  # Should run on http://localhost:5000

# Terminal 2 - Start AI service:
cd ai-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Test 1: Happy Path (Everything Works)
```bash
# Generate a quiz
POST http://localhost:5000/api/quiz/
Header: Content-Type: application/json
Body:
{
  "topic": "Artificial Intelligence"
}

# Expected response (200):
[
  {
    "id": 1,
    "question": "...",
    "options": ["A", "B", "C", "D"]
  },
  ...
]

# Check backend console for:
[generateQuiz] Generating quiz for topic: "Artificial Intelligence"
[generateQuiz] AI service response received successfully
[generateQuiz] Quiz generated successfully with X questions
```

### Test 2: Missing Required Field (Validation Error)
```bash
POST http://localhost:5000/api/quiz/
Body:
{}

# Expected response (400):
{
  "error": "Bad Request",
  "message": "topic is required and must be a non-empty string"
}

# Check backend console:
[generateQuiz] Validation failed: topic is missing or invalid
```

### Test 3: Empty String Topic (Validation Error)
```bash
POST http://localhost:5000/api/quiz/
Body:
{
  "topic": "   "
}

# Expected response (400):
{
  "error": "Bad Request",
  "message": "topic is required and must be a non-empty string"
}
```

### Test 4: AI Service is Down (Connection Error)
```bash
# Stop the AI service (Ctrl+C in ai-service terminal)

POST http://localhost:5000/api/quiz/
Body:
{
  "topic": "Machine Learning"
}

# Expected response (503):
{
  "error": "Service Unavailable",
  "message": "AI service is currently unavailable. Please try again later.",
  "details": "Could not connect to http://localhost:8000"
}

# Check backend console:
[generateQuiz] AI Service Connection Failed: http://localhost:8000 is unreachable
```

### Test 5: Submit Quiz (Happy Path)
```bash
POST http://localhost:5000/api/quiz/submit
Body:
{
  "userId": "user123",
  "topic": "AI",
  "answers": [
    {
      "question": "What is AI?",
      "user_answer": "A",
      "correct_answer": "A"
    }
  ]
}

# Expected response (200):
{
  "results": [
    {
      "is_correct": true,
      "feedback": "..."
    }
  ]
}

# Check console:
[submitQuiz] Processing 1 answers for userId: user123, topic: AI
[submitQuiz] AI service evaluation completed successfully
[submitQuiz] Saving 1 results to database...
[submitQuiz] All results saved to database successfully
```

### Test 6: Submit Quiz - Missing Fields
```bash
POST http://localhost:5000/api/quiz/submit
Body:
{
  "userId": "user123"
  // missing: answers, topic
}

# Expected response (400):
{
  "error": "Bad Request",
  "message": "answers is required and must be a non-empty array"
}
```

### Test 7: Invalid Answers Type
```bash
POST http://localhost:5000/api/quiz/submit
Body:
{
  "userId": "user123",
  "topic": "AI",
  "answers": "not-an-array"  // Should be array
}

# Expected response (400):
{
  "error": "Bad Request",
  "message": "answers is required and must be a non-empty array"
}
```

### Test 8: AI Service Timeout
```bash
# In your .env or environment, temporarily set:
AI_SERVICE_URL=http://localhost:1  # Invalid address

POST http://localhost:5000/api/quiz/
Body:
{
  "topic": "Test"
}

# Expected response (503 or timeout):
Will timeout after 30 seconds and return error
```

---

## 🐛 Debugging in Production

### Check Environment Variables
```bash
# Make sure .env is set correctly:
cat .env

# Should contain:
AI_SERVICE_URL=http://localhost:8000
# or your production AI service URL
```

### Enable Debug Mode
Add this to your server.js to see all requests:
```javascript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

### Monitor Logs
```bash
# In backend directory, run with logging:
npm start 2>&1 | tee server.log

# Watch logs in real-time:
tail -f server.log
```

### Check Network Connectivity
```bash
# Test if AI service is reachable:
curl -X GET http://localhost:8000/

# Test the actual endpoint:
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"message":"test","mode":"learning"}'
```

---

## 📊 Error Response Reference

| Scenario | Status | Error | Cause |
|----------|--------|-------|-------|
| Missing topic | 400 | Bad Request | Client sent invalid data |
| AI service down | 503 | Service Unavailable | Network/connectivity issue |
| AI service error | 502 | Bad Gateway | AI service returned error status |
| AI service slow | 504 | Gateway Timeout | Request took >30 seconds |
| DB save failed | 500 | Partial Error | Database connection issue |
| Unexpected error | 500 | Internal Server Error | Bug in backend code |

---

## 🚀 Next Steps

1. **Update .env** - Ensure `AI_SERVICE_URL` matches your setup
2. **Set appropriate timeouts** - Adjust 30-second timeout if needed
3. **Add API documentation** - Document expected request/response formats
4. **Setup monitoring** - Log errors to a service (e.g., Sentry, LogRocket)
5. **Add unit tests** - Test each error scenario
6. **Setup health checks** - Add `/health` endpoint to both services

