# Ludo Feature Types

## Purpose

Houses TypeScript type declarations, interfaces, and union types specific to the Ludo feature.

## Responsibilities

* Declaring shapes for Ludo tokens, player alignments, and coordinate groups
* Typing Ludo-specific events and configurations

## Example Files

* `ludoTypes.ts` - Declares `LudoTokenState`, `LudoBoardCell`, and `LudoMoveEvent` interfaces

## Architectural Rules

* This folder must only contain types (`.d.ts` or type-only `.ts` files). No runtime JavaScript code, constants, or executable statements.

## Future Usage

Move Ludo-specific type declarations (like `LudoRoomState` or `LudoColor`) from the central `src/shared/types/game.ts` to this localized directory.
