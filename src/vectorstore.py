
from functools import lru_cache

from pinecone import Pinecone, ServerlessSpec
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq

from src.config import get_settings


@lru_cache(maxsize=1)
def get_embeddings():
    """Initialize and cache the Hugging Face embedding model."""
    s = get_settings()

    return HuggingFaceEmbeddings(
        model_name=s.embedding_model,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


@lru_cache(maxsize=1)
def get_llm():
    """Initialize and cache the Groq chat model."""
    s = get_settings()

    if not s.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    return ChatGroq(
        api_key=s.groq_api_key,
        model=s.groq_model,
        temperature=0,
    )


@lru_cache(maxsize=1)
def get_pinecone_client():
    """Initialize and cache the Pinecone client."""
    s = get_settings()

    if not s.pinecone_api_key:
        raise RuntimeError("PINECONE_API_KEY is not configured")

    return Pinecone(api_key=s.pinecone_api_key)


def ensure_index():
    """Create the Pinecone index if needed and validate its dimensions."""
    s = get_settings()
    pc = get_pinecone_client()

    embedding_dimension = len(
        get_embeddings().embed_query("dimension check")
    )

    existing_indexes = {index.name for index in pc.list_indexes()}

    if s.pinecone_index_name not in existing_indexes:
        pc.create_index(
            name=s.pinecone_index_name,
            dimension=embedding_dimension,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=s.pinecone_cloud,
                region=s.pinecone_region,
            ),
        )
    else:
        desc = pc.describe_index(s.pinecone_index_name)

        existing_dimension = getattr(desc, "dimension", None)

        if existing_dimension is None and isinstance(desc, dict):
            existing_dimension = desc.get("dimension")

        if (
            existing_dimension is not None
            and int(existing_dimension) != embedding_dimension
        ):
            raise RuntimeError(
                f"Pinecone index '{s.pinecone_index_name}' has dimension "
                f"{existing_dimension}, but the Hugging Face embedding model "
                f"produces vectors of dimension {embedding_dimension}. "
                "Use a new index name or recreate the index with the correct "
                "dimension."
            )

    return pc.Index(s.pinecone_index_name)


@lru_cache(maxsize=1)
def get_vector_store():
    """Initialize the Pinecone vector store."""
    s = get_settings()

    return PineconeVectorStore(
        index=ensure_index(),
        embedding=get_embeddings(),
        namespace=s.pinecone_namespace,
    )


def get_retriever():
    """Return a retriever configured with the requested top-k value."""
    s = get_settings()

    return get_vector_store().as_retriever(
        search_kwargs={"k": s.top_k}
    )
