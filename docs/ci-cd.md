# CI/CD, Docker deployment, and rollback

## Automatic workflows

- **CI** runs on pull requests to main, pushes to main and feature/fix/chore branches, and manual dispatch. It runs ESLint, TypeScript, Node regression tests, the Next.js production build, and a Docker build. CI never publishes an image.
- **Preview checks** launch the production server on the runner and check the home page, /health, /health-check, and the Socket.IO polling handshake. To also test a hosted preview, manually run the workflow and supply preview_url.
- **Backend Docker deploy** is manual only. Both inputs default to false. publish_image publishes an immutable SHA-tagged image to GHCR; deploy_to_server enables SSH deployment only when publishing is also selected. No push or pull request deploys production.

## Current architecture

server/src/app.js serves Next.js and Socket.IO in one Node process. The container runs this consolidated app, not a separate server-only process. /health is the container readiness endpoint. Room state and timers are in memory, so run one instance until shared state and a Socket.IO adapter are added.

## Local Docker

~~~bash
docker compose up --build -d
docker compose ps
curl --fail http://localhost:3000/health
docker compose logs -f app
docker compose down
~~~

For a separate frontend origin, set NEXT_PUBLIC_SOCKET_URL at image build time because Next.js embeds it in the client bundle. For single-origin hosting, leave it unset.

## Configure a server deployment

The manual deploy workflow expects a Linux host with Docker Engine, the Compose plugin, curl, and SSH. Copy docker-compose.yml to DEPLOY_PATH and keep the service named app. Configure the host to pull the GHCR package with a read-only package token before the first deployment (docker login ghcr.io as the deploy user).

GitHub Actions secrets:
- DEPLOY_HOST — SSH hostname or IP
- DEPLOY_USER — deployment user
- DEPLOY_SSH_KEY — private SSH key
- DEPLOY_SSH_KNOWN_HOSTS — pinned known_hosts lines; host-key verification remains enabled
- DEPLOY_PATH — absolute directory containing docker-compose.yml
- DEPLOY_SSH_PORT — optional, defaults to 22

Optional repository variable: DEPLOY_HEALTH_PORT — host-local port mapped to container port 3000, defaults to 3000.

Create a GitHub Environment named staging and place deployment secrets there if environment protection should gate SSH deployment. Keep deploy_to_server false until host access, GHCR access, and smoke checks are verified.

## Rollback

Published images use immutable sha-<full-commit-sha> tags. The SSH workflow records the current container image before updating. If /health stays unhealthy for about 60 seconds, it attempts to restore the previous image and checks health again. The workflow still fails so the bad release is visible. The first deployment has no previous image to restore.

Manual rollback on the host:

~~~bash
cd /absolute/path/to/deployment
IMAGE_TAG=sha-<previous-good-commit-sha> docker compose pull app
IMAGE_TAG=sha-<previous-good-commit-sha> docker compose up -d --no-build app
curl --fail http://127.0.0.1:3000/health
~~~

If rollback health checks fail, inspect docker compose logs --tail=200 app and restore the last known-good SHA after correcting configuration.

## Safety notes

- HTTP health and Socket.IO handshake checks do not replace two-browser QA for reconnects, chat, Ludo token moves, and turn handling.
- Keep the service at one replica until room state is shared across instances.
- Production deployment is not wired to push or pull_request; the SSH path is manual and requires explicit inputs plus staging secrets.
