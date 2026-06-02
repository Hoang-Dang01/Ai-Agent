import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

embeddings_model = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.2
)

async def generate_embedding(text: str) -> list[float]:
    return await embeddings_model.aembed_query(text)

async def generate_chat_response(query: str, context: str) -> str:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI assistant for a personal knowledge base. Answer the user's question based strictly on the provided context. If the answer is not in the context, say so.\n\nContext:\n{context}"),
        ("human", "{query}")
    ])
    chain = prompt | llm
    response = await chain.ainvoke({"context": context, "query": query})
    return response.content
