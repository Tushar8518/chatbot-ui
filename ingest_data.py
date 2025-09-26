# ingest_data.py

from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter # CORRECTED LINE
import os
import shutil
import requests
import urllib3

# Globally disable security warnings for the session (required for some PAU URLs)
# This is a workaround for certificate verification failures.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
requests.packages.urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- Configuration ---
# NOTE: Switched to all-minilm for faster embedding generation than gemma:2b
OLLAMA_MODEL = "all-minilm" 
CHROMA_PATH = "chroma_db"
PDF_FILE_NAME = "pau_prospectus.pdf" 

# List of web URLs
PAU_URLS = [
    "https://www.pau.edu/", 
    "https://www.pau.edu/index.php?_act=manageResult&DO=viewResultDetail&intID=2", 
    "https://pau-apms.in/prospectus/courses.pdf", 
]

def load_documents():
    """Loads documents from both the provided URLs and the local PDF file."""
    documents = []
    
    # 1. Load Web Documents
    print("1. Loading documents from URLs...")
    for url in PAU_URLS:
        try:
            # Relying on global requests/urllib3 settings for SSL bypass
            web_loader = WebBaseLoader(url)
            documents.extend(web_loader.load())
            print(f"   -> Successfully loaded: {url}")
        except Exception as e:
            # We still expect errors for www.pau.edu, but we load what we can
            print(f"   ⚠️ Could not load URL {url}: {e}")

    # 2. Load PDF Document
    if os.path.exists(PDF_FILE_NAME):
        print(f"2. Loading document from PDF: {PDF_FILE_NAME}...")
        try:
            pdf_loader = PyPDFLoader(PDF_FILE_NAME)
            documents.extend(pdf_loader.load())
            print("   -> PDF loaded successfully.")
        except Exception as e:
            print(f"   ❌ Could not load PDF {PDF_FILE_NAME}: {e}")
    else:
        print(f"2. ❌ PDF file not found at '{PDF_FILE_NAME}'. Please check the file name and location.")
        
    return documents

def split_text(documents: list):
    """Splits loaded documents into smaller, manageable chunks."""
    print("3. Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"   -> Created {len(chunks)} text chunks.")
    return chunks

def main():
    """Main function to ingest data and create the Chroma DB."""
    
    # 1. Clear existing database (recommended for fresh data)
    if os.path.exists(CHROMA_PATH):
        print(f"Clearing existing database at {CHROMA_PATH}...")
        shutil.rmtree(CHROMA_PATH) 

    # 2. Load Data
    documents = load_documents()
    if not documents:
        print("❌ No documents loaded. Cannot proceed with database creation.")
        return

    # 3. Split Text
    chunks = split_text(documents)

    # 4. Create Embeddings
    print(f"4. Initializing Ollama Embeddings with model: {OLLAMA_MODEL}...")
    try:
        embeddings = OllamaEmbeddings(model=OLLAMA_MODEL)
    except Exception as e:
        print(f"   ❌ Error initializing Ollama Embeddings. Is 'ollama serve' running? Error: {e}")
        return

    # 5. Create Vector Database
    print(f"5. Creating and persisting Chroma DB in {CHROMA_PATH}...")
    Chroma.from_documents(
        chunks,
        embeddings,
        persist_directory=CHROMA_PATH
    )

    print("✅ Web and PDF data ingestion complete! Chroma DB is ready.")

if __name__ == "__main__":
    main()
