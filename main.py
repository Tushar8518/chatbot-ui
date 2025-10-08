import os
import asyncio
from typing import Dict, Any, List
# New imports for type hinting
from langchain_core.documents import Document

# Core FastAPI and Pydantic
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# LangChain Components (Modern and stable Imports)
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from langchain.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_message_histories import ChatMessageHistory 
from langchain_core.messages import BaseMessage
from langchain_core.runnables.history import RunnableWithMessageHistory 

# Uvicorn is required for running the server
import uvicorn 

# --- CONFIGURATION ---
OLLAMA_EMBEDDING_MODEL = "all-minilm" 
OLLAMA_LLM_MODEL = "llama3:8b" 
CHROMA_PATH = "chroma_db"
# --- END CONFIGURATION ---

# --- GLOBAL STATE ---
rag_chain_with_history = None
STORE: Dict[str, ChatMessageHistory] = {} 
# --- END GLOBAL STATE ---

# --- Pydantic Models for API ---
class ChatRequest(BaseModel):
    message: str
    session_id: str
    
class ChatResponse(BaseModel):
    response: str
    
# --- FastAPI App Setup ---
app = FastAPI()

origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

## History Management
def get_session_history(session_id: str) -> ChatMessageHistory:
    """Returns the chat history object for a given session ID."""
    global STORE
    if session_id not in STORE:
        STORE[session_id] = ChatMessageHistory()
    return STORE[session_id]

## RAG Setup Functions
# ✅ FIX: Change type hint from BaseMessage to Document for clarity (using the new import)
def format_docs(docs: List[Document]) -> str:
    """Formats retrieved documents into a single string for the prompt."""
    return "\n\n".join(doc.page_content for doc in docs)

def setup_rag_chain():
    """Initializes and configures the RAG chain components."""
    global rag_chain_with_history
    
    # 1. Embeddings and Vector Store
    try:
        embedding_function = OllamaEmbeddings(model=OLLAMA_EMBEDDING_MODEL)
        vector_store = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
        # ✅ FIX: Lower k from 8 to 4 to reduce latency
        retriever = vector_store.as_retriever(k=4) 
    except Exception as e:
        print(f"Error initializing vector store or embeddings: {e}")
        raise RuntimeError("Failed to initialize RAG components.") from e

    # 2. LLM and Prompts
    llm = Ollama(model=OLLAMA_LLM_MODEL)

    # Prompt for History-Aware Retrieval (Contextualization)
    # 🚨 CRITICAL FIX: Aggressive Context Reset Prompt
    contextualize_q_system_prompt = (
        "Given the chat history and the latest user question, formulate a standalone question. "
        "This new question must be complete and retrieve the most accurate documents. "
        "**CRITICAL RULE: Only use the chat history if the user's latest question is short, vague, "
        "or a clear follow-up (e.g., 'What about that?', 'And the fee?').** "
        "If the new question introduces a completely different topic (e.g., switching from 'Admission' to 'Library') "
        "or is a fully formed sentence, you **MUST** return the original question unchanged. "
        "Do NOT answer the question. Only reformulate it if necessary."
    )
    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            ("placeholder", "{chat_history}"),
            ("human", "{question}"),
        ]
    )
    
    history_aware_retriever = contextualize_q_prompt | llm | StrOutputParser() | retriever

    # Prompt for Final Answer Generation (RAG) (Unchanged but remains good practice)
    qa_system_prompt = (
        "You are an expert chatbot for Punjab Agricultural University (PAU). "
        "Answer the user's question ONLY based on the provided context. "
        "**Do not invent or assume information.** " 
        "Format the answer clearly using Markdown (e.g., **bold**, lists). "
        "\n\n"
        "CRITICAL RULE: If the context does not contain the answer, "
        "you MUST politely decline to answer, stating: **'I apologize, but I couldn't find specific information on that topic in my current PAU knowledge base.'**"
        "\n\n"
        "Context:\n{context}"
    )
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", qa_system_prompt),
            ("placeholder", "{chat_history}"),
            ("human", "{question}"),
        ]
    )

    # 3. Final Answer Generation Chain
    final_answer_chain = qa_prompt | llm | StrOutputParser()

    # 4. Full RAG Chain with Contextualization
    rag_chain = (
        RunnablePassthrough.assign(
            question=lambda x: x["question"],
            chat_history=lambda x: x["chat_history"],
            context=history_aware_retriever,
        )
        .assign(context=lambda x: format_docs(x["context"])) 
        | final_answer_chain
    )

    # 5. Attach History to the RAG Chain
    rag_chain_with_history = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="question", 
        history_messages_key="chat_history", 
    )
    print("RAG chain initialized successfully. ✅")

# --- Application Lifecycle ---
@app.on_event("startup")
async def startup_event():
    """Runs RAG chain setup when the application starts."""
    try:
        await asyncio.to_thread(setup_rag_chain) 
    except RuntimeError as e:
        print(f"FATAL RAG SETUP ERROR: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during startup: {e}")

# --- API Endpoints ---
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest):
    """Handles the user chat request by running it through the RAG chain."""
    global rag_chain_with_history

    if rag_chain_with_history is None:
        raise HTTPException(
            status_code=503, 
            detail="RAG chain not initialized. Server is starting up or failed to load data."
        )

    try:
        config = {"configurable": {"session_id": chat_request.session_id}}
        
        response = await rag_chain_with_history.ainvoke(
            {"question": chat_request.message}, 
            config=config
        )
        
        if isinstance(response, str):
            return ChatResponse(response=response)
        else:
            raise ValueError("RAG chain returned an invalid response type.")

    except Exception as e:
        print(f"Error during RAG chain invocation for session {chat_request.session_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during processing.")

# ✅ FIX: New endpoint to clear history from the frontend
@app.post("/clear_history")
async def clear_history_endpoint(chat_request: ChatRequest):
    """Clears the chat history for a given session ID."""
    global STORE
    session_id = chat_request.session_id
    if session_id in STORE:
        del STORE[session_id]
        print(f"Chat history cleared for session: {session_id}")
        return JSONResponse(content={"message": "History cleared"}, status_code=200)
    
    return JSONResponse(content={"message": "No history to clear"}, status_code=200)


# --- Command Line Execution ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        timeout_keep_alive=1 
    )
