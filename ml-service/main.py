from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

app = FastAPI()

model = SentenceTransformer('all-MiniLM-L6-v2')

class TextInput(BaseModel):
    text: str

class SearchInput(BaseModel):
    query: str
    texts: list
    embeddings: list


@app.get("/")
def home():
    return {"message": "ML Service Running"}

@app.post("/embed")
def get_embedding(input: TextInput):
    embedding = model.encode(input.text).tolist()
    return {"embedding": embedding}

@app.post("/search-from-db")
def search_from_db(data: SearchInput):

    # ✅ Check empty embeddings
    if not data.embeddings or len(data.embeddings) == 0:
        return {"results": []}

    try:
        db_embeddings = np.array(data.embeddings).astype('float32')
    except:
        return {"results": []}

    # ✅ Encode query
    query_vec = model.encode(data.query).astype('float32')

    # ✅ Create FAISS index
    dim = db_embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)

    index.add(db_embeddings)

    # ✅ Search
    D, I = index.search(np.array([query_vec]), k=3)

    # ✅ Map results
    results = [data.texts[i] for i in I[0]]

    return {"results": results}