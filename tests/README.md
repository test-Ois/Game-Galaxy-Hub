# Client and Integration Test Suite

## Purpose

This is the root container directory for client-side automated tests. It categorizes test scopes into unit, integration, and end-to-end (E2E) tests.

## Responsibilities

* Global testing configuration files
* Test setup scripts and global mock definitions
* Documentation and guides on testing conventions

## Example Files

* `setupTests.ts` - Configures browser mocks (like session sessionStorage/localStorage and media APIs)
* `jest.config.js` - Root Jest configuration for path mappings and test matching rules

## Architectural Rules

* Do not place source code, assets, or pages inside this directory.
* Tests must match their respective folders (`unit/`, `integration/`, `e2e/`) to maintain a clean division of testing concerns.

## Future Usage

Store root configuration files for testing frameworks (e.g. Jest, Vitest, Playwright, or Cypress) here when setting up automated client testing pipelines.
