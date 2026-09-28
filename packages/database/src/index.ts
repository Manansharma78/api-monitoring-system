import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../../apps/api/.env");

dotenv.config({
  path: envPath,
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(`DATABASE_URL is not defined. Expected .env at: ${envPath}`);
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({
  adapter,
});

export async function connectDatabase() {
  await prisma.$connect();

  console.log("PostgreSQL connected successfully");
}

export async function disconnectDatabase() {
  await prisma.$disconnect();

  console.log("PostgreSQL disconnected");
}
