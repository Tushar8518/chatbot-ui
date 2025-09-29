from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.llms import Ollama
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
import uvicorn
import os

# --- Configuration ---
# NOTE: Must match the model used in ingest_data.py
OLLAMA_MODEL = "all-minilm" 
LLM_MODEL = "gemma-gpu" # Use a separate, larger model for generating the final answer
CHROMA_PATH = "chroma_db"

# --- Pydantic Model for Request Body ---
class ChatRequest(BaseModel):
    query: str

# --- FastAPI Initialization ---
app = FastAPI()

# --- START: CORS Configuration to fix 405 Method Not Allowed / 400 Bad Request ---
# Define which addresses (origins) are allowed to connect to this backend.
origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173", # Common dev server port
    "http://127.0.0.1:5173", # Common dev server port
    "http://localhost:5500", # Your frontend port (localhost)
    "http://127.0.0.1:5500", # Your frontend port (127.0.0.1)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # The list of allowed frontends
    allow_credentials=True,      # Allow cookies/auth headers
    allow_methods=["*"],         # Allow all methods (crucial for handling OPTIONS)
    allow_headers=["*"],         # Allow all headers
)
# --- END: CORS Configuration ---

# --- RAG Setup Variables ---
qa_chain = None

# --- Prompt Template for Contextual Q&A ---
PROMPT_TEMPLATE = """
You are an expert, helpful assistant for Punjab Agricultural University (PAU), Ludhiana.
Your primary role is to answer questions only based on the PAU admission and course information 
provided in the context below.

If the context does not contain the answer, you MUST state: 
"The context does not provide information about that specific detail, so I cannot answer this question based on the provided documents. Please check the official PAU prospectus or website."

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
"""

def setup_rag_chain():
    """Initializes the LLM, Embeddings, Vector Store, and the RAG Chain."""
    global qa_chain
    
    print("\n--- STARTING CHATBOT BACKEND ---")
    print(f"LLM used for answering: {LLM_MODEL}")
    print(f"Embedding model used for retrieval: {OLLAMA_MODEL}")
    print("Ensure 'ollama serve' is running in a separate terminal.")

    # 1. Initialize Ollama LLM (The one that generates the text answer)
    try:
        # CORRECTED INDENTATION
        llm = Ollama(model=LLM_MODEL, temperature=0.0) 
    except Exception as e:
        # CORRECTED INDENTATION
        print(f"❌ Error initializing Ollama LLM. Is 'ollama serve' running? Error: {e}")
        return

    # 2. Load Embeddings (The one that matches the DB)
    print("Loading local embeddings model...")
    embeddings = OllamaEmbeddings(model=OLLAMA_MODEL)

    # 3. Load Vector Store
    if not os.path.exists(CHROMA_PATH):
        print(f"❌ ERROR: Chroma DB not found at {CHROMA_PATH}.")
        print("Please run 'python ingest_data.py' first.")
        return

    print(f"Loading knowledge base from: {CHROMA_PATH}...")
    vector_store = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embeddings
    )

    # 4. Create Retriever
    retriever = vector_store.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"score_threshold": 5} 
    )

    # 5. Build the RAG Chain
    prompt = PromptTemplate(
        template=PROMPT_TEMPLATE, 
        input_variables=["context", "question"]
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff", 
        retriever=retriever,
        return_source_documents=False,
        chain_type_kwargs={"prompt": prompt}
    )

    print("✅ RAG Chain setup complete (using local models).")

# Run the setup function on startup
setup_rag_chain()


# --- FastAPI Routes ---

@app.get("/")
def read_root():
    """Health check for the root endpoint."""
    return {"status": "ok", "message": "PAU RAG Chatbot is running."}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    """Endpoint to handle user queries and return chatbot response."""
    if not qa_chain:
        return {"error": "RAG Chain is not initialized. Check server console for errors."}
        
    try:
         print(f"\n[DEBUG] Context Retrieved for '{request.query}':")
        for doc in docs:
            print(f"- Source: {doc.metadata.get('source')} | Content snippet: {doc.page_content[:50]}...")
        result = qa_chain.invoke({"query": request.query})
        # Returning 'response' key to match your script.js logic
        return {"response": result["result"].strip()} 
    except Exception as e:
        print(f"Error during chat query: {e}")
        return {"response": "An internal error occurred while processing your request."}

# --- Uvicorn Server Command ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
