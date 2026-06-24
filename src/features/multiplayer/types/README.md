# Multiplayer Feature Types

## Purpose

Houses TypeScript declarations, interfaces, and enums specific to generic multiplayer matching and lobbies.

## Responsibilities

* Declaring types for matchmaking statuses, room structures, and multiplayer player records
* Typing general WebRTC event payloads

## Example Files

* `multiplayerTypes.ts` - Declares `MatchmakingStatus` union types and WebRTC connection models

## Architectural Rules

* This folder must only contain types (`.d.ts` or type-only `.ts` files). No runtime JavaScript or constants.

## Future Usage

Move generic multiplayer types (like `OnlinePlayer` or `OnlineRoom`) from the central `src/shared/types/game.ts` to this localized directory.
