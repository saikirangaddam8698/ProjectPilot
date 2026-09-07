# ProjectPilot Standard Operating Policies & Company Guidelines

## Executive Summary
This document defines the standard operating policies, quality standards, security compliance rules, and team working agreements for all software projects managed within ProjectPilot.

## 1. Project Management & Agile Workflow Policy
- **Sprint Length**: Standard sprints run on a 2-week cycle starting on Monday and ending on Friday.
- **Sprint Ceremonies**: Daily Standups (15 mins), Sprint Planning (bi-weekly), Sprint Review & Demo (end of sprint), and Retrospective.
- **Backlog Management**: Product Managers maintain groomed backlog tickets prioritized by business value, user impact, and technical dependency.
- **Story Point Estimation**: Points follow modified Fibonacci sequence (1, 2, 3, 5, 8, 13). Any ticket exceeding 8 points must be broken down into smaller sub-tasks.

## 2. Code Review & Quality Assurance Policy
- **Pull Request Requirement**: All code changes require an approved Pull Request (PR) with at least one senior engineer review before merging into `main`.
- **Automated Testing Threshold**: Pull requests must pass automated unit and integration test suites with zero test failures.
- **Branch Naming Standard**: Feature branches must include the ticket key (e.g., `feature/PILOT-101-ai-metrics-drawer`).

## 3. Data Protection & Security Policy
- **Zero Credential Hardcoding**: API keys, database connection strings, and JWT secrets must **never** be checked into source control or stored in client-side code.
- **Project Data Isolation**: Users are granted access strictly to their authorized project workspaces. Attempting to access cross-project data or bypass project RBAC is a security violation.
- **Sensitive Data Sanitization**: Customer data and PII must be sanitized or masked in logs, telemetry events, and development database dumps.

## 4. AI Copilot Usage Policy
- **Operational Data Authority**: The ProjectPilot AI Copilot provides intelligent analysis grounded in live project data and Knowledge Base documentation.
- **Human Oversight**: AI-generated risk evaluations, sprint pace predictions, and code recommendations serve as decision-support insights and require human review for critical decisions.
