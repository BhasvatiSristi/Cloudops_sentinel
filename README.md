# CloudOps Sentinel — Enterprise Incident Response Self-RAG Copilot

A production-style Self-RAG demo for cloud operations and incident response. It searches private operational knowledge in Pinecone first, self-grades the retrieved evidence, corrects weak retrieval/generation, and uses internet search only when the private knowledge base is insufficient.

The project also demonstrates LangGraph SQLite persistence memory so follow-up questions can reuse the same incident context through a stable thread_id.