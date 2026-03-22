import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

documents = []
vectors = []

def add_document(text):
    embedding = model.encode(text)
    documents.append(text)
    vectors.append(embedding)

def search(query):
    if not vectors:
        return []

    query_vec = model.encode(query)

    index = faiss.IndexFlatL2(len(query_vec))
    index.add(np.array(vectors))

    D, I = index.search(np.array([query_vec]), k=3)

    
    results = []
    for idx, dist in zip(I[0], D[0]):
        if dist < 1.5:  
            results.append(documents[idx])
    return results