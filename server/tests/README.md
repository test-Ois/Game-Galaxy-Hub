# Server Test Suite

## Purpose

This directory is designated for the backend test suites, covering server routes, room state cleanups, matchmaking systems, and Socket.io signaling behaviors.

## Responsibilities

* Unit tests for the room and game managers
* Integration tests for Socket.io events and room matchmaking
* Mock socket connections to simulate multiplayer traffic

## Example Files

* `roomManager.test.js` - Tests room creation, joins, timeouts, and automatic room sweeping
* `socketHandler.test.js` - Simulates client-socket events and validates broadcast responses

## Architectural Rules

* Server tests must run isolated from Next.js client-side tests.
* External network calls or DB connections must be fully mocked.
* Maintain clean setup/teardown handlers (`beforeEach`/`afterEach`) to avoid socket listener leaks.

## Future Usage

When a test runner is configured (e.g. Mocha/Chai or Jest), implement automated integration tests for backend socket handlers in this folder.
