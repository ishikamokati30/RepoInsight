from app.rag.embed import get_embedding
from app.rag.vector_store import add_document
from PyPDF2 import PdfReader

def chunk_text(text, chunk_size=300):
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)

    return chunks


def ingest_text(text):
    chunks = chunk_text(text)

    for chunk in chunks:
        emb = get_embedding(chunk)
        add_document(chunk, emb)

    return {"status": "ingested", "chunks": len(chunks)}


def ingest_pdf(file_path):
    reader = PdfReader(file_path)

    text = ""
    for page in reader.pages:
        text += page.extract_text()

    return ingest_text(text)