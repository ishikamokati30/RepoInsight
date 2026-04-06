import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

model =genai.GenerativeModel("gemini-1.5-flash-001")

@app.post("/query")
async def query(data: dict):
    try:
        response = model.generate_content(data["message"])
        return {"response": response.text}
    except Exception as e:
        return {"error": str(e)}