# Ludo Feature Store

## Purpose

Designated for Ludo-specific state management slices or local Zustand stores if Ludo state is decoupled from the main game store.

## Responsibilities

* Holding local player settings (like token skins or custom board color themes)
* Offline match history and auto-save state for suspended pass-and-play Ludo matches

## Example Files

* `ludoStore.ts` - A Zustand store containing Ludo settings and local configurations

## Architectural Rules

* Follow the same pattern of Zustand state stores as the main store.
* Avoid duplicating room synchronization state, which is handled centrally by the socket and global stores.

## Future Usage

When separating game-specific states from the global store, migrate the `ludoState` Zustand structure from `gameStore.ts` into a separate store here.
