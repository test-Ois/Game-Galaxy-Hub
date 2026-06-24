# Tic-Tac-Toe Feature Store

## Purpose

Designated for Tic-Tac-Toe-specific state management slices or local Zustand stores if Tic-Tac-Toe state is decoupled from the main game store.

## Responsibilities

* Holding local player symbol selections, board configurations (3x3, 4x4, 5x5), and difficulty levels
* Storing the undo/redo stacks and history list for local matches

## Example Files

* `tictactoeStore.ts` - Zustand store for Tic-Tac-Toe board matrices, scores, and round configurations

## Architectural Rules

* Follow the same pattern of Zustand state stores as the main store.
* Do not duplicate general room sockets or user profiles which are managed centrally.

## Future Usage

When separating game-specific states from the global store, migrate the Tic-Tac-Toe board, scores, and history Zustand structure from `gameStore.ts` into a separate store here.
