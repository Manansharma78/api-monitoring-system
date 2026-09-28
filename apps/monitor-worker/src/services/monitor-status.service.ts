import { prisma } from "@api-monitoring/database";

import type { MonitorCheckResult } from "./api-checker.js";

export async function updateMonitorStatus(result: MonitorCheckResult) {
  const now = new Date(result.checkedAt);

  const monitor = await prisma.apiMonitor.findUnique({
    where: {
      id: result.monitorId,
    },
  });

  if (!monitor) {
    throw new Error(`Monitor ${result.monitorId} not found`);
  }

  const updatedMonitor = await prisma.apiMonitor.update({
    where: {
      id: result.monitorId,
    },

    data: {
      status: result.success ? "UP" : "DOWN",

      lastCheckedAt: now,

      lastSuccessfulAt: result.success ? now : monitor.lastSuccessfulAt,

      lastFailedAt: result.success ? monitor.lastFailedAt : now,

      totalChecks: {
        increment: 1,
      },

      successfulChecks: {
        increment: result.success ? 1 : 0,
      },

      failedChecks: {
        increment: result.success ? 0 : 1,
      },
    },
  });

  console.log(`PostgreSQL monitor updated: ${updatedMonitor.name}`);

  console.log(`Status: ${updatedMonitor.status}`);

  console.log(`Total checks: ${updatedMonitor.totalChecks}`);

  console.log(`Successful checks: ${updatedMonitor.successfulChecks}`);

  console.log(`Failed checks: ${updatedMonitor.failedChecks}`);

  return updatedMonitor;
}
