from fastapi import FastAPI
from pydantic import BaseModel
from app.search import add_document, search
from sentence_transformers import SentenceTransformer

app = FastAPI()

model = SentenceTransformer('all-MiniLM-L6-v2')
class TextInput(BaseModel):
    text: str

@app.post("/add")
def add_doc(input: TextInput):
    add_document(input.text)
    return {"message": "Document added"}

@app.post("/search")
def search_docs(input: TextInput):
    results = search(input.text)
    return {"results": results}

@app.get("/")
def home():
    return {"message": "ML Service Running"}

@app.post("/embed")
def get_embedding(text: str):
    embedding = model.encode(text).tolist()
    return {"embedding": embedding}

@app.post("/search-from-db")
def search_from_db(data: dict):
    query = data["query"]
    db_embeddings = data["embeddings"]
    db_texts = data["texts"]

    if not db_embeddings:
        return {"results": []}

    import numpy as np
    import faiss

    query_vec = model.encode(query)

    index = faiss.IndexFlatL2(len(query_vec))
    index.add(np.array(db_embeddings))

    D, I = index.search(np.array([query_vec]), k=3)

    results = [db_texts[i] for i in I[0]]
    return {"results": results}