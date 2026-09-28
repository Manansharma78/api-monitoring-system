import { MongoClient, type Db } from "mongodb";

const MONGODB_URL = process.env.MONGODB_URL ?? "mongodb://localhost:27017";

const MONGODB_DATABASE = process.env.MONGODB_DATABASE ?? "api_monitoring";

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  client = new MongoClient(MONGODB_URL);

  await client.connect();

  database = client.db(MONGODB_DATABASE);

  console.log("MongoDB connected successfully");
  console.log(`Database: ${MONGODB_DATABASE}`);

  return database;
}

export function getMongoDB(): Db {
  if (!database) {
    throw new Error("MongoDB is not connected");
  }

  return database;
}

export async function disconnectMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
  }

  console.log("MongoDB disconnected");
}
