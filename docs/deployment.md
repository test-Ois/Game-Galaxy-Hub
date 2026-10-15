# Deployment guide

Game Galaxy Hub runs Next.js and Socket.IO together through server/src/app.js. The root Dockerfile builds the consolidated application.

For CI, Docker image publishing, preview smoke checks, server setup, and rollback, follow [CI/CD, Docker deployment, and rollback](ci-cd.md).

| Variable | Purpose | Default |
| --- | --- | --- |
| PORT | HTTP and Socket.IO listener port | 3000 |
| NODE_ENV | Runtime mode | Set to production in the container |
| NEXT_PUBLIC_SOCKET_URL | Optional public Socket.IO origin for split-origin deployments | Same-origin fallback when omitted |

NEXT_PUBLIC_SOCKET_URL is embedded by Next.js at build time. For split-origin hosting, pass it as a Docker build argument.

Local production run:

~~~bash
npm ci
npm run build
NODE_ENV=production PORT=3000 npm run start
~~~

Docker:

~~~bash
docker compose up --build -d
docker compose ps
curl --fail http://localhost:3000/health
docker compose logs -f app
docker compose down
~~~

The container exposes port 3000 and reports health through /health.
