// ============================================================
// Server Configuration
// ============================================================

if (process.argv.includes("--production")) {
  process.env.NODE_ENV = "production";
}

const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

module.exports = {
  port,
  dev,
};
