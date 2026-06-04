import os
import json
import time
import uuid
from typing import List, Optional, Dict, Any
from uuid import UUID
from langchain_core.callbacks import BaseCallbackHandler

class TelemetryCallbackHandler(BaseCallbackHandler):
    def __init__(self):
        super().__init__()
        self.input_tokens = 0
        self.output_tokens = 0
        self.model_name = "gemini-1.5-flash"

    def on_llm_end(self, response, **kwargs):
        try:
            if response.llm_output:
                token_usage = response.llm_output.get("token_usage", {})
                if token_usage:
                    self.input_tokens = token_usage.get("prompt_tokens", 0)
                    self.output_tokens = token_usage.get("completion_tokens", 0)
            
            if response.generations and len(response.generations) > 0:
                gen = response.generations[0][0]
                if hasattr(gen, 'message') and gen.message:
                    msg = gen.message
                    if hasattr(msg, 'response_metadata') and msg.response_metadata:
                        meta = msg.response_metadata
                        if not self.input_tokens:
                            usage = meta.get("token_usage", {})
                            self.input_tokens = usage.get("prompt_tokens", 0) or usage.get("input_tokens", 0) or 0
                            self.output_tokens = usage.get("completion_tokens", 0) or usage.get("output_tokens", 0) or 0
                        if "model_name" in meta:
                            self.model_name = meta["model_name"]
        except Exception as e:
            print(f"[Telemetry Callback Error] {e}")

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
# DYNAMIC TOOLS CATALOG LOADING & VERSION CHECK
# ==========================================
CATALOG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../tools_catalog.json"))
SUPPORTED_TOOLS = {}

class UnknownEntityTypeError(ValueError):
    pass

class UnknownPredicateError(ValueError):
    pass

def validate_catalog_schema(data: dict) -> None:
    """
    Validate the catalog JSON structure against expected schema rules.
    """
    if "schemaVersion" not in data or "tools" not in data:
        raise ValueError("Catalog JSON is missing required root fields: schemaVersion or tools.")
    for tool in data.get("tools", []):
        if "name" not in tool or "description" not in tool:
            raise ValueError("Tool entry in catalog is missing 'name' or 'description'.")
        # Validate preconditions structure
        for pre in tool.get("preconditions", []):
            for field in ["Predicate", "EntityType", "TargetValue"]:
                if field not in pre and field.lower() not in pre:
                    raise ValueError(f"Precondition in tool '{tool.get('name')}' is missing required field '{field}'.")
        # Validate effects structure
        for eff in tool.get("effects", []):
            for field in ["Predicate", "EntityType", "TargetValue"]:
                if field not in eff and field.lower() not in eff:
                    raise ValueError(f"Effect in tool '{tool.get('name')}' is missing required field '{field}'.")

def get_recognized_metadata():
    """
    Dynamically extract recognized EntityTypes and Predicates from all registered tools in SUPPORTED_TOOLS.
    Allows dynamic tool expansion (like MockMountVolumeTool and MockEncryptionTool in tests)
    while strictly catching typos like 'fiel' and invalid predicates to ensure fail-closed execution.
    """
    # Only internal system coordinator entities/predicates used by the engine itself are seeded.
    # All resource types (file, network, app, etc.) and tool predicates are extracted dynamically from catalog.
    valid_entities = {"global_keep_open"}
    valid_predicates = {"allowed"}
    
    for tool in SUPPORTED_TOOLS.values():
        for pre in tool.get("preconditions", []):
            e_type = pre.get("EntityType") or pre.get("entityType")
            pred = pre.get("Predicate") or pre.get("predicate")
            if e_type:
                valid_entities.add(e_type.lower())
            if pred:
                valid_predicates.add(pred.lower())
        for eff in tool.get("effects", []):
            e_type = eff.get("EntityType") or eff.get("entityType")
            pred = eff.get("Predicate") or eff.get("predicate")
            if e_type:
                valid_entities.add(e_type.lower())
            if pred:
                valid_predicates.add(pred.lower())
                
    return valid_entities, valid_predicates

def load_tools_catalog():
    global SUPPORTED_TOOLS
    if not os.path.exists(CATALOG_PATH):
        # Create a default tools catalog matching the schema if not generated yet
        default_catalog = {
            "schemaVersion": 1,
            "generatedAt": "2026-06-04T16:13:15Z",
            "tools": [
                {
                    "name": "OpenApplicationTool",
                    "description": "Khởi chạy một ứng dụng mới hoặc kết nối vào tiến trình đang chạy (Ví dụ: notepad.exe).",
                    "requiredCapabilities": ["LaunchApps"],
                    "preconditions": [
                        {
                            "Predicate": "allowed",
                            "EntityType": "app_open",
                            "EntityIdParameter": None,
                            "TargetValue": True
                        }
                    ],
                    "effects": [
                        {
                            "Predicate": "running",
                            "EntityType": "app",
                            "EntityIdParameter": "exePath",
                            "TargetValue": True
                        }
                    ],
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "exePath": {
                                "type": "string",
                                "description": "Đường dẫn vật lý đến file thực thi (.exe) của ứng dụng."
                            }
                        },
                        "required": ["exePath"]
                    }
                },
                {
                    "name": "TypeTextTool",
                    "description": "Gõ phím hoặc điền văn bản vào vùng nhập liệu của ứng dụng hiện hành.",
                    "requiredCapabilities": ["KeyboardInput"],
                    "preconditions": [
                        {
                            "Predicate": "allowed",
                            "EntityType": "write",
                            "EntityIdParameter": None,
                            "TargetValue": True
                        }
                    ],
                    "effects": [
                        {
                            "Predicate": "written",
                            "EntityType": "text",
                            "EntityIdParameter": None,
                            "TargetValue": True
                        }
                    ],
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "text": {
                                "type": "string",
                                "description": "Văn bản cần gõ hoặc điền vào Notepad."
                            }
                        },
                        "required": ["text"]
                    }
                },
                {
                    "name": "ClickTool",
                    "description": "Di chuyển và click chuột vào một nút hoặc phần tử giao diện theo tên hiển thị.",
                    "requiredCapabilities": ["MouseControl"],
                    "preconditions": [],
                    "effects": [],
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "target": {
                                "type": "string",
                                "description": "Tên hiển thị của nút bấm hoặc menu item cần nhấp chuột."
                            }
                        },
                        "required": ["target"]
                    }
                },
                {
                    "name": "ReadWindowTool",
                    "description": "Đọc tiêu đề và nội dung văn bản hiện hành trong cửa sổ để quan sát (Observer).",
                    "requiredCapabilities": ["ReadFiles"],
                    "preconditions": [
                        {
                            "Predicate": "allowed",
                            "EntityType": "read",
                            "EntityIdParameter": None,
                            "TargetValue": True
                        }
                    ],
                    "effects": [
                        {
                            "Predicate": "read",
                            "EntityType": "window",
                            "EntityIdParameter": None,
                            "TargetValue": True
                        }
                    ],
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
            ]
        }
        os.makedirs(os.path.dirname(CATALOG_PATH), exist_ok=True)
        with open(CATALOG_PATH, "w", encoding="utf-8") as f:
            json.dump(default_catalog, f, indent=2, ensure_ascii=False)
            
    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        version = data.get("schemaVersion")
        SUPPORTED_SCHEMA_VERSIONS = {1}
        if version not in SUPPORTED_SCHEMA_VERSIONS:
            raise ValueError(f"Unsupported tool catalog schema version: {version}. Supported versions: {SUPPORTED_SCHEMA_VERSIONS}")
        validate_catalog_schema(data)
        SUPPORTED_TOOLS = {t["name"]: t for t in data.get("tools", [])}
        print(f"[Planner Service] Loaded {len(SUPPORTED_TOOLS)} tools dynamically from catalog (version {version}).")
    except Exception as e:
        print(f"[Planner Service CRITICAL] Failed to load tools catalog: {e}")
        raise

load_tools_catalog()

# ==========================================
# DECOUPLED CONSTRAINT EXTRACTOR
# ==========================================

class ConstraintExtractor:
    @staticmethod
    def extract_constraints(goal: str) -> List[schemas.ConstraintNode]:
        """
        Trích xuất các ràng buộc môi trường dạng ConstraintNode từ câu lệnh goal.
        """
        g_lower = goal.lower()
        constraints = []
        
        # Network access constraints
        network_access = True
        no_net_keywords = ["no internet", "without internet", "cấm kết nối", "offline mode", "không có mạng", 
                           "air-gapped", "isolated", "offline", "mạng nội bộ", "ngắt kết nối", 
                           "without external connectivity", "disconnected from wan"]
        if any(kw in g_lower for kw in no_net_keywords):
            network_access = False
            
        constraints.append(schemas.ConstraintNode(
            entityType="network",
            entityId="default",
            predicate="allowed",
            targetValue=network_access
        ))
            
        # App open constraints
        app_open_allowed = True
        no_app_keywords = ["do not open", "cấm mở", "cấm khởi động", "no launch", "do not launch", 
                           "without opening", "không được mở", "giữ notepad đóng", "keep notepad closed"]
        if any(kw in g_lower for kw in no_app_keywords):
            app_open_allowed = False
            
        constraints.append(schemas.ConstraintNode(
            entityType="app_open",
            entityId="default",
            predicate="allowed",
            targetValue=app_open_allowed
        ))
            
        # Write constraints
        write_allowed = True
        no_write_keywords = ["do not write", "cấm ghi", "read-only", "chỉ đọc", "without typing", "cấm gõ"]
        if any(kw in g_lower for kw in no_write_keywords):
            write_allowed = False
            
        constraints.append(schemas.ConstraintNode(
            entityType="write",
            entityId="default",
            predicate="allowed",
            targetValue=write_allowed
        ))
            
        # Read constraints
        read_allowed = True
        no_read_keywords = ["do not read", "cấm đọc", "without reading", "không được đọc"]
        if any(kw in g_lower for kw in no_read_keywords):
            read_allowed = False
            
        constraints.append(schemas.ConstraintNode(
            entityType="read",
            entityId="default",
            predicate="allowed",
            targetValue=read_allowed
        ))
            
        # close vs keep-open mutual exclusion
        close_requested = any(kw in g_lower for kw in ["close", "terminate", "đóng", "tắt"])
        keep_open_requested = any(kw in g_lower for kw in ["keep open", "always running", "giữ mở", "không được đóng"]) or ("keep" in g_lower and "open" in g_lower)
        
        constraints.append(schemas.ConstraintNode(
            entityType="global_keep_open",
            entityId="default",
            predicate="allowed",
            targetValue=keep_open_requested
        ))
        
        return constraints

def validate_goal_constraints(goal: str) -> None:
    """
    Lớp pre-validation tĩnh kiểm tra các ràng buộc mâu thuẫn cơ bản trước khi gọi Gemini.
    """
    constraints = ConstraintExtractor.extract_constraints(goal)
    g_lower = goal.lower()
    
    def get_constraint_val(e_type, pred, default=True):
        for c in constraints:
            if c.entityType == e_type and c.predicate == pred:
                return c.targetValue
        return default
        
    app_open_allowed = get_constraint_val("app_open", "allowed")
    read_allowed = get_constraint_val("read", "allowed")
    write_allowed = get_constraint_val("write", "allowed")
    network_allowed = get_constraint_val("network", "allowed")
    keep_open_requested = get_constraint_val("global_keep_open", "allowed", False)
    close_requested = any(kw in g_lower for kw in ["close", "terminate", "đóng", "tắt"])
    
    # Ràng buộc 1: Yêu cầu ghi/gõ dữ liệu nhưng cấm mở ứng dụng Notepad
    has_write = any(w in g_lower for w in ["write", "type", "gõ", "viết", "nhập", "ghi"])
    if has_write and not app_open_allowed:
        raise ValueError("Contradictory goal: Writing data is required but opening application is forbidden.")

    # Ràng buộc 2: Yêu cầu đọc/xác minh nhưng cấm kiểm duyệt màn hình
    has_read = any(r in g_lower for r in ["read", "verify", "đọc", "xác minh"])
    if has_read and not read_allowed:
        raise ValueError("Contradictory goal: Reading/verifying data is required but reading screen is forbidden.")

    # Ràng buộc 3: Temporal contradiction (Delete file then read it)
    has_delete = any(d in g_lower for d in ["delete", "remove", "xóa"])
    if has_delete and has_read:
        if any(f in g_lower for f in ["file", "document", "record", "tài liệu", "tập tin"]):
            raise ValueError("Contradictory goal: Attempting to read a file/record after deleting it.")

    # Ràng buộc 4: Permission contradiction (Send email but internet disabled)
    has_send = any(s in g_lower for s in ["send", "mail", "post", "gửi"])
    if has_send and not network_allowed:
        raise ValueError("Contradictory goal: Attempting to send email/data while internet access is disabled.")

    # Ràng buộc 5: Mutual exclusion (Close application and keep it open)
    if close_requested and keep_open_requested:
        raise ValueError("Contradictory goal: Conflicting instruction to close application and keep it open simultaneously.")

# ==========================================
# GRAPH INTEGRITY, CAPABILITIES & PARAMETERS
# ==========================================

def validate_task_schema(plan: schemas.DAGTaskGraph) -> None:
    """
    Xác thực cấu trúc dữ liệu của kế hoạch bằng Pydantic Model.
    """
    try:
        schemas.DAGTaskGraph.parse_obj(plan.dict())
    except Exception as e:
        raise ValueError(f"Task schema validation failed: {e}")

def validate_dependency_integrity(tasks: List[schemas.DAGTaskNode]) -> None:
    """
    Xác minh tất cả các dependencies trong đồ thị đều trỏ đến các task ID hợp lệ có trong đồ thị.
    Đồng thời phát hiện lỗi trùng lặp ID (Duplicate ID) và tự phụ thuộc (Self dependency).
    """
    seen_ids = set()
    for t in tasks:
        if t.id in seen_ids:
            raise ValueError(f"Graph structural anomaly: Duplicate Task ID '{t.id}' detected in planned tasks list.")
        seen_ids.add(t.id)

    for t in tasks:
        if t.id in t.dependencies:
            raise ValueError(f"Graph structural anomaly: Task '{t.id}' cannot depend on itself (Self dependency loop of length 1).")
        for dep in t.dependencies:
            if dep not in seen_ids:
                raise ValueError(f"Dependency integrity violation: Task '{t.id}' depends on non-existent task '{dep}'.")

def validate_tool_hallucination(tasks: List[schemas.DAGTaskNode]) -> None:
    """
    Xác minh tất cả các công cụ được LLM lập kế hoạch đều nằm trong danh mục công cụ hỗ trợ thực tế của hệ thống.
    """
    for t in tasks:
        if t.toolName not in SUPPORTED_TOOLS:
            raise ValueError(f"Tool hallucination detected: Tool '{t.toolName}' is not registered in the system.")

# Single source of truth: capabilities are read from catalog requirements and compared with AGENT_ALLOWED_CAPABILITIES from env
AGENT_ALLOWED_CAPABILITIES = set(
    os.getenv("AGENT_ALLOWED_CAPABILITIES", "LaunchApps,KeyboardInput,MouseControl,ReadFiles,WriteFiles,DeleteFiles").split(",")
)

def validate_tool_capabilities(tasks: List[schemas.DAGTaskNode]) -> None:
    """
    Xác minh các tool yêu cầu capability có nằm trong danh sách capabilities được cấp phép của Agent hay không.
    """
    for t in tasks:
        tool_meta = SUPPORTED_TOOLS.get(t.toolName)
        if not tool_meta:
            continue
        req_caps = tool_meta.get("requiredCapabilities") or tool_meta.get("RequiredCapabilities") or []
        for cap in req_caps:
            if cap not in AGENT_ALLOWED_CAPABILITIES:
                raise ValueError(
                    f"Capability security violation in task '{t.id}': "
                    f"Tool '{t.toolName}' requires capability '{cap}' which is not allowed for the current agent."
                )

def validate_task_parameters(tasks: List[schemas.DAGTaskNode]) -> None:
    """
    Đối chiếu tham số gõ vào (arguments) của từng task với schema định nghĩa tham số trong catalog.
    Báo lỗi nếu thiếu tham số bắt buộc hoặc sai kiểu dữ liệu.
    """
    for t in tasks:
        tool_meta = SUPPORTED_TOOLS.get(t.toolName)
        if not tool_meta:
            continue
            
        params_meta = tool_meta.get("parameters", {})
        required_fields = params_meta.get("required", [])
        properties = params_meta.get("properties", {})
        
        # Check required parameters
        for req in required_fields:
            if not t.args or req not in t.args or t.args[req] is None:
                raise ValueError(f"Parameter validation error in task '{t.id}': Tool '{t.toolName}' requires parameter '{req}' but it was not provided.")
                
        # Check parameter types if provided
        if t.args:
            for key, val in t.args.items():
                prop_meta = properties.get(key)
                if prop_meta:
                    expected_type = prop_meta.get("type")
                    if expected_type == "string" and not isinstance(val, str):
                        raise ValueError(f"Parameter validation error in task '{t.id}': Parameter '{key}' expected type 'string', got '{type(val).__name__}'.")
                    elif expected_type == "integer" and not isinstance(val, int) and not (isinstance(val, float) and val.is_integer()):
                        raise ValueError(f"Parameter validation error in task '{t.id}': Parameter '{key}' expected type 'integer', got '{type(val).__name__}'.")
                    elif expected_type == "boolean" and not isinstance(val, bool):
                        raise ValueError(f"Parameter validation error in task '{t.id}': Parameter '{key}' expected type 'boolean', got '{type(val).__name__}'.")

# ==========================================
# KAHN TOPOLOGICAL SORT & STATE SIMULATOR
# ==========================================

def kahn_topological_sort(tasks: List[schemas.DAGTaskNode]) -> tuple[bool, List[schemas.DAGTaskNode]]:
    """
    Sử dụng giải thuật Kahn để kiểm tra chu trình (cycle check) và sinh thứ tự thực thi (topological order)
    trong duy nhất một lần duyệt, hoàn toàn khử đệ quy để tránh tràn stack.
    Trả về (has_cycle, sorted_tasks).
    """
    # Enforce order: integrity check and capability check run before sorting
    validate_dependency_integrity(tasks)
    validate_tool_capabilities(tasks)

    in_degree = {t.id: 0 for t in tasks}
    adj = {t.id: [] for t in tasks}
    task_map = {t.id: t for t in tasks}
    
    for t in tasks:
        for dep in t.dependencies:
            if dep in adj:
                adj[dep].append(t.id)
                in_degree[t.id] += 1
                
    # Queue chứa các node có in_degree = 0
    queue = [tid for tid, deg in in_degree.items() if deg == 0]
    sorted_ids = []
    
    while queue:
        curr = queue.pop(0)
        sorted_ids.append(curr)
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    has_cycle = len(sorted_ids) < len(tasks)
    sorted_tasks = [task_map[tid] for tid in sorted_ids if tid in task_map]
    return has_cycle, sorted_tasks

def has_circular_dependencies(tasks: List[schemas.DAGTaskNode]) -> bool:
    """
    Kiểm tra xem đồ thị nhiệm vụ có chu trình vòng lặp hay không (Sử dụng Kahn Topo Sort).
    """
    has_cycle, _ = kahn_topological_sort(tasks)
    return has_cycle

def simulate_state_and_validate(
    goal: str,
    tasks: List[schemas.DAGTaskNode],
    constraints: Optional[List[schemas.ConstraintNode]] = None
) -> None:
    """
    Mô phỏng chuỗi thực thi (State Simulation) trên Entity Store và kiểm duyệt các điều kiện logic (Preconditions/Effects).
    """
    # Dynamic recognized metadata from registered catalog tools (fail closed)
    valid_entities, valid_predicates = get_recognized_metadata()

    # 1. Trích xuất ràng buộc câu lệnh mục tiêu
    if constraints is None:
        constraints = ConstraintExtractor.extract_constraints(goal)
    
    # Validate constraints against dynamic recognized metadata (fail closed)
    for c in constraints:
        if c.entityType.lower() not in valid_entities:
            raise UnknownEntityTypeError(f"Unsupported/Unknown EntityType '{c.entityType}' in goal constraints.")
        if c.predicate.lower() not in valid_predicates:
            raise UnknownPredicateError(f"Unsupported/Unknown Predicate '{c.predicate}' in goal constraints.")

    # 2. Khởi tạo World State dạng Entity Store
    state = {
        "entities": {}
    }
    for c in constraints:
        e_type = c.entityType
        e_id = c.entityId
        pred = c.predicate
        val = c.targetValue
        state["entities"].setdefault(e_type, {}).setdefault(e_id, {})[pred] = val
    
    # 3. Lấy thứ tự thực thi đã được sắp xếp topo
    has_cycle, sorted_tasks = kahn_topological_sort(tasks)
    if has_cycle:
        raise ValueError("Circular dependency detected in tasks graph.")
        
    # Default values for predicate lookups
    PREDICATE_DEFAULTS = {
        "exists": True,
        "running": False,
        "allowed": True
    }
    
    # 4. Duyệt tuần tự qua các task và mô phỏng sự thay đổi trạng thái
    for t in sorted_tasks:
        tool_meta = SUPPORTED_TOOLS.get(t.toolName)
        if not tool_meta:
            continue
        
        # 4a. Kiểm tra structured preconditions của tool từ catalog
        for pred_meta in tool_meta.get("preconditions", []):
            pred = pred_meta.get("Predicate") or pred_meta.get("predicate")
            e_type = pred_meta.get("EntityType") or pred_meta.get("entityType")
            id_param = pred_meta.get("EntityIdParameter") or pred_meta.get("entityIdParameter")
            target_val = pred_meta.get("TargetValue") if pred_meta.get("TargetValue") is not None else pred_meta.get("targetValue", True)
            
            # Enforce validation of entity type and predicate (fail closed)
            if e_type.lower() not in valid_entities:
                raise UnknownEntityTypeError(f"Unsupported/Unknown EntityType '{e_type}' in tool '{t.toolName}' preconditions.")
            if pred.lower() not in valid_predicates:
                raise UnknownPredicateError(f"Unsupported/Unknown Predicate '{pred}' in tool '{t.toolName}' preconditions.")

            # Resolve entity ID
            entity_id = "default"
            if id_param and t.args:
                entity_id = str(t.args.get(id_param, "default")).lower()
                
            # Auto-materialization lookup
            actual = state["entities"].setdefault(e_type, {}).setdefault(entity_id, {}).get(pred)
            if actual is None:
                actual = PREDICATE_DEFAULTS.get(pred)
                if actual is None:
                    # Fail closed: default value for custom uninitialized predicate is False
                    actual = False
                
            if actual != target_val:
                raise ValueError(
                    f"Contradictory plan in task '{t.id}': Entity '{e_type}' ID '{entity_id}' predicate '{pred}' "
                    f"is required to be {target_val}, but it is {actual}."
                )

        # 4b. Áp dụng structured effects của tool để thay đổi World State
        for eff_meta in tool_meta.get("effects", []):
            pred = eff_meta.get("Predicate") or eff_meta.get("predicate")
            e_type = eff_meta.get("EntityType") or eff_meta.get("entityType")
            id_param = eff_meta.get("EntityIdParameter") or eff_meta.get("entityIdParameter")
            target_val = eff_meta.get("TargetValue") if eff_meta.get("TargetValue") is not None else eff_meta.get("targetValue", True)
            
            # Enforce validation of entity type and predicate (fail closed)
            if e_type.lower() not in valid_entities:
                raise UnknownEntityTypeError(f"Unsupported/Unknown EntityType '{e_type}' in tool '{t.toolName}' effects.")
            if pred.lower() not in valid_predicates:
                raise UnknownPredicateError(f"Unsupported/Unknown Predicate '{pred}' in tool '{t.toolName}' effects.")

            # Resolve entity ID
            entity_id = "default"
            if id_param and t.args:
                entity_id = str(t.args.get(id_param, "default")).lower()
                
            # Check mutual exclusion close vs keep-open
            if e_type == "app" and pred == "running" and target_val is False:
                keep_open = state["entities"].setdefault("global_keep_open", {}).setdefault("default", {}).get("allowed", False)
                if keep_open:
                    raise ValueError(f"Contradictory plan in task '{t.id}': Action closes application, but user instruction requires keeping it open.")
            
            # Apply effect
            state["entities"].setdefault(e_type, {}).setdefault(entity_id, {})[pred] = target_val

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
    
    # 1. Notepad Auto-writing scenario
    if "notepad" in g_lower or "write" in g_lower or "gõ" in g_lower:
        tasks.append(schemas.DAGTaskNode(
            id="task_0",
            title="Open Notepad application",
            toolName="OpenApplicationTool",
            args={"exePath": "notepad.exe"},
            dependencies=[]
        ))
        
        text_to_write = "Vibe-Agent 2026 - Local automation host 100%."
        if "text" in g_lower or "nội dung" in g_lower:
            text_to_write = "Automated knowledge recording process."
            
        tasks.append(schemas.DAGTaskNode(
            id="task_1",
            title="Type guidance text into Notepad",
            toolName="TypeTextTool",
            args={"text": text_to_write},
            dependencies=["task_0"]
        ))
        
        tasks.append(schemas.DAGTaskNode(
            id="task_2",
            title="Verify notepad display results",
            toolName="ReadWindowTool",
            args={},
            dependencies=["task_1"]
        ))

    # 2. ERP & VAT Tax Code Lookup scenario
    elif "vat" in g_lower or "erp" in g_lower or "thuế" in g_lower:
        tasks.append(schemas.DAGTaskNode(
            id="task_0",
            title="Login to financial ERP system",
            toolName="OpenApplicationTool",
            args={"exePath": "erp_portal.exe"},
            dependencies=[]
        ))
        
        tasks.append(schemas.DAGTaskNode(
            id="task_1",
            title="Enter corporate VAT tax code",
            toolName="TypeTextTool",
            args={"text": "VAT-999888777"},
            dependencies=["task_0"]
        ))
        
        tasks.append(schemas.DAGTaskNode(
            id="task_2",
            title="Verify and save ERP information",
            toolName="ReadWindowTool",
            args={},
            dependencies=["task_1"]
        ))
        
    # 3. Generic Failsafe Task Scenario
    else:
        tasks.append(schemas.DAGTaskNode(
            id="task_0",
            title="Inspect workspace environment",
            toolName="ReadWindowTool",
            args={},
            dependencies=[]
        ))

    constraints = ConstraintExtractor.extract_constraints(goal)
    return schemas.DAGTaskGraph(goal=goal, tasks=tasks, constraints=constraints)

# ==========================================
# CORE PLANNING SERVICE
# ==========================================

async def generate_dag_plan(goal: str) -> schemas.DAGTaskGraph:
    """
    Tiếp nhận mục tiêu, áp dụng bộ lọc mâu thuẫn tĩnh, truy xuất hướng dẫn nghiệp vụ RAG,
    gọi Gemini để sinh đồ thị DAG và kiểm duyệt chu trình dependency khép kín.
    """
    print(f"[Planner Service] Generating plan for Goal: '{goal}'...")
    
    # 1. Pre-validation Constraint Layer
    try:
        validate_goal_constraints(goal)
    except ValueError as ve:
        print(f"[Planner Service WARNING] Static contradiction detected: {ve}. Activating defensive empty fallback.")
        return schemas.DAGTaskGraph(goal=goal, tasks=[])

    # 2. Lập kế hoạch (Online Gemini vs Offline rules)
    plan = None
    if is_mock_mode or llm_planner is None:
        plan = plan_workflow_offline(goal)
    else:
        try:
            print("[Planner Service RAG] Querying knowledge categories for SOP guidance...")
            sop_context = (
                "GUIDELINE: Để ghi chú, hãy luôn khởi động ứng dụng trước bằng OpenApplicationTool (exePath='notepad.exe'), "
                "sau đó thực thi TypeTextTool và hoàn tất kiểm duyệt bằng ReadWindowTool."
            )
            
            prompt = (
                f"You are the Core AI Planner Agent. Decompose this goal statement into a list of structured task nodes "
                f"forming a Directed Acyclic Graph (DAG) and extract environmental constraints:\n\n"
                f"GOAL: {goal}\n\n"
                f"CONTEXT GUIDANCE:\n{sop_context}\n\n"
                f"Assign correct toolName, titles, arguments, and list explicit parent IDs in dependencies. "
                f"Also, populate the 'constraints' list where each ConstraintNode specifies the entityType, entityId (default to 'default'), predicate, and targetValue based on the goal instructions. "
                f"Ensure there are absolutely NO cycle loops."
            )
            plan = await llm_planner.ainvoke(prompt)
        except Exception as e:
            print(f"[Planner Service Warning] Gemini planning failed: {e}. Falling back to offline parser.")
            plan = plan_workflow_offline(goal)

    # 3. Dynamic Pipeline Validation (Integrity, Hallucination, Parameters, State Simulation)
    if plan and plan.tasks:
        try:
            validate_task_schema(plan)
            # Enforce pipeline order: dependency and capability are checked before cycle sorting/simulation
            validate_tool_hallucination(plan.tasks)
            validate_task_parameters(plan.tasks)
            simulate_state_and_validate(goal, plan.tasks, plan.constraints)
        except ValueError as ve:
            print(f"[Planner Service Warning] Plan validation failed: {ve}. Rejecting the plan.")
            return schemas.DAGTaskGraph(goal=goal, tasks=[])
                    
    return plan

async def generate_dag_plan_with_telemetry(
    goal: str,
    trace_id: str,
    span_id: str,
    parent_span_id: Optional[str] = None
) -> schemas.GoalPlanningResponse:
    start_time = time.perf_counter()
    prompt_text = ""
    response_text = ""
    model_name = "gemini-1.5-flash"
    input_tokens = 0
    output_tokens = 0
    status = "SUCCESS"
    error_type = None
    error_message = None
    plan = None

    try:
        validate_goal_constraints(goal)
    except ValueError as ve:
        # Static contradiction
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        telemetry = schemas.AITelemetryBlock(
            traceId=trace_id,
            spanId=span_id,
            parentSpanId=parent_span_id,
            model=model_name,
            promptText=goal,
            responseText="",
            inputTokens=0,
            outputTokens=0,
            latencyMs=latency_ms,
            status="FAILED",
            errorType="VALIDATION",
            errorMessage=str(ve)
        )
        return schemas.GoalPlanningResponse(
            graph=schemas.DAGTaskGraph(goal=goal, tasks=[]),
            telemetry=telemetry
        )

    # Context SOP
    sop_context = (
        "GUIDELINE: Để ghi chú, hãy luôn khởi động ứng dụng trước bằng OpenApplicationTool (exePath='notepad.exe'), "
        "sau đó thực thi TypeTextTool và hoàn tất kiểm duyệt bằng ReadWindowTool."
    )
    prompt_text = (
        f"You are the Core AI Planner Agent. Decompose this goal statement into a list of structured task nodes "
        f"forming a Directed Acyclic Graph (DAG) and extract environmental constraints:\n\n"
        f"GOAL: {goal}\n\n"
        f"CONTEXT GUIDANCE:\n{sop_context}\n\n"
        f"Assign correct toolName, titles, arguments, and list explicit parent IDs in dependencies. "
        f"Also, populate the 'constraints' list where each ConstraintNode specifies the entityType, entityId (default to 'default'), predicate, and targetValue based on the goal instructions. "
        f"Ensure there are absolutely NO cycle loops."
    )

    if is_mock_mode or llm_planner is None:
        plan = plan_workflow_offline(goal)
        input_tokens = len(prompt_text) // 4
        output_tokens = len(str(plan.dict())) // 4
        response_text = json.dumps(plan.dict(), ensure_ascii=False)
    else:
        cb = TelemetryCallbackHandler()
        try:
            plan = await llm_planner.ainvoke(prompt_text, config={"callbacks": [cb]})
            model_name = cb.model_name
            input_tokens = cb.input_tokens
            output_tokens = cb.output_tokens
            response_text = json.dumps(plan.dict(), ensure_ascii=False)
        except Exception as e:
            status = "FAILED"
            error_msg_str = str(e)
            
            exc_class_name = e.__class__.__name__
            if "ResourceExhausted" in exc_class_name or "429" in error_msg_str:
                error_type = "RATE_LIMIT"
            elif "Timeout" in exc_class_name or "DeadlineExceeded" in error_msg_str:
                error_type = "TIMEOUT"
            elif "ValueError" in exc_class_name:
                error_type = "VALIDATION"
            elif "GoogleAPIError" in exc_class_name or "HTTPException" in exc_class_name:
                error_type = "PROVIDER_ERROR"
            else:
                error_type = "UNKNOWN"

            error_message = error_msg_str
            plan = plan_workflow_offline(goal)
            response_text = f"Fallback due to: {error_msg_str}"

    # Dynamic pipeline validation for AI / Fallback generated plan
    if plan and plan.tasks:
        try:
            validate_task_schema(plan)
            validate_tool_hallucination(plan.tasks)
            validate_task_parameters(plan.tasks)
            simulate_state_and_validate(goal, plan.tasks, plan.constraints)
        except ValueError as ve:
            print(f"[Planner Service Warning] Plan validation failed: {ve}. Rejecting the plan.")
            status = "FAILED"
            error_type = "VALIDATION"
            error_message = str(ve)
            plan = schemas.DAGTaskGraph(goal=goal, tasks=[])

    latency_ms = int((time.perf_counter() - start_time) * 1000)
    
    telemetry = schemas.AITelemetryBlock(
        traceId=trace_id,
        spanId=span_id,
        parentSpanId=parent_span_id,
        model=model_name,
        promptText=prompt_text,
        responseText=response_text,
        inputTokens=input_tokens,
        outputTokens=output_tokens,
        latencyMs=latency_ms,
        status=status,
        errorType=error_type,
        errorMessage=error_message
    )

    return schemas.GoalPlanningResponse(graph=plan, telemetry=telemetry)

