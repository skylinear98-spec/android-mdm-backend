require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "100kb" }));

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined
    })
  : null;

app.get("/", (req, res) => {
  res.json({
    name: "Android MDM Backend",
    status: "running",
    version: "1.0.0"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/health/db", async (req, res) => {
  if (!pool) {
    return res.status(503).json({
      status: "not_configured",
      message: "Database not configured"
    });
  }

  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error("Database check failed:", err.message);
    res.status(503).json({ status: "error", message: "Database connection failed" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`MDM backend listening on port ${port}`);
});

function shutdown() {
  server.close(async () => {
    if (pool) await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
