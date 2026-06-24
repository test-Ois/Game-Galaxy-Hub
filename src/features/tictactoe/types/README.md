# Tic-Tac-Toe Feature Types

## Purpose

Houses TypeScript declarations, interfaces, and union types specific to the Tic-Tac-Toe game mechanics.

## Responsibilities

* Declaring shapes for cell matrices, player turns, and series configurations
* Typing AI moves and win condition patterns

## Example Files

* `tictactoeTypes.ts` - Declares `CellValue`, `Player`, `WinResult`, and `BoardSize` interfaces

## Architectural Rules

* This folder must only contain types (`.d.ts` or type-only `.ts` files). No runtime JavaScript or constants.

## Future Usage

Move Tic-Tac-Toe-specific type declarations (like `CellValue`, `WinResult`, or `BoardSize`) from the central `src/shared/types/game.ts` to this localized directory.
