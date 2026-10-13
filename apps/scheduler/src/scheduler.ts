import "dotenv/config";

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import amqp from "amqplib";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../../apps/api/.env"),
});

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

function getRabbitMQUrl(): string {
  const url = process.env.RABBITMQ_URL;

  if (!url) {
    throw new Error("RABBITMQ_URL environment variable is required");
  }

  return url;
}

const RABBITMQ_URL: string = getRabbitMQUrl();

const QUEUE_NAME = "monitor.check";
const SCHEDULER_INTERVAL = 5000;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

interface Monitor {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCode: number;
  headers: Record<string, string> | null;
  body: string | null;
  lastCheckedAt: Date | null;
  lastScheduledAt: Date | null;
}

interface MonitorJob {
  monitorId: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  timeoutMs: number;
  expectedStatusCode: number;
  headers?: Record<string, string>;
  body?: string;
}

async function connectDatabase(): Promise<void> {
  await pool.query("SELECT 1");
  console.log("PostgreSQL connected successfully");
}

async function connectRabbitMQ() {
  const connection = await amqp.connect(RABBITMQ_URL);

  try {
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    console.log("RabbitMQ connected successfully");

    return {
      connection,
      channel,
    };
  } catch (error) {
    await connection.close();
    throw error;
  }
}

async function getMonitors(): Promise<Monitor[]> {
  const result = await pool.query<Monitor>(`
    SELECT
      "id",
      "name",
      "url",
      "method",
      "intervalSeconds",
      "timeoutMs",
      "expectedStatusCode",
      "headers",
      "body",
      "lastCheckedAt",
      "lastScheduledAt"
    FROM "ApiMonitor"
    WHERE "enabled" = true
    ORDER BY "createdAt" ASC
  `);

  return result.rows;
}

function isDue(monitor: Monitor): boolean {
  if (monitor.lastScheduledAt === null) {
    return true;
  }

  const lastScheduled = new Date(monitor.lastScheduledAt).getTime();
  const interval = monitor.intervalSeconds * 1000;

  return Date.now() - lastScheduled >= interval;
}

async function claimMonitor(monitor: Monitor): Promise<boolean> {
  const now = new Date();

  const result = await pool.query(
    `
      UPDATE "ApiMonitor"
      SET "lastScheduledAt" = $1
      WHERE "id" = $2
        AND "enabled" = true
        AND (
          "lastScheduledAt" IS NULL
          OR "lastScheduledAt" <= $3
        )
      RETURNING "id"
    `,
    [now, monitor.id, new Date(now.getTime() - monitor.intervalSeconds * 1000)],
  );

  return result.rowCount === 1;
}

async function publishMonitorCheck(
  channel: amqp.Channel,
  monitor: Monitor,
): Promise<void> {
  const claimed = await claimMonitor(monitor);

  if (!claimed) {
    return;
  }

  const job: MonitorJob = {
    monitorId: monitor.id,
    url: monitor.url,
    method: monitor.method,
    timeoutMs: monitor.timeoutMs,
    expectedStatusCode: monitor.expectedStatusCode,
    ...(monitor.headers ? { headers: monitor.headers } : {}),
    ...(monitor.body ? { body: monitor.body } : {}),
  };

  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
    persistent: true,
  });

  console.log(`[Scheduler] Published check: ${monitor.name}`);
}

async function runScheduler(): Promise<void> {
  await connectDatabase();

  const { connection, channel } = await connectRabbitMQ();

  let running = false;
  let shuttingDown = false;

  async function checkDueMonitors(): Promise<void> {
    if (running || shuttingDown) {
      return;
    }

    running = true;

    try {
      const monitors = await getMonitors();
      let published = 0;

      for (const monitor of monitors) {
        if (!isDue(monitor)) {
          continue;
        }

        await publishMonitorCheck(channel, monitor);
        published++;
      }

      if (published > 0) {
        console.log(`[Scheduler] Published ${published} monitor check(s)`);
      }
    } catch (error) {
      console.error("[Scheduler] Error:", error);
    } finally {
      running = false;
    }
  }

  console.log("Scheduler started. Checking every 5s");

  await checkDueMonitors();

  const interval = setInterval(() => {
    void checkDueMonitors();
  }, SCHEDULER_INTERVAL);

  let shutdownPromise: Promise<void> | null = null;

  const shutdown = (): Promise<void> => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shuttingDown = true;
    console.log("\n[Scheduler] Shutting down...");
    clearInterval(interval);

    shutdownPromise = (async () => {
      try {
        await channel.close();
        await connection.close();
      } finally {
        await pool.end();
      }
    })();

    return shutdownPromise;
  };

  process.on("SIGINT", () => {
    void shutdown().catch((error) => {
      console.error("[Scheduler] Shutdown error:", error);
      process.exitCode = 1;
    });
  });

  process.on("SIGTERM", () => {
    void shutdown().catch((error) => {
      console.error("[Scheduler] Shutdown error:", error);
      process.exitCode = 1;
    });
  });
}

runScheduler().catch(async (error) => {
  console.error("[Scheduler] Fatal error:", error);

  try {
    await pool.end();
  } catch (cleanupError) {
    console.error("[Scheduler] Database cleanup error:", cleanupError);
  }

  process.exitCode = 1;
});
