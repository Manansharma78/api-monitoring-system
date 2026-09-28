import { prisma } from "../config/database.js";

export async function getIncidents(userId: string) {
  return prisma.incident.findMany({
    where: {
      userId,
    },

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
  });
}

export async function getOpenIncidents(userId: string) {
  return prisma.incident.findMany({
    where: {
      userId,
      status: {
        in: ["OPEN", "ACKNOWLEDGED"],
      },
    },

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
  });
}

export async function getIncident(userId: string, incidentId: string) {
  return prisma.incident.findFirst({
    where: {
      id: incidentId,
      userId,
    },

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
  });
}

export async function acknowledgeIncident(userId: string, incidentId: string) {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      userId,
      status: "OPEN",
    },
  });

  if (!incident) {
    return null;
  }

  return prisma.incident.update({
    where: {
      id: incidentId,
    },

    data: {
      status: "ACKNOWLEDGED",
    },
  });
}

export async function resolveIncident(userId: string, incidentId: string) {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      userId,
      status: {
        in: ["OPEN", "ACKNOWLEDGED"],
      },
    },
  });

  if (!incident) {
    return null;
  }

  return prisma.incident.update({
    where: {
      id: incidentId,
    },

    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });
}
