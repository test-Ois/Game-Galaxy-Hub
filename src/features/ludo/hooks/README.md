# Ludo Feature Hooks

## Purpose

This folder houses Ludo-specific React custom hooks designed to encapsulate UI triggers, timers, dice mechanics, and local game animations.

## Responsibilities

* Orchestrating dice roll animations and temporary values
* Managing token animation sequences (e.g. hop path ticks, capture bounces)
* Binding keyboard shortcuts or game event listeners

## Example Files

* `useDiceRoller.ts` - Custom hook managing rolling state, duration, and triggering sound effects
* `useTokenAnimator.ts` - Calculates path offsets for token movements to enable step-by-step token hops

## Architectural Rules

* Hooks must be React-dependent and leverage React hooks (e.g. `useState`, `useEffect`, `useCallback`).
* All backend communications should be kept in services or general socket providers; keep hooks focused on front-end coordination.

## Future Usage

Extract dice-roll timing controls or token animation mechanics from components and place them here.
