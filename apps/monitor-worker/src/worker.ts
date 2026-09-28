import {
  connectRabbitMQ,
  getRabbitMQChannel,
  closeRabbitMQ,
  QUEUE_NAME,
} from "./config/rabbitmq.js";

import { connectMongoDB, closeMongoDB } from "./config/mongodb.js";

import { connectDatabase, disconnectDatabase } from "@api-monitoring/database";

import { checkApi, type MonitorJob } from "./services/api-checker.js";

import { saveCheckResult } from "./services/check-history.service.js";

import { updateMonitorStatus } from "./services/monitor-status.service.js";

import { handleMonitorIncident } from "./services/incident.service.js";

async function startWorker() {
  console.log("Monitor Worker starting...");

  // Connect to PostgreSQL
  await connectDatabase();

  // Connect to RabbitMQ
  await connectRabbitMQ();

  // Connect to MongoDB
  await connectMongoDB();

  const channel = getRabbitMQChannel();

  await channel.consume(QUEUE_NAME, async (message) => {
    if (!message) {
      return;
    }

    try {
      const content = message.content.toString();

      console.log("\n------------------------------");

      console.log("Monitoring job received");

      console.log("------------------------------");

      const job = JSON.parse(content) as MonitorJob;
      console.log("Full monitoring job:", job);

      console.log("Monitor ID:", job.monitorId);

      console.log("URL:", job.url);

      console.log("Method:", job.method);

      // Perform HTTP/API check
      const result = await checkApi(job);

      console.log("\nMonitoring result:");

      console.log(result);

      // Save detailed check history
      // into MongoDB
      await saveCheckResult(result);

      // Update current monitor state
      // and statistics in PostgreSQL
      await updateMonitorStatus(result);

      // Create or resolve incidents
      await handleMonitorIncident(result);

      // Acknowledge RabbitMQ message
      channel.ack(message);

      console.log("Monitoring job completed successfully.");

      console.log("------------------------------\n");
    } catch (error) {
      console.error("Error processing monitoring job:", error);

      /*
       * Do not requeue the message here.
       * This prevents an invalid job from
       * continuously retrying forever.
       */
      channel.nack(message, false, false);
    }
  });

  console.log("Monitor Worker is running.");

  console.log(`Listening for jobs on "${QUEUE_NAME}"`);
}

async function shutdown() {
  console.log("\nShutting down Monitor Worker...");

  try {
    await closeRabbitMQ();
  } catch (error) {
    console.error("Failed to close RabbitMQ:", error);
  }

  try {
    await closeMongoDB();
  } catch (error) {
    console.error("Failed to close MongoDB:", error);
  }

  try {
    await disconnectDatabase();
  } catch (error) {
    console.error("Failed to close PostgreSQL:", error);
  }

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startWorker().catch((error) => {
  console.error("Failed to start Monitor Worker:", error);

  process.exit(1);
});
