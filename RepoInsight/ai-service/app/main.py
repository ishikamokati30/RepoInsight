import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI
from app.graph.flow import run_flow

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

model = genai.GenerativeModel("gemini-2.5-flash")

@app.post("/query")
async def query(data: dict):
    try:
        response = model.generate_content(data["message"])
        return {"response": response.text}
    except Exception as e:
        return {"error": str(e)}

@app.post("/query")
async def query(data: dict):
    result = run_flow(data["message"], data.get("mode", "work"))
    return result