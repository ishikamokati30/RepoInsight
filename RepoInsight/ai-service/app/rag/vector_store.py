import faiss
import numpy as np

index = faiss.IndexFlatL2(384)

documents = []

def add_document(text, embedding):
    index.add(np.array([embedding]).astype("float32"))
    documents.append(text)

def search(query_embedding, k=3):
    D, I = index.search(np.array([query_embedding]).astype("float32"), k)
    return [documents[i] for i in I[0]]