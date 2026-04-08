import faiss
import numpy as np

index = faiss.IndexFlatL2(384)
documents = []
metadata = []


def add_document(text, embedding):
    index.add(np.array([embedding]).astype("float32"))
    documents.append(text)
    metadata.append({"source": "uploaded_doc"})


def search(query_embedding, k=3):
    if not documents:
        return []

    limit = min(k, len(documents))
    _, indices = index.search(np.array([query_embedding]).astype("float32"), limit)

    results = []
    for i in indices[0]:
        if 0 <= i < len(documents):
            results.append({
                "text": documents[i],
                "source": metadata[i],
            })

    return results
