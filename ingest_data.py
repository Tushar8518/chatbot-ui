import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

# --- Configuration ---
# NOTE: Ensure you have a PDF file named 'pau_web_content.pdf' in your root directory
PDF_PATH = "pau_web_content.pdf" 
VECTOR_DB_PATH = "chroma_db"

# CRITICAL FIX: Use the SAME model for embeddings as you use for the LLM in main.py
OLLAMA_MODEL = "gemma:2b" 

# --- Main Ingestion Logic ---
def ingest_data():
    """
    Loads documents from a PDF, splits them into chunks, creates embeddings
    using Ollama, and persists them to the Chroma vector store.
    """
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF file not found at {PDF_PATH}. Please place your document there.")
        return

    print(f"1. Loading document from {PDF_PATH}...")
    try:
        # Load the PDF content
        loader = PyPDFLoader(PDF_PATH)
        documents = loader.load()
    except Exception as e:
        print(f"Error loading PDF: {e}")
        return

    # Split documents into smaller, manageable chunks
    print("2. Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    texts = text_splitter.split_documents(documents)
    print(f"   -> Created {len(texts)} text chunks.")

    # Initialize the Ollama Embeddings model
    # This will now use the gemma:2b model's own embedding capabilities (2048 dims)
    print(f"3. Initializing Ollama Embeddings with model: {OLLAMA_MODEL}...")
    try:
        embeddings = OllamaEmbeddings(model=OLLAMA_MODEL)
    except Exception as e:
        print(f"Error initializing Ollama Embeddings. Ensure 'ollama serve' is running and model '{OLLAMA_MODEL}' is pulled. Error: {e}")
        return

    # Create the vector store and persist the embeddings
    print(f"4. Creating and persisting Chroma DB in {VECTOR_DB_PATH}...")
    try:
        # If chroma_db exists, this will load it. If it doesn't, it will create it.
        Chroma.from_documents(
            documents=texts,
            embedding=embeddings,
            persist_directory=VECTOR_DB_PATH
        )
        print("✅ Data ingestion complete! Chroma DB is ready.")
    except Exception as e:
        print(f"Error creating Chroma DB: {e}")
        print("This might be due to a previous dimension mismatch. Try deleting the 'chroma_db' folder and running this script again.")

if __name__ == "__main__":
    ingest_data()
