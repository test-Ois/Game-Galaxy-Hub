# Multiplayer Feature Services

## Purpose

Houses generic multiplayer coordination services, such as matchmaking adapters, WebRTC peer-to-peer signaling interfaces, and shared network handlers.

## Responsibilities

* Initializing peer connection instances for voice/data channels
* Coordinating socket room broadcasts and events with game controllers
* Formatting client-side API headers and payloads for lobby connections

## Example Files

* `webrtcService.ts` - Orchestrates PeerConnection handshakes, ICE candidates, and audio tracks
* `lobbyService.ts` - Interfaces with the matchmaking endpoint to find active game lobbies

## Architectural Rules

* Must contain pure TypeScript logic with no rendering elements.
* Must not depend directly on game-specific engines (like Ludo or Tic-Tac-Toe); keep network layers generic.

## Future Usage

Move WebRTC signaling logic or generic lobby matchmaking API calls here to separate them from React component files.
