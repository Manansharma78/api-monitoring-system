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

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://monitor:monitor_password@localhost:5672";

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

async function connectDatabase() {
  await pool.query("SELECT 1");

  console.log("PostgreSQL connected successfully");
}

async function connectRabbitMQ() {
  const connection = await amqp.connect(RABBITMQ_URL);

  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  console.log("RabbitMQ connected successfully");

  return {
    connection,
    channel,
  };
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
  const now = Date.now();

  /*
   * Never scheduled before.
   */
  if (monitor.lastScheduledAt === null) {
    return true;
  }

  const lastScheduled = new Date(monitor.lastScheduledAt).getTime();

  const interval = monitor.intervalSeconds * 1000;

  return now - lastScheduled >= interval;
}

async function claimMonitor(monitor: Monitor): Promise<boolean> {
  const now = new Date();

  /*
   * Atomically claim the monitor.

   * This prevents multiple scheduler iterations
   * from publishing the same monitor repeatedly.
   */
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

async function publishMonitorCheck(channel: amqp.Channel, monitor: Monitor) {
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

    ...(monitor.headers
      ? {
          headers: monitor.headers,
        }
      : {}),

    ...(monitor.body
      ? {
          body: monitor.body,
        }
      : {}),
  };

  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
    persistent: true,
  });

  console.log(`[Scheduler] Published check: ${monitor.name}`);
}

async function runScheduler() {
  await connectDatabase();

  const { connection, channel } = await connectRabbitMQ();

  let running = false;

  async function checkDueMonitors() {
    if (running) {
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

  const shutdown = async () => {
    console.log("\n[Scheduler] Shutting down...");

    clearInterval(interval);

    await channel.close();
    await connection.close();
    await pool.end();

    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
}

runScheduler().catch(async (error) => {
  console.error("[Scheduler] Fatal error:", error);

  await pool.end();

  process.exit(1);
});
