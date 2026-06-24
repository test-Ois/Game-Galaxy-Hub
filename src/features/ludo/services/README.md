# Ludo Feature Services

## Purpose

This folder contains Ludo-specific business logic, rules engine calculations, and game-specific socket synchronization helpers.

## Responsibilities

* Move validity checking (e.g. checking if token can exit base, or home path caps)
* Turn advancement state machines
* Piece capture detection and home reach calculations
* Formulating socket requests for multiplayer moves

## Example Files

* `moveValidator.ts` - Functions to verify valid moves for a given dice roll
* `ludoSocketService.ts` - Formats payload and emits `LUDO_ROLL_DICE` or `LUDO_MOVE_TOKEN` events

## Architectural Rules

* Code must be pure TypeScript/JavaScript and must not import React or UI components.
* Stateless functions are preferred to simplify testing and reuse across online/offline components.

## Future Usage

Implement rules for Ludo variations (like safe zones, blockades, or multiple dice modes) in this directory.
