# 🔍 Quick Debugging Checklist for 500 Errors

## Step 1: Check Console Logs
```bash
# Look for any of these logs:
[generateQuiz] Validation failed: topic is missing or invalid
[generateQuiz] AI Service Connection Failed
[generateQuiz] AI service response received successfully
[generateQuiz] Invalid response structure from AI service

# OR

[submitQuiz] Validation failed
[submitQuiz] Processing X answers
[submitQuiz] Database error while saving results
```

## Step 2: Verify AI Service is Running
```bash
# In a terminal, test the AI service:
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"message":"test","mode":"learning"}'

# Should return quiz data, not an error
```

## Step 3: Check Request Format

### For Generate Quiz:
```bash
# CORRECT:
curl -X POST http://localhost:5000/api/quiz/ \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI"}'

# WRONG - Missing topic:
curl -X POST http://localhost:5000/api/quiz/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

### For Submit Quiz:
```bash
# CORRECT:
curl -X POST http://localhost:5000/api/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user123",
    "topic":"AI",
    "answers":[{"question":"Q","user_answer":"A","correct_answer":"A"}]
  }'

# WRONG - Missing answers:
curl -X POST http://localhost:5000/api/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","topic":"AI"}'
```

## Step 4: Common Issues & Solutions

### 502 Bad Gateway
**Cause:** AI service returned an error
**Solution:**
```bash
# Check AI service response:
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"message":"test","mode":"learning"}'

# Look for error details in the response
```

### 503 Service Unavailable
**Cause:** Can't connect to AI service
**Solution:**
```bash
# Check if AI service is running:
ps aux | grep uvicorn  # on Linux/Mac
tasklist | findstr python  # on Windows

# Check port is open:
netstat -an | grep 8000  # on Linux/Mac
netstat -ano | findstr 8000  # on Windows

# Restart AI service:
cd ai-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 504 Gateway Timeout
**Cause:** AI service taking >30 seconds
**Solution:**
```bash
# Check if AI service is overloaded:
# - Monitor CPU/memory on AI service
# - Check if model loading is slow
# - Increase timeout in quizController.js if needed:

const aiService = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 60000, // Increase to 60 seconds
});
```

### 400 Bad Request
**Cause:** Missing or invalid fields
**Solution:** Check the error message and provide required fields:
- `topic` must be a non-empty string
- `userId` must be a non-empty string
- `answers` must be a non-empty array

---

## Step 5: Advanced Debugging

### Enable Detailed Logging
Add this to server.js after `app.use(cors())`:

```javascript
// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});
```

### Check Network with Detailed Error Info
In quizController.js, you'll see detailed errors like:
```
[generateQuiz] AI Service Connection Failed: http://localhost:8000 is unreachable
```

This tells you:
- Is it a connection issue? (ECONNREFUSED)
- Is it a timeout? (timeout of 30000ms exceeded)
- Is it a DNS issue? (ENOTFOUND)
- Is it an AI service error? (response status + data)

### Test With Thunder Client/Postman

**Tab 1: Test Route Exists**
```
GET http://localhost:5000/api/quiz
```
Should return 404 (GET not allowed, but route exists)

**Tab 2: Generate Quiz**
```
POST http://localhost:5000/api/quiz
Headers:
  Content-Type: application/json

Body:
{
  "topic": "React"
}
```
Should return 200 with quiz array

**Tab 3: Submit Quiz**
```
POST http://localhost:5000/api/quiz/submit
Headers:
  Content-Type: application/json

Body:
{
  "userId": "user123",
  "topic": "React",
  "answers": [
    {
      "question": "What is React?",
      "user_answer": "A",
      "correct_answer": "A"
    }
  ]
}
```
Should return 200 with evaluation results

---

## Step 6: Double-Check Configuration

### .env File
```bash
# backend/.env
cat .env

# Should show:
AI_SERVICE_URL=http://localhost:8000
```

### Server.js
```bash
# Should include:
app.use(express.json());  # REQUIRED to parse request body
```

### Routes
```bash
# backend/src/routes/quizRoutes.js
# Should have:
router.post("/", generateQuiz);
router.post("/submit", submitQuiz);
```

---

## Still Getting 500?

If after these steps you still get a 500 error:

1. **Check backend console** for exact error message
2. **Check AI service logs** for what it received/returned
3. **Verify .env is loaded** - restart backend after changing .env
4. **Check Node.js version** - use Node 16+
5. **Check port conflicts** - make sure 5000 isn't in use
6. **Clear node_modules and reinstall** - sometimes fixes import issues

```bash
cd backend
rm -rf node_modules package-lock.json  # on Linux/Mac
rmdir /s node_modules & del package-lock.json  # on Windows
npm install
npm start
```

---

## Response Status Codes Quick Reference

| Status | Meaning | Action |
|--------|---------|--------|
| **200** | Success ✅ | All good |
| **400** | Bad Request | Fix your request - missing/invalid fields |
| **500** | Internal Error | Check backend logs - backend code bug |
| **502** | Bad Gateway | Check AI service logs - AI service error |
| **503** | Unavailable | Start AI service |
| **504** | Timeout | AI service is slow, check its logs |

