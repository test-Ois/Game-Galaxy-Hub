# Client Unit Tests

## Purpose

Houses unit tests focused on testing isolated units of logic: utility functions, game engine calculations, and Zustand store action transitions.

## Responsibilities

* Validating deterministic mathematical functions (e.g. Tic-Tac-Toe win lines, Ludo path calculations)
* Testing state store action dispatching (Zustand state mutations)
* Testing simple, stateless presentation components (buttons, badges, grids) in isolation

## Example Files

* `engine.test.ts` - Tests win condition checks, draw evaluation, and move application
* `gameStore.test.ts` - Validates scores, undo/redo stacks, and series victory triggers in the Zustand store

## Architectural Rules

* Unit tests must remain stateless and execution time must be minimal (no network calls or complex renders).
* Use mock data instead of real API/Socket interfaces.

## Future Usage

Implement unit tests for client-side state actions or complex algorithmic functions here.
