# ⚙️ ANTIGRAVITY COGNITIVE INFRASTRUCTURE PLATFORM

This directory contains the **Runtime Behavioral Specifications** for the Antigravity Autonomous Ecosystem. 
**We have officially transitioned from "Prompt Engineering & Roleplay" to "Deterministic Cognitive Orchestration".**

Agents operating within this workspace DO NOT merely "act" like programmers. They MUST adhere to strict State Machines, Mutex Locks, Epistemic Boundaries, and Ephemeral Context policies defined in these overlays.

> **Absolute Rule:** Every agent operation MUST inherit the constitutional laws dictated in `00-kernel/main.mdc`.

---

## 🗂️ THE 7 COGNITIVE LAYERS (ORCHESTRATION TOPOLOGY)

### 0️⃣ `00-kernel/` (The Runtime Constitution)
- **Role:** The Root Orchestrator.
- **Function:** Dictates the Global Authority Hierarchy (Human > QA > Kernel > Engineering). Enforces the 11-step Canonical State Machine (`EXECUTING`, `VALIDATING`, `APPROVAL_PENDING`). Defines Event Bus Semantics and Operational Modes (`NORMAL`, `INCIDENT`).

### 1️⃣ `01-strategy/` (The Scope & Product Engine)
- **Role:** Product Manager & System Architect.
- **Function:** Translates human BRDs into deterministic execution plans (`phase-xx.md`). Enforces boundary constraints, halts scope creep, and designs resilient backend topologies before any code is written.

### 2️⃣ `02-engineering/` (The Execution Runtime)
- **Role:** Backend Expert, Frontend Vibe, AI Engineer.
- **Function:** The coding muscle. Bound by severe architectural constraints: Idempotency, Backpressure, Graceful Degradation, UI State Integrity, and DTO boundary enforcement.

### 3️⃣ `03-security-qa/` (The Reliability & Veto Layer)
- **Role:** Security Sandbox Auditor, Reliability Engineer (RRE).
- **Function:** The State Machine Gatekeeper. Executes the `VALIDATING` state. Holds absolute VETO authority. Enforces deterministic testing pipelines (CI/CD, Schema validation) and monitors the capability sandbox (blocking destructive ops and secret bleeds).

### 4️⃣ `04-knowledge/` (The Epistemic Governance System)
- **Role:** Memory Controller, Epistemic Tracker, ADR Governor.
- **Function:** The Source-of-Truth Arbitration layer. Governs what the AI remembers and trusts. Enforces Anti-Recursive Hallucination guards, Memory Compaction, Epistemic TTLs, and Architecture Blast Radius mapping.

### 5️⃣ `05-research-rnd/` (The Sandbox & Chaos Simulator)
- **Role:** Experiment Governor, Adversarial UX Simulator.
- **Function:** A heavily quarantined sandbox for testing prototype AI models and running "Denial of Wallet" UX Swarms. Strictly forbidden from mutating production databases or architecture.

### 6️⃣ `06-ops-telemetry/` (The SRE & Observability Platform)
- **Role:** Task Orchestrator, Runtime Telemetry, SRE Responder.
- **Function:** The Ultimate Failsafe. Monitors Cognitive Drift, Token Economics, and TraceID completeness. Capable of pulling Epistemic Circuit Breakers, halting deadlocks, and triggering Checkpoint Rollbacks.

---

## 🛑 ORCHESTRATION RULES FOR AUTONOMOUS AGENTS
1. **Never Bypass the State Machine:** Do not jump from `EXECUTING` to `COMPLETED` without explicitly passing through `VALIDATING` (governed by `03-Security-QA`).
2. **Never Merge Conflicting Context:** If documents conflict, invoke Epistemic Arbitration based on Trust Tiers (`04-Knowledge`).
3. **Trace Every Action:** Silent failures are architectural violations. Every execution payload MUST be traceable and observable (`06-Ops`).
4. **Respect the Sandbox:** Do not modify `.env`, execute destructive database commands, or alter external infrastructure without triggering `APPROVAL_PENDING` (Human-in-the-Loop).
