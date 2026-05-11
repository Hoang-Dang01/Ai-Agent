from langchain.tools import StructuredTool
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.chat_models import ChatOpenAI # Hoặc ChatOllama, ChatAnthropic tùy cấu hình

# Import 5 tools từ thư mục tools
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.knowledge_retriever import retrieve_knowledge
from tools.python_sandbox import execute_python_code
from tools.web_scout import web_search, scrape_url
from tools.progress_tracker import update_learning_progress
from tools.n8n_webhook import trigger_n8n_workflow

# 1. Bọc các hàm Python thành LangChain Tools
tools = [
    StructuredTool.from_function(
        func=retrieve_knowledge,
        name="Librarian_RAG",
        description="Tìm kiếm và trích xuất kiến thức chuyên môn từ Vector Database (PostgreSQL/pgvector)."
    ),
    StructuredTool.from_function(
        func=execute_python_code,
        name="Math_Specialist",
        description="Thực thi mã nguồn Python an toàn. Dùng để tính toán phức tạp hoặc kiểm thử logic."
    ),
    StructuredTool.from_function(
        func=web_search,
        name="Scout_WebSearch",
        description="Lướt web và tìm kiếm thông tin mới nhất trên Google."
    ),
    StructuredTool.from_function(
        func=update_learning_progress,
        name="Academic_Coach",
        description="Cập nhật tiến độ học tập hàng ngày của người dùng vào cơ sở dữ liệu."
    ),
    StructuredTool.from_function(
        func=trigger_n8n_workflow,
        name="Orchestrator_n8n",
        description="Kích hoạt kịch bản tự động hóa n8n (Gửi Email, Lưu Drive)."
    )
]

def initialize_agent():
    """
    Khởi tạo LangChain Agent với bộ 5 Tools sinh tồn.
    """
    # Khởi tạo mô hình ngôn ngữ (Ví dụ dùng ChatOpenAI nhưng trỏ API Base về mô hình nội bộ nếu cần)
    llm = ChatOpenAI(temperature=0.2, model="gpt-4-turbo-preview") # Placeholder
    
    # Định nghĩa Prompt hệ thống (Hiến pháp của Agent)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bạn là một Gia sư Quốc dân AI (Turing Drone). "
                   "Bạn có một bộ công cụ (Tools) mạnh mẽ để hỗ trợ học viên. "
                   "Hãy suy nghĩ kỹ lưỡng (ReAct) trước khi trả lời. Nếu không biết, hãy dùng Scout_WebSearch hoặc Librarian_RAG."),
        ("user", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    # Tạo Agent
    agent = create_openai_functions_agent(llm, tools, prompt)
    
    # Tạo Executor (Bộ chạy Agent)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    return agent_executor

def run_agent(query: str):
    executor = initialize_agent()
    response = executor.invoke({"input": query})
    return response["output"]

if __name__ == "__main__":
    # Test thử agent
    print("Khởi động Agent với 5 Tools...")
    # LƯU Ý: Chạy thực tế cần set API_KEY hoặc cấu hình Ollama
    # print(run_agent("Tổng của 51234 và 9876 là bao nhiêu? Hãy viết code Python để tính."))
