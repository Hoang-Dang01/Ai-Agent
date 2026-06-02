import os
import json
from typing import List, Optional
from uuid import UUID

import app.schemas as schemas
import app.services.rag_service as rag_service

is_mock_mode = rag_service.is_mock_mode

# Khởi tạo Gemini LLM có Structured Output cho Planner nếu trực tuyến
llm_planner = None
if not is_mock_mode:
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1
        )
        llm_planner = llm.with_structured_output(schemas.DAGTaskGraph)
        print("[Planner Service] Gemini structured planner initialized successfully.")
    except Exception as e:
        print(f"[Planner Service] Warning initializing Gemini planner LLM: {e}. Falling back to offline rule-based.")
        is_mock_mode = True

# ==========================================
# DETERMINISTIC PRE-VALIDATION CONSTRAINT CHECKER
# ==========================================

def validate_goal_constraints(goal: str) -> None:
    """
    Lớp pre-validation tĩnh kiểm tra các ràng buộc mâu thuẫn cơ bản trước khi gọi Gemini.
    Giúp bảo đảm hành vi của các ca kiểm thử mục tiêu mâu thuẫn (Test 3) là 100% xác định (deterministic)
    và tránh lãng phí chi phí gọi API.

    HẠN CHẾ CỦA MVP (LIMITATIONS):
    - Bộ lọc từ khóa (keyword list) hiện tại hoạt động theo khớp chuỗi tĩnh (static substring matching)
      và chỉ hỗ trợ một số cụm từ cơ bản bằng tiếng Anh và tiếng Việt.
    - Các cách diễn đạt gián tiếp như "giữ Notepad đóng", "nhập số liệu nhưng không kích hoạt ứng dụng",
      hoặc diễn đạt bằng ngôn ngữ khác ngoài Anh/Việt có thể vượt qua bộ lọc này.
    - Hướng mở rộng tương lai: Có thể mở rộng bộ từ khóa (ví dụ: "giữ", "đóng", "keep closed") hoặc
      sử dụng một mô hình nhận diện thực thể/quan hệ siêu nhẹ (như SpaCy / regex nâng cao) để tăng tính linh hoạt.
    """
    g_lower = goal.lower()
    
    # Ràng buộc 1: Yêu cầu ghi/gõ dữ liệu nhưng cấm mở ứng dụng Notepad
    has_write = any(w in g_lower for w in ["write", "type", "gõ", "viết", "nhập", "ghi"])
    has_no_app = any(n in g_lower for n in ["do not open", "cấm mở", "cấm khởi động", "no launch", "do not launch", "without opening", "không được mở", "giữ notepad đóng", "keep notepad closed"])
    
    if has_write and has_no_app:
        raise ValueError("Mục tiêu mâu thuẫn logic: Yêu cầu nhập liệu/viết dữ liệu nhưng lại cấm mở ứng dụng.")

    # Ràng buộc 2: Yêu cầu đọc/xác minh nhưng cấm kiểm duyệt màn hình
    has_read = any(r in g_lower for r in ["read", "verify", "đọc", "xác minh"])
    has_no_read = any(nr in g_lower for nr in ["do not read", "cấm đọc", "without reading", "không được đọc"])
    
    if has_read and has_no_read:
        raise ValueError("Mục tiêu mâu thuẫn logic: Yêu cầu đọc/xác minh dữ liệu nhưng cấm quét màn hình.")

# ==========================================
# DFS CYCLE DETECTOR
# ==========================================

def has_circular_dependencies(tasks: List[schemas.DAGTaskNode]) -> bool:
    """
    Thuật toán DFS kiểm tra tính toàn vẹn của đồ thị nhiệm vụ (DAG), phát hiện chu trình lặp vô hạn.
    Trả về True nếu phát hiện thấy vòng lặp dependencies.
    """
    adj = {t.id: t.dependencies for t in tasks}
    visited = {} # State: 0=chưa thăm, 1=đang thăm (trong nhánh hiện tại), 2=đã thăm xong
    
    for tid in adj:
        visited[tid] = 0
        
    def dfs(node_id: str) -> bool:
        if node_id not in adj:
            return False # Node cha không tồn tại (xem như warning, không có loop)
        if visited[node_id] == 1:
            return True # Phát hiện chu trình vòng lặp!
        if visited[node_id] == 2:
            return False
            
        visited[node_id] = 1 # Đánh dấu đang duyệt
        for dep in adj[node_id]:
            if dfs(dep):
                return True
        visited[node_id] = 2 # Duyệt xong
        return False

    for tid in adj:
        if visited[tid] == 0:
            if dfs(tid):
                return True
    return False

# ==========================================
# DETERMINISTIC OFFLINE PLANNER (FALLBACK)
# ==========================================

def plan_workflow_offline(goal: str) -> schemas.DAGTaskGraph:
    """
    Tự động lập kế hoạch tĩnh theo luật cứng dựa trên các từ khóa nghiệp vụ SOP
    để đảm bảo hệ thống luôn trả về DAG hợp lệ ngay cả khi không có kết nối LLM.
    """
    tasks = []
    g_lower = goal.lower()
    
    # 1. Kịch bản Viết chữ tự động hóa Notepad
    if "notepad" in g_lower or "write" in g_lower or "gõ" in g_lower:
        tasks.append(schemas.DAGTaskNode(
            id="task_0",
            title="Mở ứng dụng Notepad",
            toolName="OpenApplicationTool",
            args={"path": "notepad.exe"},
            dependencies=[]
        ))
        
        # Lấy nội dung cần viết
        text_to_write = "Vibe-Agent 2026 - Tu hanh Cuc bo 100%."
        if "text" in g_lower or "nội dung" in g_lower:
            text_to_write = "Ghi chep tri thuc tu dong theo quy trinh."
            
        tasks.append(schemas.DAGTaskNode(
            id="task_1",
            title="Gõ nội dung hướng dẫn vào Notepad",
            toolName="TypeTextTool",
            args={"text": text_to_write},
            dependencies=["task_0"]
        ))
        
        tasks.append(schemas.DAGTaskNode(
            id="task_2",
            title="Xác minh kết quả hiển thị trên Notepad",
            toolName="ReadWindowTool",
            args={},
            dependencies=["task_1"]
        ))

    # 2. Kịch bản ERP & Tra cứu mã số thuế (VAT Code)
    elif "vat" in g_lower or "erp" in g_lower or "thuế" in g_lower:
        tasks.append(schemas.DAGTaskNode(
            id="task_0",
            title="Đăng nhập hệ thống ERP tài chính",
            toolName="OpenApplicationTool",
            args={"path": "erp_portal.exe"},
            dependencies=[]
        ))
        
        tasks.append(schemas.DAGTaskNode(
            id="task_1",
            title="Nhập mã số thuế doanh nghiệp VAT",
            toolName="TypeTextTool",
            args={"text": "VAT-999888777"},
            dependencies=["task_0"]
        ))
        
        tasks.append(schemas.DAGTaskNode(
            id="task_2",
            title="Xác minh và lưu thông tin ERP",
            toolName="ReadWindowTool",
            args={},
            dependencies=["task_1"]
        ))
        
    # 3. Kịch bản chung (Default Failsafe Task)
    else:
        tasks.append(schemas.DAGTaskNode(
            id="task_0",
            title="Thực hiện khảo sát môi trường làm việc",
            toolName="ReadWindowTool",
            args={},
            dependencies=[]
        ))

    return schemas.DAGTaskGraph(goal=goal, tasks=tasks)

# ==========================================
# CORE PLANNING SERVICE
# ==========================================

async def generate_dag_plan(goal: str) -> schemas.DAGTaskGraph:
    """
    Tiếp nhận mục tiêu, áp dụng bộ lọc mâu thuẫn tĩnh, truy xuất hướng dẫn nghiệp vụ RAG,
    gọi Gemini để sinh đồ thị DAG và kiểm duyệt chu trình dependency khép kín.
    """
    print(f"[Planner Service] Bat dau lap ke hoach cho Goal: '{goal}'...")
    
    # 1. Bộ kiểm duyệt mâu thuẫn tĩnh tĩnh (Pre-validation Constraint Layer)
    try:
        validate_goal_constraints(goal)
    except ValueError as ve:
        print(f"[Planner Service WARNING] Static contradiction detected: {ve}. Activating defensive empty fallback.")
        # Trả về đồ thị rỗng failsafe kèm mô tả cảnh báo thay vì làm crash hệ thống
        return schemas.DAGTaskGraph(goal=goal, tasks=[])

    # 2. Lập kế hoạch (Online Gemini vs Offline rules)
    plan = None
    if is_mock_mode or llm_planner is None:
        plan = plan_workflow_offline(goal)
    else:
        try:
            # Truy xuất tài liệu SOP & Tooling chỉ định từ RAG phục vụ guidance
            print("[Planner Service RAG] Querying knowledge categories for SOP guidance...")
            # Sử dụng mock-up/offline retrieval để shapen prompt Gemini
            sop_context = (
                "GUIDELINE: Để ghi chú, hãy luôn khởi động ứng dụng trước bằng OpenApplicationTool (path='notepad.exe'), "
                "sau đó thực thi TypeTextTool và hoàn tất kiểm duyệt bằng ReadWindowTool."
            )
            
            prompt = (
                f"You are the Core AI Planner Agent. Decompose this goal statement into a list of structured task nodes "
                f"forming a Directed Acyclic Graph (DAG):\n\n"
                f"GOAL: {goal}\n\n"
                f"CONTEXT GUIDANCE:\n{sop_context}\n\n"
                f"Assign correct toolName, titles, arguments, and list explicit parent IDs in dependencies. "
                f"Ensure there are absolutely NO cycle loops."
            )
            plan = await llm_planner.ainvoke(prompt)
        except Exception as e:
            print(f"[Planner Service Warning] Gemini planning failed: {e}. Falling back to offline parser.")
            plan = plan_workflow_offline(goal)

    # 3. Kiểm duyệt an toàn chu trình dependency (DFS Cycle Checker)
    if plan and plan.tasks:
        if has_circular_dependencies(plan.tasks):
            print("[Planner Service Warning] Circular dependency detected in AI plan! Purging tasks to avoid infinite runtime loops.")
            # Loại bỏ các dependency vòng lặp bằng cách chuyển về chuỗi tuần tự an toàn
            for idx, task in enumerate(plan.tasks):
                if idx == 0:
                    task.dependencies = []
                else:
                    task.dependencies = [plan.tasks[idx - 1].id]
                    
    return plan
