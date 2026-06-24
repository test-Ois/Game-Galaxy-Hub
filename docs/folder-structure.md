# Project Folder Structure Guide

This document details the layout of the **Game Galaxy Hub** repository to assist new developers in navigating the codebase.

## Repository Overview

```
Game-Galaxy-Hub/
├── .github/              # CI/CD pipelines (GitHub Actions)
├── docs/                 # General design and architecture documentation
├── public/               # Static assets (sounds, images, PWA icons)
├── server/               # Backend Socket.io and Express Server
│   ├── src/
│   │   ├── config/       # Environment variables and system paths
│   │   ├── controllers/  # Express request handlers (e.g. health check)
│   │   ├── middlewares/  # Express middlewares (auth, logging)
│   │   ├── services/     # Backend game logic, socket event handlers, matchmaking
│   │   └── utils/        # Server utilities
│   ├── tests/            # Backend integration & unit tests
│   ├── Dockerfile.server # Containerization definition for server
│   └── package.json      # Server dependencies config
├── src/                  # Client-Side Application Source
│   ├── app/              # Next.js App Router (Routing and Pages)
│   ├── features/         # Feature-Driven domains (Isolated)
│   │   ├── chat/         # Text chat UI
│   │   ├── leaderboard/  # Leaderboard tracking
│   │   ├── ludo/         # Ludo components, boards, and constants
│   │   ├── multiplayer/  # Lobby, room match cards, socket hooks
│   │   ├── settings/     # Global game configurations and sound volumes
│   │   ├── tictactoe/    # Tic-Tac-Toe components and AI services
│   │   └── voice/        # Voice client hooks and WebRTC signaling
│   ├── shared/           # Common components and utilities
│   │   ├── components/   # Shared UI elements (Shadcn primitives, toggles)
│   │   ├── hooks/        # Shared custom hooks (e.g. useSound)
│   │   ├── services/     # Shared helper APIs (Socket client, generate ID)
│   │   └── types/        # Global TypeScript interfaces
│   └── store/            # Central Zustand store (Zustand state files)
├── tests/                # Automated testing suites (E2E, integration, unit)
└── [Config Files]        # Root configurations (TypeScript, Next.js, ESLint, Prettier)
```

---

## Detailed Directory Breakdown

### Root Directory

* **`server/`**: Houses the Node.js/Express application. Running independently or containerized, it hosts the Socket.io server to coordinate live matchmaking and client-to-client signaling.
* **`src/`**: Houses the Next.js client-side code, organized strictly using Feature-Driven Architecture (FDA).
* **`tests/`**: Houses root-level unit, integration, and E2E browser tests for the client-side app.
* **`public/`**: Stores static public assets. For example, local audio files (capture, clicks, dice roll sound clips) and PWA manifest assets.

---

## Key Configuration Files

* **`next.config.ts`**: Configures Next.js routing, headers, and compiler options.
* **`tsconfig.json`**: Configures TypeScript compiler and defines path aliases (e.g., `@/shared/*` or `@/features/*`).
* **`eslint.config.mjs`**: Contains ESLint linting rules to enforce code quality standards.
* **`package.json`**: Root project description. Defines frontend script runners (`dev`, `build`, `lint`, `format`) and dependency packages (Lucide, Framer Motion, Zustand).
