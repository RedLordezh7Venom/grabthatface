# AGENTS.md

## Purpose
This file defines rules, expectations, and operational context for AI coding agents
working in this repository.

The system is a **production-grade ML-powered backend** providing **real-time online
inference** for **vision-based retrieval / visual querying**. The backend must be fast,
scalable, and explicit in behavior.

Agents should optimize for **clarity, safety, and speed**, not hidden abstractions.

---

## System Overview
- Backend: Python + FastAPI
- ML usage: Real-time inference (vision RAG / visual querying)
- Deployment: AWS (production, high traffic, horizontally scaled)
- Serving: FastAPI (no external model server unless explicitly introduced)
- MLOps maturity: Early (good practices, minimal ceremony)

---

## High-Level Architecture Expectations
- Inference is **online and synchronous**
- Training and experimentation are **separate from serving paths**
- Models are treated as **versioned artifacts**, not inline code blobs
- Configuration drives behavior; logic must remain explicit

Agents should assume:
- Low-latency requirements
- Concurrent requests at scale
- Cold starts and memory usage matter

---

## Environment & Tooling
- Python >= 3.x
- Experiment tracking: **MLflow**
- Data validation: **Great Expectations**
- Monitoring: **Prometheus**
- Feature store: None (features handled explicitly in code)

Agents may introduce new dependencies only if:
- They are production-ready
- They are justified in code comments or PR descriptions

---

## Model Lifecycle Rules

### Training & Experiments
- All experiments must be tracked in MLflow
- Each run must log:
  - Model version or hash
  - Dataset / data version
  - Key metrics
- No training logic should run in request-serving code paths

### Model Artifacts
- Models must be loadable deterministically
- No implicit downloads at runtime
- No silent fallbacks to “latest” without configuration

---

## Inference Rules
- Inference code must be:
  - Stateless per request
  - Thread-safe / async-safe where applicable
- Model loading should be:
  - Explicit
  - Cached
  - Logged

Agents should prefer:
- Clear preprocessing pipelines
- Explicit postprocessing
- Measurable latency

---

## Data Validation
- Input data assumptions must be validated
- Great Expectations checks must run:
  - Before training
  - Before bulk inference
- Agents must not bypass validation silently

---

## Monitoring & Observability
Agents should preserve or improve:
- Prometheus metrics for:
  - Request latency
  - Error rates
  - Model inference time
- Structured logging for inference decisions (no sensitive data)

---

## CI / Reliability Expectations
- Code should be testable without production infrastructure
- Changes that affect inference behavior must be test-covered
- Breaking API changes must be explicit

---

## What AI Agents Are Allowed To Do
Agents may:
- Add new ML models
- Modify training pipelines
- Refactor inference code
- Modify deployment manifests
- Change configuration files

Agents must:
- Keep logic explicit
- Avoid hidden side effects
- Prefer readable over clever

---

## Hard Restrictions (Do Not Violate)
- ❌ Do NOT change production paths without approval
- ❌ Do NOT introduce “magic” behavior (implicit loading, reflection-heavy logic, auto-discovery)
- ❌ Do NOT mix training logic into serving code paths
- ❌ Do NOT degrade observability
- ❌ Do NOT silently change model behavior

---

## Team Philosophy (Non-Negotiable)
- **No magic**
- **Speed over perfection**
- **Explicit > clever**
- **Readable code beats compact code**
- **Production safety over novelty**

If something is unclear, agents should ask for clarification rather than guessing.
