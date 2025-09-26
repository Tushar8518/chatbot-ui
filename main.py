import os
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
# --- CRITICAL CHANGE BELOW ---
from langchain_community.chat_models import ChatOllama # <-- CORRECTED IMPORT
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from fastapi.middleware.cors import CORSMiddleware
# --- Configuration ---
VECTOR_DB_PATH = "chroma_db"
OLLAMA_MODEL = "gemma:2b" # Use the model you configured during ingestion

# --- FastAPI Setup ---
app = FastAPI()

# ----------------------------------------------------
# 🚨 CRITICAL FIX: CORS MIDDLEWARE
# This allows your frontend (which runs on a different port or as a local file)
# to make API calls to your Python backend (port 8000).
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows ALL origins (simple for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (POST, GET, etc.)
    allow_headers=["*"],  # Allows all headers
)
# ----------------------------------------------------

# Define the input structure for the chat endpoint
class QueryModel(BaseModel):
    query: str

# --- RAG Setup (Moved to a function for clean initialization) ---

def setup_rag_chain():
    print("Loading local embeddings model...")
    # Use the same embeddings model used during ingestion
    embeddings = OllamaEmbeddings(model=OLLAMA_MODEL) 

    print(f"Loading knowledge base from: {VECTOR_DB_PATH}...")
    vector_db = Chroma(persist_directory=VECTOR_DB_PATH, embedding_function=embeddings)
    
    # Initialize the LLM (ChatOllama)
    llm = ChatOllama(model=OLLAMA_MODEL, temperature=0.0)

    # Define a specific prompt template for the RAG chain
    template = """
    You are the **PAU InfoBot**, an expert assistant for Punjab Agricultural University (PAU). 
    Use the following context to answer the user's question accurately and concisely. 
    If the question is about PAU, strictly use the provided context. 
    If the context does not contain the answer, state that you do not have information specific to PAU for that query, 
    but you can answer general knowledge questions.

    Context: {context}
    Question: {question}
    Answer:
    """
    RAG_PROMPT = PromptTemplate(template=template, input_variables=["context", "question"])

    # Create the Retrieval-Augmented Generation chain
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff", # 'stuff' is simplest, passing all retrieved documents to the LLM
        retriever=vector_db.as_retriever(search_kwargs={"k": 3}), # Retrieve top 3 documents
        chain_type_kwargs={"prompt": RAG_PROMPT},
        return_source_documents=False # Set to True if you want to see the sources
    )
    
    print("✅ RAG Chain setup complete (using local models).")
    return rag_chain

# Global variable for the RAG chain
rag_chain = setup_rag_chain()


# --- API Endpoint ---

@app.post("/chat")
async def chat_endpoint(query_data: QueryModel):
    """
    Processes a user query using the RAG chain and returns the response.
    """
    try:
        # Get the response from the RAG chain
        result = rag_chain.invoke(query_data.query)
        
        # The result is typically a dictionary like {'query': '...', 'result': '...'}
        response_text = result.get('result', "Sorry, I couldn't generate a specific answer. Please try rephrasing.")
        
        return {"response": response_text}
        
    except Exception as e:
        # Log the error for debugging
        print(f"An error occurred during RAG chain execution: {e}")
        # Return a user-friendly error response
        return {"response": "An unexpected error occurred on the server while processing your request. Please check the backend logs."}

# --- Main Execution (For running directly with Uvicorn) ---
if __name__ == "__main__":
    import uvicorn
    print("\n--- STARTING CHATBOT BACKEND ---")
    print(f"Ollama Model used: {OLLAMA_MODEL}")
    print("Ensure 'ollama serve' is running in a separate terminal.")
    # Run Uvicorn server (accessible at http://127.0.0.1:8000)
    uvicorn.run(app, host="0.0.0.0", port=8000)
