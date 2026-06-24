# Express Middlewares

## Purpose

This folder contains Express middleware functions used to intercept, inspect, and modify HTTP requests or socket connection handshakes before they reach the controller endpoints or room handlers.

## Responsibilities

* Request authentication and validation
* CORS configuration and security headers
* Request rate limiting and DDoS protection
* General request logging and error handling wrappers

## Example Files

* `authMiddleware.js` - Validates JWT or session tokens
* `rateLimiter.js` - Throttles API requests based on IP
* `requestLogger.js` - Logs request methods, status codes, and latencies

## Architectural Rules

* Must conform to standard Express middleware signature: `(req, res, next) => void` or `(err, req, res, next) => void` for error handlers.
* Must always call `next()` or terminate the request flow (e.g. returning a status code error).
* Avoid database queries or complex business logic directly in the middleware; delegate to services.

## Future Usage

Implement request authentication or rate limiting here when deploying the backend to public production environments.
