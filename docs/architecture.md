# System Architecture Guide

This document outlines the high-level system architecture of **Game Galaxy Hub**, detailing the structural rules, feature isolation boundaries, and overall design patterns.

## System Overview

Game Galaxy Hub is a real-time multiplayer board game platform designed for low-latency gameplay, voice communications, and chat. It consists of two major components:

1. **Frontend Application**: Built using Next.js (App Router), React, TailwindCSS, Framer Motion for premium animations, and Zustand for client-side state management.
2. **Backend Server**: A lightweight Node.js/Express server integrated with Socket.io for real-time signaling, matchmaking room management, and WebRTC signaling (voice chat coordination).

---

## Feature-Driven Architecture (FDA)

The codebase strictly adheres to a **Feature-Driven Architecture**, organizing code by feature modules rather than technical layers.

```
src/
├── app/                  # App Router page layouts (thin routing only)
├── features/             # Feature modules (isolated domains)
│   ├── chat/             # Real-time text chat
│   ├── leaderboard/      # Global XP tracking and score listings
│   ├── ludo/             # Ludo offline & online gameplay
│   ├── multiplayer/      # Room lobby and general matchmaking
│   ├── settings/         # App configuration modal and volume state
│   ├── tictactoe/        # Tic-Tac-Toe local & online gameplay
│   └── voice/            # WebRTC voice chat coordinates
└── shared/               # Shared system components, hooks, services
```

### Architectural Rules & Boundaries

1. **Strict Feature Isolation**: Features must remain independent from one another. A feature module is not allowed to import components, hooks, services, or constants from another feature.
   * ❌ **Not Allowed**: `src/features/ludo` importing from `src/features/tictactoe`.
2. **Shared Layer Dependency**: If multiple features require common logic (such as types, custom buttons, general hooks like sounds, or socket clients), that logic must be placed inside the `src/shared/` directory.
   * ✅ **Allowed**: `src/features/ludo` and `src/features/tictactoe` importing from `src/shared/`.
3. **Public APIs (Barrel Exports)**: Every feature must expose a public API via an `index.ts` file at its root. Other parts of the application (like routing pages in `src/app/` or hooks in other parts of `shared/`) may only import from this public index.
   * Example: `import { TicTacToeOnlineArena } from "@/features/tictactoe";`
4. **Thin Routing Pages**: Next.js app router files (`page.tsx`) must remain extremely thin, only rendering the primary arena or feature component and passing parameters. They must contain no database operations, socket listeners, or gameplay state definitions.
5. **No Network Logic in UI Components**: WebRTC connection handlers, Socket event listeners, and complex game engines must reside in dedicated hooks or services rather than JSX components.

---

## Technical Separation of Concerns

Each feature folder is organized into standardized directories to promote codebase maintainability:

* **`components/`**: React representation components. Focuses strictly on drawing grids, tokens, panels, and modal UI boxes.
* **`services/`**: Pure TypeScript modules executing gameplay validation (check winner, calculate next track spot, formulate socket messages).
* **`constants/`**: Game configurations, board layout dimensions, colors, and animation speeds.
* **`hooks/`**: React custom hooks managing component-local state (rolling dice animations, keyboard listeners, page transitions).
* **`store/`**: Local Zustand store slices for decoupled feature configurations.
* **`types/`**: TypeScript type definitions specific to the feature.
