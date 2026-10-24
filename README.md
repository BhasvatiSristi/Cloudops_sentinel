# CloudOps Sentinel — Enterprise Incident Response Self-RAG Copilot

A production-style Self-RAG demo for cloud operations and incident response. It searches private operational knowledge in Pinecone first, self-grades the retrieved evidence, corrects weak retrieval/generation, and uses internet search only when the private knowledge base is insufficient.

The project also demonstrates LangGraph SQLite persistence memory so follow-up questions can reuse the same incident context through a stable thread_id.

## Groq structured output

Self-RAG decision, rewrite, relevance, support, and usefulness nodes use
`ChatGroq.with_structured_output(..., method="json_mode")`. This avoids
function-calling/tool-choice failures on Groq models that return JSON directly.
Prompts for those nodes require the exact JSON keys defined by their Pydantic
models.

Set `GROQ_MODEL` to a model available in the configured Groq account. If it is
not set, the application uses `llama-3.3-70b-versatile`.

Run the API with:

```powershell
.\venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```