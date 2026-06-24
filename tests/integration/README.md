# Client Integration Tests

## Purpose

Houses integration tests that verify interactions between multiple components, such as state stores, custom hooks, and React UI layout managers.

## Responsibilities

* Validating that UI components properly react to and update the state stores
* Testing custom React hooks that orchestrate network states (e.g. voice chat, multiplayer socket hooks)
* Testing offline local game modes (pass-and-play) from initial setup to game completion

## Example Files

* `LudoOfflineArena.test.tsx` - Simulates token moves, dice rolling, and screen changes for the pass-and-play component
* `useOnlineSocket.test.ts` - Validates the integration of Socket.io client hooks with the global Zustand store

## Architectural Rules

* External network layers (like real socket servers) should be mocked, but the local hook and store flow should be tested end-to-end.
* Verify user interaction flows using React Testing Library.

## Future Usage

Implement tests that require checking if components, hooks, and local stores collaborate correctly under simulated user clicks.
