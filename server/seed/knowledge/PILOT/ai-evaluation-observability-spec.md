# AI Evaluation & Observability Specification

## Overview
ProjectPilot incorporates a comprehensive AI telemetry, metric tracking, and deterministic evaluation architecture to monitor model accuracy, response latency, token consumption, and safety compliance.

## Telemetry & Event Tracking (`AiTelemetryService`)
Every AI interaction generates telemetry events recorded in server logs and memory buffers:
- **`AI_REQUEST_STARTED`**: Emitted when a user initiates a chat turn, tracking `requestId`, `projectKey`, and `userId`.
- **`AI_TOOL_EXECUTED`**: Emitted upon completion of each read-only tool call, tracking `toolName`, `round`, `durationMs`, and `success`.
- **`AI_RAG_SEARCH`**: Emitted when `search_project_knowledge` is executed, tracking query terms, vector search latency, and chunk counts.
- **`AI_REQUEST_COMPLETED`**: Emitted upon final response synthesis, recording total latency, Gemini latency, tool latency, token counts, and agent rounds.
- **`AI_REQUEST_FAILED`**: Emitted on execution failures, classifying errors into categorized error taxonomies (`GEMINI_TIMEOUT`, `AGENT_TIMEOUT`, `CONCURRENCY_LIMIT`, `CLIENT_CANCELLED`, `RATE_LIMITED`).

## Deterministic Evaluator (`AiEvaluator`)
The `AiEvaluator` runs post-execution verification checks against generated response payloads:
1. **Tool Allowlist Check**: Verifies that executed tools belong strictly to the 7 approved read-only tools.
2. **Citation Grounding Check**: Ensures cited sources correspond to actual retrieved RAG chunks in the current turn.
3. **Secret Protection Check**: Scans response text for accidental leakage of API keys, JWT secrets, database connection strings, or password hashes.
4. **Confidence Rating Validation**: Validates that assigned confidence ratings (`LOW`, `MEDIUM`, `HIGH`) match available evidence.

## Quality Metrics Endpoint (`GET /api/v1/ai/metrics`)
Exposes aggregated operational telemetry to authorized project members:
- **Total Evaluations**: Count of processed AI turns.
- **Pass Rate (%)**: Percentage of evaluations passing all evaluator safety checks.
- **Groundedness (%)**: Percentage of responses whose citations are grounded in verified tool/RAG data.
- **Tool Accuracy (%)**: Percentage of tool executions completing successfully without error.
- **Average Latency**: Breakdown of total latency, Gemini model latency, and database tool latency.
- **Token Usage**: Cumulative prompt, response, and total token counts.
