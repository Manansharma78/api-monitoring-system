import amqp, { type Channel, type ChannelModel } from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ?? "amqp://monitor:monitor_password@localhost:5672";

const QUEUE_NAME = "monitor.check";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<Channel> {
  connection = await amqp.connect(RABBITMQ_URL);

  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  console.log("RabbitMQ connected successfully");
  console.log(`Queue "${QUEUE_NAME}" is ready`);

  return channel;
}

export function getRabbitMQChannel(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  return channel;
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }

  if (connection) {
    await connection.close();
    connection = null;
  }

  console.log("RabbitMQ connection closed");
}

export { QUEUE_NAME };
