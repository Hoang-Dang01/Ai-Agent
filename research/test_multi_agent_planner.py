import asyncio
import os
import sys

# Add root path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app.schemas as schemas
import app.services.planner_service as planner_service

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
    goal_clash = "Ghi chép mã số thuế vào Notepad nhưng không được mở ứng dụng"
    print(f"[Test Ingest] Ambiguous/Contradictory Goal: '{goal_clash}'")
    
    # Pre-validation constraint layer must throw a ValueError or planner must return empty failsafe graph
    plan_clash = await planner_service.generate_dag_plan(goal_clash)
    
    print(f"[Test Result] Tasks count for ambiguous goal: {len(plan_clash.tasks)}")
    assert len(plan_clash.tasks) == 0, f"Expected empty failsafe graph (0 tasks), got {len(plan_clash.tasks)}"
    print("[SUCCESS] Test 3: Pre-validation Contradiction Fallback intercepted cleanly & deterministically.")

    print("\n==================================================================")
    print("   ALL COGNITIVE PLANNER & DAG SECURITY TESTS PASSED (100%)")
    print("==================================================================")

if __name__ == "__main__":
    asyncio.run(run_planner_tests())
