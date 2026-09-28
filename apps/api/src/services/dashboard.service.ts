import { prisma } from "../config/database.js";

export async function getDashboard() {
  const [
    totalMonitors,
    upMonitors,
    downMonitors,
    degradedMonitors,
    unknownMonitors,
    activeIncidents,
    totalChecks,
    successfulChecks,
    failedChecks,
    recentIncidents,
    monitors,
  ] = await Promise.all([
    // Total monitors
    prisma.apiMonitor.count(),

    // UP monitors
    prisma.apiMonitor.count({
      where: {
        status: "UP",
      },
    }),

    // DOWN monitors
    prisma.apiMonitor.count({
      where: {
        status: "DOWN",
      },
    }),

    // DEGRADED monitors
    prisma.apiMonitor.count({
      where: {
        status: "DEGRADED",
      },
    }),

    // UNKNOWN monitors
    prisma.apiMonitor.count({
      where: {
        status: "UNKNOWN",
      },
    }),

    // Active incidents
    prisma.incident.count({
      where: {
        status: {
          in: ["OPEN", "ACKNOWLEDGED"],
        },
      },
    }),

    // Total checks
    prisma.apiMonitor.aggregate({
      _sum: {
        totalChecks: true,
      },
    }),

    // Successful checks
    prisma.apiMonitor.aggregate({
      _sum: {
        successfulChecks: true,
      },
    }),

    // Failed checks
    prisma.apiMonitor.aggregate({
      _sum: {
        failedChecks: true,
      },
    }),

    // Recent incidents
    prisma.incident.findMany({
      include: {
        monitor: {
          select: {
            id: true,
            name: true,
            url: true,
            status: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 10,
    }),

    // All monitors
    prisma.apiMonitor.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        method: true,
        status: true,
        enabled: true,
        intervalSeconds: true,
        timeoutMs: true,
        expectedStatusCode: true,
        lastCheckedAt: true,
        lastSuccessfulAt: true,
        lastFailedAt: true,
        totalChecks: true,
        successfulChecks: true,
        failedChecks: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  // -------------------------------------------------------
  // Overall check statistics
  // -------------------------------------------------------

  const total = totalChecks._sum.totalChecks ?? 0;

  const successful = successfulChecks._sum.successfulChecks ?? 0;

  const failed = failedChecks._sum.failedChecks ?? 0;

  const uptime =
    total > 0 ? Number(((successful / total) * 100).toFixed(2)) : 100;

  // -------------------------------------------------------
  // Return dashboard
  // -------------------------------------------------------

  return {
    overview: {
      totalMonitors,
      upMonitors,
      downMonitors,
      degradedMonitors,
      unknownMonitors,
      activeIncidents,
    },

    checks: {
      total,
      successful,
      failed,
      uptime,
    },

    monitors: monitors.map((monitor) => {
      const monitorTotal = monitor.totalChecks;

      const monitorSuccessful = monitor.successfulChecks;

      const monitorUptime =
        monitorTotal > 0
          ? Number(((monitorSuccessful / monitorTotal) * 100).toFixed(2))
          : 100;

      return {
        ...monitor,
        uptime: monitorUptime,
      };
    }),

    recentIncidents,
  };
}
