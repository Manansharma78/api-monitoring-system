import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
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
