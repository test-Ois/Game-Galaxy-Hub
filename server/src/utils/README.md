# Server Utilities

## Purpose

This folder contains reusable, stateless utility functions and helper scripts shared across various backend components of the Express and Socket.io server.

## Responsibilities

* Console logging and file formatting utilities
* Data hashing and cryptography helpers
* String parsing, validation, and object formatting
* Date/time operations and timers

## Example Files

* `logger.js` - Color-coded console logger with timestamps
* `validator.js` - Helper functions to validate incoming request body shapes
* `uuid.js` - Unique ID generator helpers for room keys

## Architectural Rules

* All utilities must be stateless, side-effect-free, and deterministic wherever possible.
* Utilities must not import or depend on database state, room handlers, or controllers.
* Do not place gameplay calculations or room matching algorithms in this directory.

## Future Usage

Place any generic, non-gameplay helpers (such as custom log formatters or string sanitation utilities) here.
