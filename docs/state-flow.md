# Client State Flow & Store Guide

This document details the state management architecture of the **Game Galaxy Hub** client application.

## Client State Architecture

The application uses **Zustand** as its primary client-side state manager. The central store is defined in `src/store/gameStore.ts`. It acts as a single source of truth for both offline single-player/pass-and-play game modes and online multiplayer lobbies.

```
+-------------------------------------------------------------+
|                        gameStore.ts                         |
|  (Central Zustand state store for Tic-Tac-Toe & Ludo)       |
+-------------------------------------------------------------+
             |                                     |
             v                                     v
  +----------------------+              +----------------------+
  |     Offline Mode     |              |     Online Mode      |
  |  - Local moves       |              |  - Server roomState  |
  |  - AI minimax cycles |              |  - Socket events     |
  |  - Undo/Redo stacks  |              |  - WebRTC voice sync |
  +----------------------+              +----------------------+
```

---

## Store Segmentation

The store partition can be divided into three logical spaces:

### 1. Offline Gameplay State
* **`board`**: Matrix array tracking grid tokens (`"X" | "O" | null`).
* **`boardSize`**: Size selector (`3 | 4 | 5`).
* **`currentPlayer`**: Player turn indicator (`"X" | "O"`).
* **`history` / `redoStack`**: Arrays of `Move` interfaces supporting backward and forward time travel.
* **`isGameOver` / `winResult`**: Flags describing the end-of-round state.

### 2. Series & XP Scoring
* **`scores`**: Record mapping `"X"`, `"O"`, and `"D"` (Draws) to victory tallies.
* **`seriesWins`**: Tracks progress toward the series goals.
* **`seriesTarget`**: Wins required to claim series victory.
* **`matchHistory`**: A rolling log of the last 50 matches played.

### 3. Online Synchronization State
* **`onlineRoom`**: Holds the deserialized `OnlineRoom` payload broadcasted by the server.
* **`onlinePlayerSymbol`**: The symbol assigned during matchmaking (`"X"` or `"O"` for Tic-Tac-Toe; `"red"`, `"green"`, `"yellow"`, or `"blue"` for Ludo).
* **`onlinePlayerId`**: The client's unique persistent identifier.
* **`chatHistory`**: Accumulation of chat logs for the active room.
* **`ludoState`**: Active board coordinate matrix for online Ludo.

---

## State Transitions & Game Loops

### Offline Loop (Tic-Tac-Toe vs AI)

1. **Move Input**: Player clicks a cell -> `makeMove(index)` runs.
2. **Move Validation**: Updates the `board` matrix, calculates win/draw patterns via `engine.ts` services, and appends the move to `history`.
3. **Turn Toggle**: Updates `currentPlayer` to the AI's symbol.
4. **AI Trigger**: Page component fires `triggerAIMove()`.
5. **AI minimax**: An asynchronous delay (400ms) runs to simulate "thinking" before `getAIMove()` evaluates the best move using minimax with alpha-beta pruning.
6. **AI Move Dispatch**: AI calls `makeMove(aiIndex)`, returning the turn to the human.

### Online Synchronization Loop

1. **Event Broadcast**: The server updates room states on the backend.
2. **Socket Listener**: The custom hook `useOnlineSocket.ts` intercepts the `roomUpdated` Socket event containing the backend `OnlineRoom` state.
3. **Zustand Update**: The hook dispatches `updateFromOnlineRoom(room)`.
4. **Reactive Render**: UI components subscribe to Zustand fields and render the updated state (e.g. dice values, token positions) instantly.

---

## State Persistence

The Zustand store is wrapped with the **`persist`** middleware to ensure critical records survive browser reloads:

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: "ttt-game-store",
    partialize: (state) => ({
      scores: state.scores,
      matchHistory: state.matchHistory,
      mode: state.mode,
      difficulty: state.difficulty,
      boardSize: state.boardSize,
      seriesMode: state.seriesMode,
    }),
  }
)
```

### Serialized Properties
Only offline settings, high scores, difficulty preferences, and local match records are persisted to browser `localStorage`. Live connection details (such as active socket references, transient chat message lists, or temporary opponent names) are ignored to prevent stale states on application boot.
