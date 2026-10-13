import "dotenv/config";
import amqp from "amqplib";

function getRabbitMQUrl(): string {
  const url = process.env.RABBITMQ_URL;

  if (!url) {
    throw new Error("RABBITMQ_URL environment variable is required");
  }

  return url;
}

const RABBITMQ_URL: string = getRabbitMQUrl();
const QUEUE_NAME = "monitor.check";

const monitorId = process.env.MONITOR_ID;

if (!monitorId) {
  throw new Error("MONITOR_ID environment variable is required");
}

async function publishMonitorJob() {
  const connection = await amqp.connect(RABBITMQ_URL);

  const channel = await connection.createChannel();

  try {
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    const job = {
      monitorId,
      url: "https://httpbin.org/get",
      method: "GET",
      timeoutMs: 10000,
      expectedStatusCode: 200,
    };

    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
      persistent: true,
    });

    console.log("Monitoring job published successfully:");
    console.log(job);
  } finally {
    await channel.close();
    await connection.close();
  }
}

publishMonitorJob().catch((error) => {
  console.error("Failed to publish monitoring job:", error);
  process.exit(1);
});
