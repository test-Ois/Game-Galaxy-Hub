# End-to-End (E2E) Tests

## Purpose

Houses end-to-end tests verifying final user flows, socket connections, page transitions, and game loops across a headless browser environment.

## Responsibilities

* Testing complete user flows (joining lobby, initiating a matchmaking game, playing moves, seeing results)
* Validating multi-user socket synchronization (simulating two browser instances playing against each other)
* Checking routing, page loads, and layout responsiveness

## Example Files

* `matchmaking.spec.ts` - Automates two players joining the online arena, playing a complete Tic-Tac-Toe series, and asserting leaderboard updates
* `voiceChat.spec.ts` - Simulates granting microphone permissions, verifying voice channels, and testing mute/unmute buttons

## Architectural Rules

* E2E tests require a fully running instance of the frontend Next.js app and backend server.
* Use page objects for cleaner selectors and maintainable test flows.

## Future Usage

Set up E2E pipelines utilizing Playwright or Cypress to automate smoke testing prior to production deployments.
