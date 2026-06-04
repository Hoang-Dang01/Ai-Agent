import sys
import io

# Force UTF-8 stdout/stderr encoding to prevent Windows CP1252 UnicodeEncodeError
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import asyncio
import os

# Add root path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app.schemas as schemas
import app.services.planner_service as planner_service

def normalized_plan_signature(tasks) -> str:
    normalized = []
    for t in tasks:
        sorted_args = sorted(t.args.items()) if t.args else []
        normalized.append((t.toolName, tuple(sorted(t.dependencies)), tuple(sorted_args)))
    normalized.sort(key=lambda x: (x[0], x[1], x[2]))
    return str(normalized)

async def run_planner_tests():
    print("==================================================================")
    print("   STARTING AUTOMATED COGNITIVE PLANNER & CONSTRAINT TESTS")
    print("==================================================================")

    # ---------------------------------------------------------
    # TEST 1: Standard DAG decomposition and plan generation
    # ---------------------------------------------------------
    print("\n--- TEST 1: Standard Plan Generation ---")
    goal_1 = "Open Notepad and write tax records on Windows."
    print(f"[Test Ingest] Goal: '{goal_1}'")
    
    plan_1 = await planner_service.generate_dag_plan(goal_1)
    
    print(f"[Test Result] Tasks count generated: {len(plan_1.tasks)}")
    for t in plan_1.tasks:
      print(f"  - [{t.id}] Title: '{t.title}' | Tool: {t.toolName} | Dependencies: {t.dependencies}")
      
    assert len(plan_1.tasks) >= 3, f"Expected at least 3 tasks, got {len(plan_1.tasks)}"
    assert plan_1.tasks[0].toolName == "OpenApplicationTool", "Expected first task to be OpenApplicationTool"
    assert plan_1.tasks[1].dependencies == ["task_0"], "Expected second task to depend on task_0"
    print("[SUCCESS] Test 1: Standard Plan Generation passed.")

    # ---------------------------------------------------------
    # TEST 2: DFS cycle-detection for circular dependencies
    # ---------------------------------------------------------
    print("\n--- TEST 2: DFS Cycle Detection ---")
    print("[Test Graph] Creating mock task graph with a circular dependency...")
    
    # Task A depends on Task B, and Task B depends on Task A
    circular_tasks = [
        schemas.DAGTaskNode(
            id="task_A",
            title="Task A",
            toolName="TypeTextTool",
            args={},
            dependencies=["task_B"]
        ),
        schemas.DAGTaskNode(
            id="task_B",
            title="Task B",
            toolName="ReadWindowTool",
            args={},
            dependencies=["task_A"]
        )
    ]
    
    has_cycle = planner_service.has_circular_dependencies(circular_tasks)
    print(f"[Test Result] Circular dependency detected? {has_cycle}")
    assert has_cycle is True, "DFS Cycle detector failed to flag circular dependency!"
    print("[SUCCESS] Test 2: DFS Cycle Detection passed.")

    # ---------------------------------------------------------
    # TEST 3: Deterministic Rule-Based Pre-validation Fallback
    # ---------------------------------------------------------
    print("\n--- TEST 3: Pre-validation Contradiction Fallback ---")
    goal_clash = "Write corporate VAT code into Notepad but do not open the application"
    print(f"[Test Ingest] Ambiguous/Contradictory Goal: '{goal_clash}'")
    
    # Pre-validation constraint layer must throw a ValueError or planner must return empty failsafe graph
    plan_clash = await planner_service.generate_dag_plan(goal_clash)
    
    print(f"[Test Result] Tasks count for ambiguous goal: {len(plan_clash.tasks)}")
    assert len(plan_clash.tasks) == 0, f"Expected empty failsafe graph (0 tasks), got {len(plan_clash.tasks)}"
    print("[SUCCESS] Test 3: Pre-validation Contradiction Fallback intercepted cleanly & deterministically.")

    # ---------------------------------------------------------
    # TEST 4: Large Scale DAG (2000 tasks, deep dependency chain)
    # ---------------------------------------------------------
    print("\n--- TEST 4: Large Scale DAG Stress Test (2000 Tasks) ---")
    large_tasks = []
    # Create 2000 tasks where Task N depends on Task N-1
    for i in range(2000):
        dep = [f"task_{i-1}"] if i > 0 else []
        large_tasks.append(schemas.DAGTaskNode(
            id=f"task_{i}",
            title=f"Task {i}",
            toolName="TypeTextTool",
            args={"text": f"Type text {i}"},
            dependencies=dep
        ))
    
    start_time = time.perf_counter()
    has_large_cycle = planner_service.has_circular_dependencies(large_tasks)
    duration_ms = (time.perf_counter() - start_time) * 1000
    print(f"[Test Result] 2000 tasks Kahn Topo Sort executed in {duration_ms:.2f}ms. Circular dependency? {has_large_cycle}")
    assert has_large_cycle is False, "Kahn Topo Sort falsely reported a cycle in a linear 2000-task chain!"
    print("[SUCCESS] Test 4: Large Scale DAG Stress Test passed successfully.")
 
    # ---------------------------------------------------------
    # TEST 5: Multiple Cycles Detection
    # ---------------------------------------------------------
    print("\n--- TEST 5: Multiple Cycles Detection ---")
    multi_cycle_tasks = [
        # Cycle 1: task_1 <-> task_2
        schemas.DAGTaskNode(id="task_1", title="T1", toolName="TypeTextTool", args={"text": "t1"}, dependencies=["task_2"]),
        schemas.DAGTaskNode(id="task_2", title="T2", toolName="TypeTextTool", args={"text": "t2"}, dependencies=["task_1"]),
        # Cycle 2: task_3 -> task_4 -> task_5 -> task_3
        schemas.DAGTaskNode(id="task_3", title="T3", toolName="TypeTextTool", args={"text": "t3"}, dependencies=["task_4"]),
        schemas.DAGTaskNode(id="task_4", title="T4", toolName="TypeTextTool", args={"text": "t4"}, dependencies=["task_5"]),
        schemas.DAGTaskNode(id="task_5", title="T5", toolName="TypeTextTool", args={"text": "t5"}, dependencies=["task_3"]),
    ]
    has_multi_cycle = planner_service.has_circular_dependencies(multi_cycle_tasks)
    print(f"[Test Result] Multiple cycles detected? {has_multi_cycle}")
    assert has_multi_cycle is True, "Kahn Topo Sort failed to find multiple cycles!"
    print("[SUCCESS] Test 5: Multiple Cycles Detection passed.")
 
    # ---------------------------------------------------------
    # TEST 6: Ghost Tasks & Malformed Inputs Handling
    # ---------------------------------------------------------
    print("\n--- TEST 6: Ghost Tasks Handling ---")
    malformed_tasks = [
        schemas.DAGTaskNode(
            id="task_A",
            title="Task A",
            toolName="TypeTextTool",
            args={"text": "test"},
            dependencies=["ghost_task_XYZ"]  # Non-existent ID
        )
    ]
    try:
        planner_service.has_circular_dependencies(malformed_tasks)
        assert False, "Expected has_circular_dependencies to raise ValueError on ghost task dependency!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught dependency violation: {ve}")
    print("[SUCCESS] Test 6: Ghost Tasks & Malformed Inputs handled gracefully.")
 
    # ---------------------------------------------------------
    # TEST 7: Pre-validation Contradiction Taxonomy Expansion
    # ---------------------------------------------------------
    print("\n--- TEST 7: Expanded Pre-validation Checks ---")
    
    # Check Temporal Contradiction (Delete then read)
    goal_temp = "Delete the client file, and verify the file content."
    plan_temp = await planner_service.generate_dag_plan(goal_temp)
    print(f"[Test Result] Tasks count for temporal clash: {len(plan_temp.tasks)}")
    assert len(plan_temp.tasks) == 0, "Temporal clash was not rejected!"
 
    # Check Permission Contradiction (Send email but offline)
    goal_perm = "Send personal email update to manager in offline mode."
    plan_perm = await planner_service.generate_dag_plan(goal_perm)
    print(f"[Test Result] Tasks count for offline sending clash: {len(plan_perm.tasks)}")
    assert len(plan_perm.tasks) == 0, "Permission/Offline clash was not rejected!"
 
    # Check Mutual Exclusion (Close app and keep open)
    goal_mutex = "Close Excel sheet but make sure to keep the application open at all times."
    plan_mutex = await planner_service.generate_dag_plan(goal_mutex)
    print(f"[Test Result] Tasks count for close/keep-open clash: {len(plan_mutex.tasks)}")
    assert len(plan_mutex.tasks) == 0, "Mutual exclusion close/keep-open clash was not rejected!"
 
    print("[SUCCESS] Test 7: Expanded pre-validation constraints verified.")
 
    # ---------------------------------------------------------
    # TEST 8: Dependency Integrity Validation (Ghost Task Rejection)
    # ---------------------------------------------------------
    print("\n--- TEST 8: Dependency Integrity (Ghost Task Rejection) ---")
    ghost_dep_graph = schemas.DAGTaskGraph(
        goal="Verify dependency integrity",
        tasks=[
            schemas.DAGTaskNode(id="task_1", title="Task 1", toolName="OpenApplicationTool", args={"exePath": "notepad.exe"}, dependencies=["ghost_task_99"])
        ]
    )
    
    try:
        planner_service.validate_dependency_integrity(ghost_dep_graph.tasks)
        assert False, "Expected validate_dependency_integrity to raise ValueError on missing dependency key!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught dependency violation: {ve}")
 
    # Add duplicate ID check test
    dup_id_graph = schemas.DAGTaskGraph(
        goal="Verify duplicate ID check",
        tasks=[
            schemas.DAGTaskNode(id="task_1", title="Task 1", toolName="OpenApplicationTool", args={"exePath": "notepad.exe"}, dependencies=[]),
            schemas.DAGTaskNode(id="task_1", title="Task 1 Duplicate", toolName="TypeTextTool", args={"text": "dup"}, dependencies=[])
        ]
    )
    try:
        planner_service.validate_dependency_integrity(dup_id_graph.tasks)
        assert False, "Expected validate_dependency_integrity to raise ValueError on duplicate task ID!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught duplicate ID violation: {ve}")
 
    # Add self-dependency check test
    self_dep_graph = schemas.DAGTaskGraph(
        goal="Verify self-dependency check",
        tasks=[
            schemas.DAGTaskNode(id="task_1", title="Task 1 Self", toolName="OpenApplicationTool", args={"exePath": "notepad.exe"}, dependencies=["task_1"])
        ]
    )
    try:
        planner_service.validate_dependency_integrity(self_dep_graph.tasks)
        assert False, "Expected validate_dependency_integrity to raise ValueError on self-dependency!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught self-dependency violation: {ve}")
 
    print("[SUCCESS] Test 8: Dependency Integrity (Ghost, Duplicate, Self) verified.")
 
    # ---------------------------------------------------------
    # TEST 9: Tool Hallucination Check
    # ---------------------------------------------------------
    print("\n--- TEST 9: Tool Hallucination Rejection ---")
    hallucinated_graph = schemas.DAGTaskGraph(
        goal="Test tool hallucination",
        tasks=[
            schemas.DAGTaskNode(id="task_1", title="Task 1", toolName="ExcelAutomationV9Tool", args={}, dependencies=[])
        ]
    )
    
    try:
        planner_service.validate_tool_hallucination(hallucinated_graph.tasks)
        assert False, "Expected validate_tool_hallucination to raise ValueError on unregistered tool name!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught tool hallucination: {ve}")
        
    print("[SUCCESS] Test 9: Tool Hallucination Rejection verified.")
 
    # ---------------------------------------------------------
    # TEST 10: Planner Determinism Verification (20 iterations)
    # ---------------------------------------------------------
    print("\n--- TEST 10: Planner Determinism stability test (20 iterations) ---")
    import json
    
    goal_det = "Open Notepad and type finance report."
    signatures = []
    
    for i in range(20):
        plan_det = await planner_service.generate_dag_plan(goal_det)
        sig = normalized_plan_signature(plan_det.tasks)
        signatures.append(sig)
            
    unique_sigs = set(signatures)
    print(f"[Test Result] 20 planning runs resulted in unique semantic structures (signatures count): {len(unique_sigs)}")
    consistency_pct = (1.0 / len(unique_sigs)) * 100.0
    print(f"[Metrics Report] Live LLM Consistency over 20 iterations: {consistency_pct:.2f}% (unique signatures: {len(unique_sigs)})")
    
    if planner_service.is_mock_mode or planner_service.llm_planner is None:
        assert len(unique_sigs) == 1, f"Expected 100% determinism (1 unique signature) in offline mode, but got {len(unique_sigs)} different graph outputs!"
        print("[SUCCESS] Test 10: 100% Planner Determinism verified in offline fallback.")
    else:
        print("[SUCCESS] Test 10: Live LLM Consistency metric reported successfully.")

    # ---------------------------------------------------------
    # TEST 11: Task Parameter Schema Validation
    # ---------------------------------------------------------
    print("\n--- TEST 11: Task Parameter Schema Validation ---")
    
    # Missing required parameter 'exePath' in OpenApplicationTool
    invalid_args_graph = schemas.DAGTaskGraph(
        goal="Test parameters",
        tasks=[
            schemas.DAGTaskNode(id="task_1", title="Open App", toolName="OpenApplicationTool", args={}, dependencies=[])
        ]
    )
    try:
        planner_service.validate_task_parameters(invalid_args_graph.tasks)
        assert False, "Expected validate_task_parameters to raise ValueError on missing parameter!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught missing parameter: {ve}")
        
    # Wrong type for parameter 'exePath' (expected string, got integer)
    wrong_type_graph = schemas.DAGTaskGraph(
        goal="Test parameter types",
        tasks=[
            schemas.DAGTaskNode(id="task_1", title="Open App", toolName="OpenApplicationTool", args={"exePath": 1234}, dependencies=[])
        ]
    )
    try:
        planner_service.validate_task_parameters(wrong_type_graph.tasks)
        assert False, "Expected validate_task_parameters to raise ValueError on invalid parameter type!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught invalid parameter type: {ve}")
        
    print("[SUCCESS] Test 11: Task Parameter Schema Validation passed.")

    # ---------------------------------------------------------
    # TEST 12: Precondition & Effect State Simulation Contradictions
    # ---------------------------------------------------------
    print("\n--- TEST 12: Precondition & Effect State Simulation Contradictions ---")
    
    # Scenario A: Network access violation (isolated goal containing network action)
    net_tasks = [
        schemas.DAGTaskNode(id="task_1", title="Send report to manager", toolName="SendEmailTool", args={"email": "mgr@company.com", "subject": "report", "body": "data"}, dependencies=[])
    ]
    try:
        planner_service.simulate_state_and_validate("Send payroll report while remaining isolated from external networks", net_tasks)
        assert False, "Expected state simulation to reject network task in isolated network!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught network isolation violation: {ve}")
        
    # Scenario B: Read after delete file
    read_after_delete_tasks = [
        schemas.DAGTaskNode(id="task_1", title="Delete payroll.xlsx", toolName="DeleteFileTool", args={"path": "payroll.xlsx"}, dependencies=[]),
        schemas.DAGTaskNode(id="task_2", title="Read payroll.xlsx content", toolName="ReadFileTool", args={"path": "payroll.xlsx"}, dependencies=["task_1"])
    ]
    try:
        planner_service.simulate_state_and_validate("Delete payroll.xlsx and read it", read_after_delete_tasks)
        assert False, "Expected state simulation to reject reading a deleted file!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught read-after-delete contradiction: {ve}")
        
    print("[SUCCESS] Test 12: Precondition & Effect State Simulation Contradictions passed.")

    # ---------------------------------------------------------
    # TEST 14: Unknown Predicate Verification
    # ---------------------------------------------------------
    print("\n--- TEST 14: Unknown Predicate Verification ---")
    planner_service.SUPPORTED_TOOLS["MockEncryptionTool"] = {
        "name": "MockEncryptionTool",
        "description": "Encrypt a file.",
        "preconditions": [],
        "effects": [
            {
                "Predicate": "encrypted",
                "EntityType": "file",
                "EntityIdParameter": "path",
                "TargetValue": True
            }
        ],
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"]
        }
    }
    planner_service.SUPPORTED_TOOLS["MockDecryptedReadTool"] = {
        "name": "MockDecryptedReadTool",
        "description": "Read file requiring it to be decrypted (encrypted=False).",
        "preconditions": [
            {
                "Predicate": "encrypted",
                "EntityType": "file",
                "EntityIdParameter": "path",
                "TargetValue": False
            }
        ],
        "effects": [],
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"]
        }
    }
    enc_tasks = [
        schemas.DAGTaskNode(id="task_1", title="Encrypt file", toolName="MockEncryptionTool", args={"path": "payroll.xlsx"}, dependencies=[]),
        schemas.DAGTaskNode(id="task_2", title="Read decrypted", toolName="MockDecryptedReadTool", args={"path": "payroll.xlsx"}, dependencies=["task_1"])
    ]
    try:
        planner_service.simulate_state_and_validate("Read payroll.xlsx after encrypting it", enc_tasks)
        assert False, "Expected state simulation to fail due to decrypted precondition violation!"
    except ValueError as ve:
        print(f"[Test Result] Successfully caught unknown predicate contradiction dynamically: {ve}")
    print("[SUCCESS] Test 14: Unknown Predicate handled dynamically and generically.")

    # ---------------------------------------------------------
    # TEST 15: Unknown EntityType Verification
    # ---------------------------------------------------------
    print("\n--- TEST 15: Unknown EntityType Verification ---")
    planner_service.SUPPORTED_TOOLS["MockMountVolumeTool"] = {
        "name": "MockMountVolumeTool",
        "description": "Mount a volume.",
        "preconditions": [],
        "effects": [
            {
                "Predicate": "mounted",
                "EntityType": "volume",
                "EntityIdParameter": "volName",
                "TargetValue": True
            }
        ],
        "parameters": {
            "type": "object",
            "properties": {"volName": {"type": "string"}},
            "required": ["volName"]
        }
    }
    vol_tasks = [
        schemas.DAGTaskNode(id="task_1", title="Mount backup", toolName="MockMountVolumeTool", args={"volName": "backup_drive"}, dependencies=[])
    ]
    try:
        planner_service.simulate_state_and_validate("Mount volume", vol_tasks)
        print("[Test Result] Successfully ran simulator with unknown EntityType 'volume' and predicate 'mounted' without crash.")
    except Exception as ex:
        assert False, f"Expected no exception for unknown entity type, got: {ex}"
    print("[SUCCESS] Test 15: Unknown EntityType handled dynamically and generically.")

    # ---------------------------------------------------------
    # TEST 16: Catalog Version Mismatch Verification
    # ---------------------------------------------------------
    print("\n--- TEST 16: Catalog Version Mismatch Verification ---")
    original_catalog_content = ""
    if os.path.exists(planner_service.CATALOG_PATH):
        with open(planner_service.CATALOG_PATH, "r", encoding="utf-8") as f:
            original_catalog_content = f.read()
    try:
        mismatched_catalog = {
            "schemaVersion": 999,
            "generatedAt": "2026-06-04T16:13:15Z",
            "tools": []
        }
        with open(planner_service.CATALOG_PATH, "w", encoding="utf-8") as f:
            json.dump(mismatched_catalog, f, indent=2)
        try:
            planner_service.load_tools_catalog()
            assert False, "Expected load_tools_catalog to raise ValueError on schema version 999!"
        except ValueError as ve:
            print(f"[Test Result] Successfully rejected catalog version mismatch: {ve}")
    finally:
        # Restore catalog
        if original_catalog_content:
            with open(planner_service.CATALOG_PATH, "w", encoding="utf-8") as f:
                f.write(original_catalog_content)
            planner_service.load_tools_catalog()
    print("[SUCCESS] Test 16: Catalog version mismatch validation verified.")

    # ---------------------------------------------------------
    # TEST 17: Capability Rejection Verification
    # ---------------------------------------------------------
    print("\n--- TEST 17: Capability Rejection Verification ---")
    planner_service.SUPPORTED_TOOLS["MockSysAdminTool"] = {
        "name": "MockSysAdminTool",
        "description": "Requires admin capability.",
        "requiredCapabilities": ["SystemAdministration"],
        "preconditions": [],
        "effects": [],
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
    sys_admin_tasks = [
        schemas.DAGTaskNode(id="task_1", title="Run sysadmin script", toolName="MockSysAdminTool", args={}, dependencies=[])
    ]
    try:
        planner_service.kahn_topological_sort(sys_admin_tasks)
        assert False, "Expected topological sort/validation to fail due to SystemAdministration capability violation!"
    except ValueError as ve:
        print(f"[Test Result] Successfully rejected task before sorting/simulation due to capability security: {ve}")
    print("[SUCCESS] Test 17: Capability Rejection verified cleanly.")

    # ---------------------------------------------------------
    # TEST 18: Topological Permutation Stability Verification
    # ---------------------------------------------------------
    print("\n--- TEST 18: Topological Permutation Stability Verification ---")
    # A -> C, B -> C
    # Order 1: A, B, C
    dag_order_1 = [
        schemas.DAGTaskNode(id="task_A", title="A", toolName="TypeTextTool", args={"text": "a"}, dependencies=[]),
        schemas.DAGTaskNode(id="task_B", title="B", toolName="TypeTextTool", args={"text": "b"}, dependencies=[]),
        schemas.DAGTaskNode(id="task_C", title="C", toolName="TypeTextTool", args={"text": "c"}, dependencies=["task_A", "task_B"])
    ]
    # Order 2: B, A, C (inserted differently, equivalent DAG)
    dag_order_2 = [
        schemas.DAGTaskNode(id="task_B", title="B", toolName="TypeTextTool", args={"text": "b"}, dependencies=[]),
        schemas.DAGTaskNode(id="task_A", title="A", toolName="TypeTextTool", args={"text": "a"}, dependencies=[]),
        schemas.DAGTaskNode(id="task_C", title="C", toolName="TypeTextTool", args={"text": "c"}, dependencies=["task_A", "task_B"])
    ]
    sig1 = normalized_plan_signature(dag_order_1)
    sig2 = normalized_plan_signature(dag_order_2)
    print(f"[Test Result] Signature 1: {sig1}")
    print(f"[Test Result] Signature 2: {sig2}")
    assert sig1 == sig2, "Topological permutation of equivalent DAGs yielded different signatures!"
    print("[SUCCESS] Test 18: Topological Permutation Stability verified.")

    # ---------------------------------------------------------
    # TEST 19: Fail-Closed Unknown EntityType/Predicate Audit
    # ---------------------------------------------------------
    print("\n--- TEST 19: Fail-Closed Unknown EntityType/Predicate Audit ---")
    
    # 1. Unknown entity type typo check (e.g. "fiel")
    fiel_constraints = [
        schemas.ConstraintNode(entityType="fiel", entityId="default", predicate="exists", targetValue=False)
    ]
    try:
        planner_service.simulate_state_and_validate("Audit typo", [], fiel_constraints)
        assert False, "Expected UnknownEntityTypeError for unregistered EntityType 'fiel'!"
    except planner_service.UnknownEntityTypeError as e:
        print(f"[Test Result] Successfully caught unregistered EntityType error: {e}")
        
    # 2. Unknown predicate check (e.g. "encrypted_typo")
    bad_pred_constraints = [
        schemas.ConstraintNode(entityType="file", entityId="default", predicate="encrypted_typo", targetValue=True)
    ]
    try:
        planner_service.simulate_state_and_validate("Audit bad predicate", [], bad_pred_constraints)
        assert False, "Expected UnknownPredicateError for unregistered Predicate 'encrypted_typo'!"
    except planner_service.UnknownPredicateError as e:
        print(f"[Test Result] Successfully caught unregistered Predicate error: {e}")
        
    print("[SUCCESS] Test 19: Fail-Closed Unknown EntityType/Predicate Audit verified.")

    print("\n==================================================================")
    print("   ALL COGNITIVE PLANNER & DAG SECURITY TESTS PASSED (100%)")
    print("==================================================================")

if __name__ == "__main__":
    import time
    asyncio.run(run_planner_tests())
