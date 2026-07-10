from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
import os

load_dotenv()

llm = ChatGoogleGenerativeAI(
     model="gemini-3.5-flash",
    temperature=0,
    max_retries=3,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def get_llm():
    """
    Returns a configured Gemini LLM Instance
    """
    return llm
