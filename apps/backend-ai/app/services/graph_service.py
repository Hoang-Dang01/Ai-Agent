import os
import json
import asyncio
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from uuid import UUID

from app.database import AsyncSessionLocal
import app.models as models
import app.schemas as schemas
import app.services.rag_service as rag_service

is_mock_mode = rag_service.is_mock_mode

# Khóa kiểm duyệt ghi đồng thời chống race condition (Được tối ưu hóa bằng ref-count chống rò rỉ bộ nhớ)
_extraction_locks = {}
_extraction_locks_lock = asyncio.Lock()

@asynccontextmanager
async def get_extraction_lock(version_id: UUID):
    async with _extraction_locks_lock:
        if version_id not in _extraction_locks:
            # Lưu trữ cặp: [Đối tượng Lock, Số lượng luồng đang chờ (waiter count)]
            _extraction_locks[version_id] = [asyncio.Lock(), 0]
        
        lock_entry = _extraction_locks[version_id]
        lock_entry[1] += 1  # Tăng số lượng waiter

    # Chờ lấy khóa độc quyền cho version_id
    await lock_entry[0].acquire()
    try:
        yield
    finally:
        # Giải phóng khóa sau khi thực thi xong tác vụ
        lock_entry[0].release()
        
        # Tự động dọn dẹp khóa khỏi bộ nhớ nếu không còn luồng nào xếp hàng chờ
        async with _extraction_locks_lock:
            lock_entry[1] -= 1
            if lock_entry[1] == 0:
                if version_id in _extraction_locks:
                    del _extraction_locks[version_id]


# Khởi tạo Gemini LLM có ép kiểu dữ liệu đầu ra cấu trúc (Structured Output) nếu trực tuyến
llm_structured = None
if not is_mock_mode:
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.1
        )
        # Sử dụng LangChain structured output để buộc mô hình trả về đúng Pydantic schema
        llm_structured = llm.with_structured_output(schemas.ExtractedKnowledgeGraph)
        print("[Graph Service] Gemini structured extraction initialized successfully.")
    except Exception as e:
        print(f"[Graph Service] Warning initializing Gemini structured LLM: {e}. Falling back to rule-based.")
        is_mock_mode = True

# ==========================================
# DETERMINISTIC OFFLINE RULE-BASED EXTRACTOR
# ==========================================

def extract_graph_offline(text: str) -> schemas.ExtractedKnowledgeGraph:
    """
    Bộ trích xuất thực thể và liên kết ngoại tuyến theo từ điển luật cứng (Dev/Test convenience).
    Hoạt động như một chốt chặn an toàn (Defensive Fallback) ngăn chặn đổ vỡ hệ thống RAG.

    [Khả năng trích xuất (Capabilities)]
    - Quét khớp từ khóa trong văn bản thô dựa trên bộ từ điển đối sánh (Concept Map).
    - Tự động nhận dạng 7 thực thể cốt lõi thuộc ngữ cảnh RPA & ERP:
      + TypeTextTool (Tool): Công cụ gõ phím tự động.
      + Notepad (Application): Ứng dụng ghi chú Windows Notepad.
      + VAT Code (Concept): Mã số thuế giá trị gia tăng.
      + ERP System (Application): Cơ sở dữ liệu ERP doanh nghiệp.
      + Windows (Operating System): Hệ điều hành Microsoft Windows.
      + OpenApplicationTool (Tool): Công cụ khởi động phần mềm.
      + ReadWindowTool (Tool): Công cụ kiểm duyệt đọc thông tin cửa sổ.
    - Xây dựng 5 mối quan hệ logic liên kết chòm sao dựa trên cặp thực thể đồng xuất hiện:
      + TypeTextTool -> Notepad: "inputs_into" (Gõ chữ vào Notepad)
      + OpenApplicationTool -> Notepad: "launches" (Khởi động Notepad)
      + ReadWindowTool -> Notepad: "verifies" (Đọc xác minh Notepad)
      + Notepad -> Windows: "runs_on" (Chạy trên hệ điều hành Windows)
      + VAT Code -> ERP System: "stored_in" (Lưu trữ trong cơ sở dữ liệu ERP)

    [Hạn chế & Ranh giới (Limitations)]
    - Phân tích tĩnh (Static token mapping): Chỉ nhận dạng được các cụm từ khóa nằm trong danh sách khai báo cứng phía dưới. Không có khả năng suy luận ngữ nghĩa tự do như Gemini LLM.
    - Giới hạn phạm vi: Chỉ hoạt động tốt nhất cho các kịch bản kiểm thử tự động hóa Desktop ERP. Đối với các tài liệu chung khác không chứa các từ khóa này, bộ trích xuất sẽ trả về đồ thị rỗng.

    [Tính năng Tự quan sát (Observability)]
    - Bất kỳ khi nào cơ chế fallback kích hoạt, hệ thống sẽ in log cảnh báo phi tĩnh:
      `[Graph Service Warning] Gemini RAG extraction failed: [Error Details]. Falling back to offline rule-based parser.`
      giúp lập trình viên dễ dàng theo dõi chất lượng kết xuất thay vì gặp tình huống silent failure.
    """
    entities = []
    relations = []

    # Map các thực thể và liên kết chính trong kịch bản Notepad/ERP
    concept_map = {
        "TypeTextTool": ("TypeTextTool", "Tool", "Cong cu ghi chu tu dong"),
        "Notepad": ("Notepad", "Application", "Trinh soan thao Windows Notepad"),
        "VAT": ("VAT Code", "Concept", "Ma so thue gia tri gia tang"),
        "ERP": ("ERP System", "Application", "Co so du lieu ERP doanh nghiep"),
        "Windows": ("Windows", "Operating System", "He dieu hanh Microsoft Windows"),
        "OpenApplicationTool": ("OpenApplicationTool", "Tool", "Cong cu mo ung dung"),
        "ReadWindowTool": ("ReadWindowTool", "Tool", "Cong cu doc cua so")
    }

    # Bóc thực thể dựa trên từ khóa xuất hiện
    for kw, (name, label, desc) in concept_map.items():
        if kw.lower() in text.lower():
            entities.append(schemas.ExtractedEntity(name=name, label=label, description=desc))

    # Xây dựng mối liên kết logic nếu cặp thực thể đồng xuất hiện
    entity_names = {e.name for e in entities}
    
    if "TypeTextTool" in entity_names and "Notepad" in entity_names:
        relations.append(schemas.ExtractedRelation(source="TypeTextTool", target="Notepad", label="inputs_into"))
    if "OpenApplicationTool" in entity_names and "Notepad" in entity_names:
        relations.append(schemas.ExtractedRelation(source="OpenApplicationTool", target="Notepad", label="launches"))
    if "ReadWindowTool" in entity_names and "Notepad" in entity_names:
        relations.append(schemas.ExtractedRelation(source="ReadWindowTool", target="Notepad", label="verifies"))
    if "Notepad" in entity_names and "Windows" in entity_names:
        relations.append(schemas.ExtractedRelation(source="Notepad", target="Windows", label="runs_on"))
    if "VAT Code" in entity_names and "ERP System" in entity_names:
        relations.append(schemas.ExtractedRelation(source="VAT Code", target="ERP System", label="stored_in"))

    return schemas.ExtractedKnowledgeGraph(entities=entities, relations=relations)

# ==========================================
# GRAPH OPERATIONS SERVICE
# ==========================================

async def extract_and_save_graph(version_id: UUID, content: str):
    """
    Trích xuất đồ thị tri thức và lưu trữ có cơ chế kiểm duyệt chống trùng lặp (Idempotent Upsert)
    và bọc an toàn chống crash (Defensive Fallback).
    """
    async with get_extraction_lock(version_id):
        print(f"[Graph Service] Bat dau trich xuat graph cho Version {version_id}...")
        
        # 1. Trích xuất Thực thể & Liên kết (Online vs Offline)
        graph_data = None
        if is_mock_mode or llm_structured is None:
            graph_data = extract_graph_offline(content)
        else:
            try:
                # Gọi Gemini trực tuyến để bóc tách đồ thị có cấu trúc
                prompt = f"Extract all entities and relationships from this document version to construct a semantic knowledge graph:\n\n{content}"
                graph_data = await llm_structured.ainvoke(prompt)
            except Exception as e:
                print(f"[Graph Service] Gemini RAG extraction failed: {e}. Falling back to offline rule-based parser.")
                graph_data = extract_graph_offline(content)

        # 2. Phòng ngừa dữ liệu rỗng hoặc lỗi phân tích
        if not graph_data or (not graph_data.entities and not graph_data.relations):
            print(f"[Graph Service Warning] Empty graph extracted for Version {version_id}. Aborting insert.")
            return

        # 3. Giao dịch nguyên tử xóa cũ - nạp mới chống ghi lặp (Atomic Idempotent Upsert)
        async with AsyncSessionLocal() as db:
            try:
                # Purge existing graph nodes (will cascade delete related edges)
                print(f"[Graph Service DB] Purging existing nodes/edges for Version {version_id}...")
                await db.execute(
                    delete(models.GraphNode).where(models.GraphNode.version_id == version_id)
                )
                await db.flush()

                # Insert Nodes
                node_map = {} # Map tên node -> đối tượng DB để xây liên kết Edges
                for ent in graph_data.entities:
                    db_node = models.GraphNode(
                        version_id=version_id,
                        name=ent.name,
                        label=ent.label,
                        properties=ent.description
                    )
                    db.add(db_node)
                    node_map[ent.name] = db_node
                
                await db.flush() # Lấy ID của các Nodes vừa tạo

                # Insert Edges
                for rel in graph_data.relations:
                    source_node = node_map.get(rel.source)
                    target_node = node_map.get(rel.target)
                    
                    # Chỉ liên kết nếu cả 2 nodes đều tồn tại trong danh sách trích xuất
                    if source_node and target_node:
                        db_edge = models.GraphEdge(
                            version_id=version_id,
                            source_id=source_node.id,
                            target_id=target_node.id,
                            label=rel.label
                        )
                        db.add(db_edge)

                await db.commit()
                print(f"[Graph Service DB] Graph extraction saved for Version {version_id}: {len(node_map)} nodes, {len(graph_data.relations)} edges.")

                # Phát sự kiện KNOWLEDGE_GRAPH_UPDATED tới Event Bus Redis ngầm
                try:
                    import app.services.event_bus_service as event_bus_service
                    await event_bus_service.publish_event(
                        channel="ai_events",
                        event_type="KNOWLEDGE_GRAPH_UPDATED",
                        data={"version_id": str(version_id)}
                    )
                except Exception as ex_ev:
                    print(f"[Graph Service Event Bus Warning] Failed to publish graph update event: {ex_ev}")
            except Exception as e:
                await db.rollback()
                print(f"[Graph Service DB] Fail saving graph for Version {version_id}: {e}")



async def get_neighborhood_graph(db: AsyncSession, version_ids: list[UUID], limit: int = 15) -> list[dict]:
    """
    Lấy danh sách các liên kết đồ thị tri thức chòm sao (1-hop) cận kề các phiên bản tài liệu.
    Cắt ngưỡng tối đa (limit) 15 mối quan hệ để chống tràn context prompt.
    """
    if not version_ids:
        return []
        
    try:
        # Lấy các Edges có trong các phiên bản tài liệu được chỉ định
        result = await db.execute(
            select(models.GraphEdge)
            .where(models.GraphEdge.version_id.in_(version_ids))
            .limit(limit)
        )
        edges = result.scalars().all()
        
        # Nạp động các nodes thông tin đi kèm để định dạng câu lệnh trích nguồn
        neighbors = []
        for edge in edges:
            source_result = await db.execute(select(models.GraphNode).where(models.GraphNode.id == edge.source_id))
            target_result = await db.execute(select(models.GraphNode).where(models.GraphNode.id == edge.target_id))
            
            s = source_result.scalars().first()
            t = target_result.scalars().first()
            
            if s and t:
                neighbors.append({
                    "source": s.name,
                    "source_label": s.label,
                    "target": t.name,
                    "target_label": t.label,
                    "relation": edge.label
                })
        return neighbors
    except Exception as e:
        print(f"[Graph Service] Error fetching neighborhood graph: {e}")
        return []
