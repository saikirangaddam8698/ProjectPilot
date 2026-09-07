# Frontend Architecture & UI Component Design

## Architectural Overview
The ProjectPilot frontend is built as a highly responsive Single Page Application (SPA) using Vue 3, Vite, and Pinia. It adheres to strict design token governance, dynamic layout responsiveness, and unidirectional data flow.

## State Management Architecture (Pinia Stores)
Application state is decoupled across focused domain stores in `client/src/stores/`:

1. **`project.store.js`**: Manages workspace project selection, active project context, and project list.
2. **`ticket.store.js`**: Handles Kanban state, ticket CRUD operations, backlog sorting, status changes, and team workload calculation.
3. **`sprint.store.js`**: Manages sprint creation, activation, story point burndown, and completion logic.
4. **`knowledge.store.js`**: Manages knowledge document uploads, vector indexing status polling (`PROCESSING`, `READY`, `FAILED`), search filters, and document deletion.
5. **`activity.store.js`**: Acts as a **pure unidirectional event log store**. Domain stores emit operational events to `activityStore`, which records timeline events without triggering circular side effects.
6. **`ai.store.js`**: Manages persistent conversation sessions, active chat drawer state, streaming turn updates, telemetry metrics, and AI drawer controls.

## Design System & Theme Engine
- **CSS Variables**: Core tokens defined in `client/src/assets/styles/tokens.css` (color scales, glassmorphism overlays, elevation shadows, typography scale).
- **Theme Switching**: Dark and light mode toggle via standard root class binding (`.dark-theme`).
- **Interactive Micro-Animations**: Smooth transition effects for slide-over drawers, modal dialogs, and progress bars.

## Architectural Rules for Frontend Development
- **No Direct Mutation of Global Arrays**: Components perform state changes exclusively by calling Pinia store actions.
- **Pure Store Event Emission**: UI components and watcher lifecycles must **never** directly emit audit events to `activityStore`. Events are emitted strictly inside domain stores (`ticketStore`, `sprintStore`, `projectStore`).
- **Dynamic Layout Math**: Modal heights, drawer widths, and scroll containers compute layout bounds dynamically using CSS flexbox/grid rather than hardcoded pixel offsets.
