from app.rag.embed import get_embedding
from app.rag.vector_store import search


def retrieve_context(query: str):
    emb = get_embedding(query)
    results = search(emb)

    if not results:
        return "No relevant context found."

    return "\n".join(item["text"] for item in results)
