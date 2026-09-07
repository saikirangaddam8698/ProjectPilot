# Authentication & Security Architecture Specification

## Overview
Security in ProjectPilot is enforced through stateless JSON Web Token (JWT) authentication, bcrypt password hashing, HTTP-only cookie transport, strict secret protection, and zero credential exposure contracts.

## Password Hashing & Credentials Handling
- **Algorithm**: Passwords are hashed using `bcryptjs` with a cost factor (salt rounds) of 10.
- **Credential Storage**: Raw plaintext passwords are **never** stored in the database.
- **Sanitization Rule**: User objects returned by API endpoints, services, or repositories automatically omit `passwordHash` from payload objects.

## Token Lifecycle & Transport
- **Token Generation**: Upon successful login (`POST /api/v1/auth/login`), `generateAuthToken` creates a signed JWT containing user ID (`id`), email, system role (`role`), and member ID (`memberId`).
- **Transport Mechanisms**:
  1. **HTTP Authorization Header**: `Authorization: Bearer <token>`
  2. **HttpOnly Cookie**: Signed cookie `token` with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes in production.
- **Token Verification**: Middleware `authenticateToken` decodes tokens, verifies expiration, and populates `req.user`. Requests with invalid, missing, or expired tokens receive an HTTP `401 Unauthorized` response.

## User System Roles
- **`ADMIN`**: Global system administrative role with access to all projects and administrative controls.
- **`PROJECT_MANAGER`**: Manages team members, sprints, backlog, and project settings within assigned projects.
- **`DEVELOPER`**: Creates, updates, and transitions assigned tickets and uploads knowledge base documentation.
- **`QA_ENGINEER`**: Reviews tickets, executes test validation, and files defect tickets.
- **`VIEWER`**: Read-only access to assigned workspace resources.
