// ============================================================
// Health Controller — Status Checks endpoints
// ============================================================

function getHealth(req, res, roomsCount) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      uptime: process.uptime(),
      rooms: roomsCount,
      timestamp: new Date().toISOString(),
    })
  );
}

function getBackendStatus(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      service: "Game Galaxy Hub — Consolidated Multiplayer Backend",
      status: "running",
      version: "1.0.0",
    })
  );
}

module.exports = {
  getHealth,
  getBackendStatus,
};
