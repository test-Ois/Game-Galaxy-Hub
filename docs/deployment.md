# Deployment guide

Game Galaxy Hub runs Next.js and Socket.IO together through server/src/app.js. The root Dockerfile builds the consolidated application.

For CI, Docker image publishing, preview smoke checks, server setup, and rollback, follow [CI/CD, Docker deployment, and rollback](ci-cd.md).

| Variable | Purpose | Default |
| --- | --- | --- |
| PORT | HTTP and Socket.IO listener port | 3000 |
| NODE_ENV | Runtime mode | Set to production in the container |
| NEXT_PUBLIC_SOCKET_URL | Optional public Socket.IO origin for split-origin deployments | Same-origin fallback when omitted |
| CORS_ORIGIN | Comma-separated allow-list of trusted browser origins for Socket.IO | `https://game-galaxy-hub.vercel.app` (localhost is added in development) |

NEXT_PUBLIC_SOCKET_URL is embedded by Next.js at build time. For split-origin hosting, pass it as a Docker build argument. Set `CORS_ORIGIN` on the backend to the exact frontend origin(s), comma-separated, with no trailing slash. For example: `https://game-galaxy-hub.vercel.app,https://your-preview-domain.vercel.app`. Do not use `*` in production.

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


## WebRTC voice connectivity

Voice chat uses public STUN servers by default. Some mobile carriers, corporate Wi-Fi, and strict NATs require a TURN relay; configure a trusted TURN provider in the frontend deployment environment when voice status remains `failed` or `disconnected`:

- `NEXT_PUBLIC_TURN_URL` — TURN URL, for example `turn:turn.example.com:3478` or `turns:turn.example.com:5349`
- `NEXT_PUBLIC_TURN_USERNAME` — TURN username
- `NEXT_PUBLIC_TURN_CREDENTIAL` — TURN credential

These are browser-visible values because WebRTC clients need them, so use short-lived/provider-issued credentials where possible. Do not commit credentials to the repository. After setting them, redeploy the preview environment and test voice with two separate devices/networks. A successful Socket.IO connection alone does not prove that WebRTC audio can pass through the network.
