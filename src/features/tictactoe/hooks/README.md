# Tic-Tac-Toe Feature Hooks

## Purpose

This folder contains React custom hooks designed to support UI interactions, gesture controllers, and local timing mechanics for the Tic-Tac-Toe game.

## Responsibilities

* Coordinating cell animations and hover effects
* Triggering AI move delays or series round transitions on the frontend

## Example Files

* `useAIMoveTrigger.ts` - Orchestrates the delay timeout before dispatching the AI move to the Zustand store for better UX

## Architectural Rules

* Hooks must be React-dependent and leverage React hooks (e.g. `useState`, `useEffect`).
* Keep business logic in services and only coordinate rendering behaviors or local events in hooks.

## Future Usage

Extract the AI thinking delay timer or cell hover transition coordinates into dedicated custom hooks here.
