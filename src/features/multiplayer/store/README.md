# Multiplayer Feature Store

## Purpose

Designated for multiplayer state slices or lobbies, player lists, matchmaking statuses, and queue states.

## Responsibilities

* Tracking player queue time, current search status (idle, matching, connected)
* Preserving a list of available online rooms fetched from the directory

## Example Files

* `lobbyStore.ts` - Zustand slice for active room listings and matchmaking queue states

## Architectural Rules

* Follow the same pattern of Zustand state stores as the main store.
* Do not duplicate game-specific board states inside the lobby store.

## Future Usage

Move the active lobby listing array and queue-timer state from the global Zustand store to a dedicated store in this directory.
