import { prisma } from "../config/database.js";

interface CreateMonitorInput {
  name: string;
  description?: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCode: number;
  headers?: Record<string, string>;
  body?: string;
  enabled: boolean;
}

export async function createMonitor(data: CreateMonitorInput) {
  let user = await prisma.user.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@api-monitoring.local",
        name: "Demo User",
        passwordHash: "not-used",
      },
    });
  }

  return prisma.apiMonitor.create({
    data: {
      userId: user.id,
      name: data.name,
      description: data.description,
      url: data.url,
      method: data.method,
      intervalSeconds: data.intervalSeconds,
      timeoutMs: data.timeoutMs,
      expectedStatusCode: data.expectedStatusCode,
      headers: data.headers,
      body: data.body,
      enabled: data.enabled,
    },
  });
}

export async function getMonitors() {
  return prisma.apiMonitor.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMonitor(id: string) {
  return prisma.apiMonitor.findUnique({
    where: {
      id,
    },
  });
}

export async function updateMonitor(
  id: string,
  data: Partial<CreateMonitorInput>,
) {
  const existing = await prisma.apiMonitor.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.apiMonitor.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteMonitor(id: string) {
  const existing = await prisma.apiMonitor.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    return false;
  }

  await prisma.apiMonitor.delete({
    where: {
      id,
    },
  });

  return true;
}
