import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import dotenv from "dotenv";
import { authRoutes } from "./routes/auth.routes.js";
import jwt from "@fastify/jwt";

import {
  prisma,
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

dotenv.config();

const app = Fastify({
  logger: true,
});

// ============================================================
// PLUGINS
// ============================================================

await app.register(cors, {
  origin: true,
});

await app.register(helmet);

await app.register(sensible);

await app.register(authRoutes, {
  prefix: "/api/auth",
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
});

// ============================================================
// ROUTES
// ============================================================

app.get("/", async () => {
  return {
    name: "API Monitoring System",
    version: "1.0.0",
    status: "running",
  };
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "api-monitoring-api",
    timestamp: new Date().toISOString(),
  };
});

app.get("/health/database", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    app.log.error(error);

    return {
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    };
  }
});

// ============================================================
// SERVER
// ============================================================

const PORT = Number(process.env.PORT) || 4000;

try {
  await connectDatabase();

  await app.listen({
    port: PORT,
    host: "0.0.0.0",
  });

  console.log(`API server running on http://localhost:${PORT}`);
} catch (error) {
  app.log.error(error);

  await disconnectDatabase();

  process.exit(1);
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const shutdown = async () => {
  console.log("Shutting down API server...");

  await app.close();
  await disconnectDatabase();

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
