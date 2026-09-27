import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import dotenv from "dotenv";

dotenv.config();

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

await app.register(helmet);

await app.register(sensible);

app.get("/health", async () => {
  return {
    status: "ok",
    service: "api-monitoring-api",
    timestamp: new Date().toISOString(),
  };
});

const PORT = Number(process.env.PORT) || 4000;

try {
  await app.listen({
    port: PORT,
    host: "0.0.0.0",
  });

  console.log(`API server running on http://localhost:${PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
