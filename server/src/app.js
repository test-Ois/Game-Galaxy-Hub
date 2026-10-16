// ============================================================
// Custom Server — Next.js + Socket.io (Multiplayer Backend Entry)
// ============================================================

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { port, dev } = require("./config");
const { getHealth, getBackendStatus } = require("./controllers/healthController");
const { rooms } = require("./services/roomManager");
const { registerSocketHandlers } = require("./services/socketHandler");

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Route checks mapping
    if (pathname === "/health") {
      getHealth(req, res, rooms.size);
      return;
    }

    if (pathname === "/health-check" || pathname === "/backend-status") {
      getBackendStatus(req, res);
      return;
    }

    handle(req, res, parsedUrl);
  });

  // Restrict browser Socket.IO access to explicitly trusted app origins.
  // Configure CORS_ORIGIN as a comma-separated list for custom/split-origin deployments.
  const configuredOrigins = (process.env.CORS_ORIGIN || "https://game-galaxy-hub.vercel.app")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (dev) {
    configuredOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  const allowedOrigins = new Set(configuredOrigins);

  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        // Non-browser clients may not send Origin; browser origins must be allow-listed.
        if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin not allowed by Socket.IO CORS policy"));
      },
      methods: ["GET", "POST"],
    },
  });

  // Bind sockets listeners
  registerSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log("Online Multiplayer Mode: ENABLED");
    console.log("Storage Mode: In-Memory");
    console.log(`Ready on http://localhost:${port}`);
  });
});
