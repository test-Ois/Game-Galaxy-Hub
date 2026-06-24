# Developer Onboarding & Extension Guide

This guide helps new developers set up their local development environment and walk through creating new features or modifying existing layouts.

## Prerequisites

* **Node.js**: Version `20.x` or higher (Active LTS recommended).
* **Package Manager**: `npm` (v10.x or higher).
* **Editor**: Visual Studio Code (recommended extensions: ESLint, Prettier, Tailwind CSS IntelliSense).

---

## Local Development Setup

Follow these steps to get your environment up and running:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/game-galaxy-hub.git
   cd game-galaxy-hub
   ```
2. **Install dependencies**:
   Installs Next.js dependencies, socket client tools, and formatting config modules:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy the example file to `.env.local` to override settings:
   ```bash
   cp .env.example .env.local
   ```
4. **Boot Local Development Server**:
   Launches both the backend Socket.io server and compiles Next.js assets in watch mode:
   ```bash
   npm run dev
   ```
   * Frontend: Access [http://localhost:3000](http://localhost:3000)
   * Backend Socket endpoint: [http://localhost:3000](http://localhost:3000)

---

## Development Command Scripts

Ensure your code is verified prior to committing changes:

* **Format Code**: Run Prettier to apply code styling guidelines:
  ```bash
  npm run format
  ```
* **Lint Check**: Run ESLint to review syntax errors or static path violations:
  ```bash
  npm run lint
  ```
* **Verify Build**: Test compile safety for pages, types, and imports:
  ```bash
  npm run build
  ```

---

## Guide for Adding a New Feature

When adding a new game (e.g. Checkers or Chess) or helper features, follow these architectural constraints:

### Step 1: Create the Feature Module
Create a new directory under `src/features/` containing standard directories:
```
src/features/checkers/
├── components/        # React rendering components
├── services/          # Stateless game rules, move validator
├── constants/         # Board styles, starting positions
├── types/             # Checkers type declarations
└── index.ts           # Barrel file exposing the public API
```

### Step 2: Write the Public API
Declare what components or hooks are exposed outside of the feature:
```typescript
// src/features/checkers/index.ts
export { CheckersArena } from "./components/CheckersArena";
export type { CheckersBoardState } from "./types/checkersTypes";
```

### Step 3: Implement Game Logic
Keep gameplay logic isolated:
* Place coordinates, colors, and configuration maps in `constants/`.
* Place win calculations, move validators, and capture routines in `services/`.
* Place UI layouts, button selectors, and animations in `components/`.

### Step 4: Map App Routing
Add your new pages under `src/app/` to hook up pages, ensuring page files are thin wrappers:
```tsx
// src/app/play/checkers/page.tsx
"use client";

import { CheckersArena } from "@/features/checkers";

export default function CheckersPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <CheckersArena />
    </main>
  );
}
```
 Ensure that no features import directly from other features; use the `shared` module for cross-feature code.
