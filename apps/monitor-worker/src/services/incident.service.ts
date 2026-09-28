import { prisma } from "@api-monitoring/database";

import type { MonitorCheckResult } from "./api-checker.js";

export async function handleMonitorIncident(result: MonitorCheckResult) {
  const monitor = await prisma.apiMonitor.findUnique({
    where: {
      id: result.monitorId,
    },
  });

  if (!monitor) {
    throw new Error(`Monitor ${result.monitorId} not found`);
  }

  /*
   * FAILED CHECK
   */
  if (!result.success) {
    const existingIncident = await prisma.incident.findFirst({
      where: {
        monitorId: result.monitorId,
        status: {
          in: ["OPEN", "ACKNOWLEDGED"],
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    /*
     * No active incident exists.
     * Create exactly one.
     */
    if (!existingIncident) {
      const incident = await prisma.incident.create({
        data: {
          monitorId: result.monitorId,

          userId: monitor.userId,

          title: `${monitor.name} is down`,

          description: "The monitor check failed.",

          errorMessage: result.errorMessage,

          statusCode: result.statusCode,

          responseTime: result.responseTime,

          status: "OPEN",

          startedAt: new Date(result.checkedAt),
        },
      });

      console.log(`Incident created: ${incident.id}`);

      return;
    }

    /*
     * An incident already exists.
     *
     * Do NOT create another incident.
     * Update the existing incident with
     * the latest failure information.
     */
    await prisma.incident.update({
      where: {
        id: existingIncident.id,
      },

      data: {
        errorMessage: result.errorMessage,

        statusCode: result.statusCode,

        responseTime: result.responseTime,

        description: "The monitor is still failing.",
      },
    });

    console.log(`Existing incident updated: ${existingIncident.id}`);

    return;
  }

  /*
   * SUCCESSFUL CHECK
   *
   * If an active incident exists,
   * resolve it.
   */
  const openIncident = await prisma.incident.findFirst({
    where: {
      monitorId: result.monitorId,

      status: {
        in: ["OPEN", "ACKNOWLEDGED"],
      },
    },

    orderBy: {
      startedAt: "desc",
    },
  });

  if (!openIncident) {
    return;
  }

  await prisma.incident.update({
    where: {
      id: openIncident.id,
    },

    data: {
      status: "RESOLVED",

      resolvedAt: new Date(result.checkedAt),
    },
  });

  console.log(`Incident resolved: ${openIncident.id}`);
}
