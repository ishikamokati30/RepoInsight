def build_prompt(query, context):
    return f"""
    Use the following context to answer:

    Context:
    {context}

    Question:
    {query}
    """