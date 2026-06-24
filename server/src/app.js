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

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
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
