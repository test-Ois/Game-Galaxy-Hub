# Deployment & Production Build Guide

This document describes how to build, containerize, and deploy **Game Galaxy Hub** to staging and production environments.

## Environment Variables

Configure the following variables in your hosting environment or `.env` files:

| Variable | Description | Default | Required in Production |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SOCKET_URL` | Endpoint of the backend Socket.io server. | `http://localhost:3000` | **Yes** (if hosting server on a separate domain) |
| `PORT` | Local port the Express/Socket.io server listens on. | `3000` | No |
| `NODE_ENV` | Environment configuration flag. | `development` | Yes |

---

## Production Build Compilation

To generate optimized production bundles for local validation or server setup:

### 1. Build Client Frontend
Next.js compiles static pages, compiles styles, and minifies assets:
```bash
npm run build
```

### 2. Verify Server App Entry
Check that the server executes without build-time errors:
```bash
npm run start
```
By default, this runs `node server/src/app.js --production`.

---

## Docker Containerization

The backend service is pre-configured with a Dockerfile at `server/Dockerfile.server`. This ensures identical runtime environments across staging and production VPS targets.

### Dockerfile Breakdown

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY src/ ./src
EXPOSE 3000
CMD ["node", "src/app.js", "--production"]
```

### Building and Running the Docker Image

1. **Build the container**:
   ```bash
   docker build -t game-galaxy-server -f server/Dockerfile.server server/
   ```
2. **Run the container**:
   ```bash
   docker run -d -p 3000:3000 --name game-galaxy-server-running game-galaxy-server
   ```

---

## Cloud Hosting Platforms

### 1. Unified Deployment (Single Instance)
Because the Next.js frontend is served through Next's node runtime, and we use Express/Socket.io together, you can run the application as a single node deployment:
* **Platforms**: Render, Railway, Fly.io, or Heroku.
* **Setup**: Connect your GitHub repository, choose a "Web Service", set the build command to `npm run build`, and the start command to `node server/src/app.js`.

### 2. Split Deployment (Frontend static + Backend container)
For higher scalability, split the static frontend assets from the stateful websocket connection server:
* **Frontend**: Deploy Next.js to **Vercel** or **Netlify** (built as standard static / serverless pages). Set `NEXT_PUBLIC_SOCKET_URL` to point to the backend service.
* **Backend**: Deploy the `server/` subdirectory to a containerized platform (e.g. Render Web Services, Railway, or Fly.io) exposing port `3000`.

### 3. VPS Deployment (Docker Compose)
For deployments on virtual private servers (such as DigitalOcean, AWS EC2, or Linode):

Set up a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: server/Dockerfile.server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: always
```
Run `docker-compose up -d` to spawn the service in detached mode behind an Nginx reverse proxy configured with SSL certificates.
