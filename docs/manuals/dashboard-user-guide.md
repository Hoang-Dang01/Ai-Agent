---
status: VALIDATED
trust_tier: P1
---

# ANTIGRAVITY DASHBOARD - OBSERVABILITY MANUAL

## 1. INTRODUCTION
The Antigravity Dashboard is the Observability Plane for the Autonomous Agent Runtime. It visualizes the internal execution pipeline, memory provenance, and distributed cognition traces of the AI agents in real-time.

> [!IMPORTANT]
> The Dashboard is strictly Read-Only. It physically separates the Control Plane from the Observability Plane to prevent UI-based prompt injections, accidental orchestrations, and malicious capability hijacking.

## 2. TRACE TELEMETRY (LIVE EXECUTION STREAM)

### A. Subsystem Namespace Taxonomy
The terminal stream categorizes execution spans to isolate hallucination root-causes, trace latency, and debug retry storms. 
* `[Planner]` - Phase decomposition, WBS generation, and strategy formulation.
* `[Memory]` - RAG indexing, context compaction, and Trust Tier filtering.
* `[Tool]` - External capability invocations (Bash, SQL, MCP, Browser).
* `[Executor]` - File mutations and code generation bounds.
* `[Synthesizer]` - Final response formulation and citation alignment.

### B. Congestion & Backpressure
The stream surfaces runtime bottlenecks (e.g., `[System] Token congestion detected. Rebalancing worker threads`) to accurately reflect inference queue saturation and worker starvation.

## 3. EPISTEMIC & RAG MONITORING

### A. Topology Health (The Graph)
The network nodes visualize Knowledge Topology, monitoring:
* **Semantic Edge Decay:** Identifies orphan chunks and disconnected context islands.
* **Citation Integrity:** The ratio of generated claims mapped to verified source chunks.

### B. Epistemic Trust Distribution
Monitors the "Diet" of the LLM context window to prevent data poisoning:
* **Trust Ratio:** Compares `[P0/P1]` Architectural Invariants against `[P3/P4]` Conversational Drafts.
* **Unverified Generation:** Flags when the Synthesizer outputs facts absent from retrieved evidence.

### C. Precision Latency Metrics
* **Retrieval Latency:** Time taken to complete the Hybrid Search in VectorDB.
* **Inference Queue:** Time spent waiting for LLM compute allocation.
* **TTFT (Time To First Token):** Total round-trip time until the Synthesizer begins streaming output.

## 4. FAILURE SEMANTICS & TROUBLESHOOTING

Modern AI architectures fail differently than traditional CRUD apps. Monitor for these Cognitive Exceptions:

> [!WARNING]
> **Cognitive Drift Detected:** The `[Executor]` has drifted from the `[Planner]`'s architectural constraints. The Orchestrator will automatically trigger a Checkpoint Rollback.

> [!CAUTION]
> **Retrieval Confidence Collapse:** If the VectorDB retrieval confidence drops below safe thresholds, the agent will enter *Degraded Reasoning Mode* and automatically abstain from generating structural code.

> [!CAUTION]
> **Tool Retry Saturation:** If `[Tool]` invokes the same failed shell command or database query 3 times sequentially, it triggers a hard Circuit Breaker and escalates to `APPROVAL_PENDING`.
